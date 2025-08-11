import os
import ee
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, BackgroundTasks, APIRouter, Depends
from pydantic import BaseModel, field_validator
import logging
from functools import lru_cache
import traceback
from tensorflow.keras.models import load_model
import tensorflow as tf

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
router = APIRouter()

# Pydantic models
class PolygonCoordinate(BaseModel):
    lat: float
    lon: float

class PolygonRequest(BaseModel):
    polygon: List[PolygonCoordinate]
    year: Optional[int] = 2023
    scale: Optional[int] = 10  # meters per pixel
    max_pixels: Optional[int] = 1000000  # Safety limit
    
    @field_validator('polygon')
    def validate_polygon(cls, v):
        if len(v) < 3:
            raise ValueError("Polygon must have at least 3 coordinates")
        return v

class MonthlyPixelData(BaseModel):
    month: str  # "YYYY-MM"
    features: Dict[str, float]
class PixelData(BaseModel):
    latitude: float
    longitude: float
    monthly_data: List[MonthlyPixelData]

class ClassificationResult(BaseModel):
    latitude: float
    longitude: float
    predicted_class: str
    confidence: Optional[float] = None

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None

# GEE Configuration
class GEEConfig:
    SENTINEL_2_BANDS = ['B1', 'B2', 'B3', 'B4', 'B8', 'B8A', 'B9', 'B11', 'B12']
    SENTINEL_1_BANDS = ['VV', 'VH']
    MONTHS_PER_YEAR = 12
    TOTAL_FEATURES = 18 
    # Fixed band order expected by the model
    MODEL_BAND_ORDER = [
        'NDWI','MNDWI','NDSI', 'NDVI', 'SAVI', 'NDMI', 'NDBI',
        'B3', 'B2', 'B4', 'B11', 'B8', 'B8A', 'B9', 'VV', 'VH', 'B1', 'B12'
    ]
    # Class names mapping
    CLASS_NAMES = {
        0: "Tree cover",
        1: "Shrubland",
        2: "GrassLand",
        3: "Cropland",
        4: "Built-up",
        5: "Bare/sparse vegetaion",
        6: "Snow and ice",
        7: "Permanet water bodies",
        8: "Herbaceous wetland",
        9: "Mangroves",
        10: "Moss and lichen",
    }

# Initialize GEE
def initialize_gee():
    """Initialize Google Earth Engine with service account authentication."""
    try:
            ee.Initialize(project=os.getenv("GEE_PROJECT_ID", "your-project-id"))
            logger.info("GEE initialized with default credentials")
            
    except Exception as e:
        logger.error(f"Failed to initialize GEE: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize Google Earth Engine")


class SatelliteDataProcessor:
    """Handles satellite data extraction and processing."""
    
    def __init__(self):
        self.config = GEEConfig()
    
    def create_polygon_geometry(self, coordinates: List[PolygonCoordinate]) -> ee.Geometry:
        """Convert polygon coordinates to GEE geometry."""
        coords = [[coord.lon, coord.lat] for coord in coordinates]
        # Ensure polygon is closed
        if coords[0] != coords[-1]:
            coords.append(coords[0])
        return ee.Geometry.Polygon([coords])
    
    def get_date_ranges(self, year: int) -> List[tuple]:
        """Get monthly date ranges for the specified year."""
        date_ranges = []
        for month in range(1, 13):
            start_date = datetime(year, month, 1)
            if month == 12:
                end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
            else:
                end_date = datetime(year, month + 1, 1) - timedelta(days=1)
            date_ranges.append((start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')))
        return date_ranges
    # Cloud bit masking for sentinel-2
    def mask_s2_scl(self, image):
        scl = image.select('SCL')
        valid_classes = ee.List([4, 5, 6, 7, 11])
        mask = scl.remap(valid_classes, ee.List.repeat(1, valid_classes.length())).eq(1)
        return image.updateMask(mask).copyProperties(image, ["system:time_start"])

    def get_sentinel2_collection(self, geometry: ee.Geometry, start_date: str, end_date: str) -> ee.ImageCollection:
        """Get filtered Sentinel-2 collection."""
        return (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                .filterBounds(geometry)
                .filterDate(start_date, end_date)
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                .map(self.mask_s2_scl)
                .select(self.config.SENTINEL_2_BANDS))
    
    def get_sentinel1_collection(self, geometry: ee.Geometry, start_date: str, end_date: str) -> ee.ImageCollection:
        """Get filtered Sentinel-1 collection."""
        return (ee.ImageCollection('COPERNICUS/S1_GRD')
                .filterBounds(geometry)
                .filterDate(start_date, end_date)
                .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
                .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
                .filter(ee.Filter.eq('instrumentMode', 'IW'))
                .select(self.config.SENTINEL_1_BANDS))
    
    def calculate_indices(self, s2_image: ee.Image, s1_image: ee.Image) -> ee.Image:
        """Calculate vegetation and water indices."""
        # NDVI (Normalized Difference Vegetation Index)
        ndvi = s2_image.normalizedDifference(['B8', 'B4']).rename('NDVI')
        
        # NDWI (Normalized Difference Water Index)
        ndwi = s2_image.normalizedDifference(['B3', 'B8']).rename('NDWI')

        ndsi = s2_image.normalizedDifference(['B3', 'B11']).rename('NDSI')

        ndmi = s2_image.normalizedDifference(['B8', 'B11']).rename('NDMI')

        ndbi = s2_image.normalizedDifference(['B11', 'B8']).rename('NDBI')



        
        # SAVI (Soil Adjusted Vegetation Index)
        savi = s2_image.expression(
            '((NIR - RED) / (NIR + RED + 0.5)) * 1.5',
            {
                'NIR': s2_image.select('B8'),
                'RED': s2_image.select('B4')
            }
        ).rename('SAVI')
        
        
        # MNDWI (Modified Normalized Difference Water Index)
        mndwi = s2_image.normalizedDifference(['B3', 'B11']).rename('MNDWI')
        
        
        return ee.Image.cat([ndvi, ndwi, savi, mndwi, ndsi, ndmi, ndbi])
    
    def process_monthly_data(self, geometry: ee.Geometry, year: int, scale: int) -> ee.Image:
        """Process monthly composite data for the entire year."""
        date_ranges = self.get_date_ranges(year)
        monthly_composites = []
        
        for i, (start_date, end_date) in enumerate(date_ranges):
            # Get Sentinel-2 monthly composite
            s2_collection = self.get_sentinel2_collection(geometry, start_date, end_date)
            s2_composite = s2_collection.median().clip(geometry)
            
            # Get Sentinel-1 monthly composite
            s1_collection = self.get_sentinel1_collection(geometry, start_date, end_date)
            s1_composite = s1_collection.median().clip(geometry)
            
            # Calculate indices
            indices = self.calculate_indices(s2_composite, s1_composite)
            
            # Combine all bands
            monthly_composite = ee.Image.cat([
                s2_composite.select(self.config.SENTINEL_2_BANDS),
                s1_composite.select(self.config.SENTINEL_1_BANDS),
                indices
            ])
            
            # Add month suffix to band names
            month_suffix = f"_M{i+1:02d}"
            band_names = monthly_composite.bandNames()
            new_band_names = band_names.map(lambda name: ee.String(name).cat(month_suffix))
            monthly_composite = monthly_composite.rename(new_band_names)
            
            monthly_composites.append(monthly_composite)
        
        # Combine all monthly composites
        return ee.Image.cat(monthly_composites)
    
    def extract_pixel_data(self, geometry: ee.Geometry, year: int, scale: int, max_pixels: int) -> Dict[str, Any]:
        try:
            # Process monthly data
            annual_composite = self.process_monthly_data(geometry, year, scale)
            band_names = annual_composite.bandNames().getInfo()
            
            # Precompute median dates for each month
            date_ranges = self.get_date_ranges(year)
            median_dates = []
            for start, end in date_ranges:
                start_dt = datetime.strptime(start, "%Y-%m-%d")
                end_dt = datetime.strptime(end, "%Y-%m-%d")
                median_dt = start_dt + (end_dt - start_dt) / 2
                median_dates.append(median_dt.strftime("%Y-%m-%d"))
            
            # Get polygon bounds
            bounds = geometry.bounds()
            coords = bounds.coordinates().get(0).getInfo()
            min_lon, min_lat = coords[0]
            max_lon, max_lat = coords[2]

            # Calculate optimal grid size - more conservative approach
            area = geometry.area(maxError=scale).getInfo()  # m²
            total_pixels_estimate = area / (scale * scale)
            
            # Use smaller tiles
            tiles_required = max(1, int(np.ceil(total_pixels_estimate / 1000)))
            grid_size = int(np.ceil(np.sqrt(tiles_required * 1.5)))  # 50% more tiles
            
            # Generate grid
            lon_steps = np.linspace(min_lon, max_lon, grid_size + 1)
            lat_steps = np.linspace(min_lat, max_lat, grid_size + 1)
            
            # Create tile geometries
            tiles = []
            for i in range(grid_size):
                for j in range(grid_size):
                    tile = ee.Geometry.Rectangle([
                        lon_steps[i], lat_steps[j],
                        lon_steps[i+1], lat_steps[j+1]
                    ])
                    clipped_tile = tile.intersection(geometry)
                    tile_area = clipped_tile.area(maxError=scale).getInfo()
                    if tile_area > 0:  # Only include non-empty tiles
                        expected_pixels = tile_area / (scale * scale)
                        tiles.append({
                            'geometry': clipped_tile,
                            'id': f"tile_{i+1}_{j+1}",
                            'expected_pixels': expected_pixels
                        })
            
            logger.info(f"Created {len(tiles)} tiles for processing")
            
            # Tile processing function with recursive splitting
            def process_tile(tile: Dict[str, Any], depth=0) -> List[Dict]:
                MAX_DEPTH = 3  # Maximum recursion depth
                tile_id = tile['id']
                tile_geom = tile['geometry']
                
                try:
                    start_time = datetime.now()
                    logger.info(f"Processing {tile_id} (depth {depth}) with ~{tile['expected_pixels']:.0f} pixels")
                    
                    # Get ALL pixels in tile
                    tile_img = annual_composite.addBands(ee.Image.pixelLonLat())
                    samples = tile_img.sample(
                        region=tile_geom,
                        scale=scale,
                        dropNulls=False,
                        geometries=True
                    )
                    
                    # Process results
                    tile_data = samples.getInfo()
                    pixels = []
                    for feature in tile_data['features']:
                        props = feature['properties']
                        coords = feature['geometry']['coordinates']
                        
                        monthly_features = []
                        for month in range(1, 13):
                            month_suffix = f"_M{month:02d}"
                            month_data = {}
                            
                            # Extract all bands for this month
                            for band_name in band_names:
                                if band_name.endswith(month_suffix):
                                    # Remove suffix to get base band name
                                    base_name = band_name.replace(month_suffix, "")
                                    value = props.get(band_name)
                                    if value is not None:
                                        month_data[base_name] = float(value)
                            
                            # Only add if we have data for this month
                            if month_data:
                                monthly_features.append({
                                    'month': median_dates[month-1],
                                    'features': month_data
                                })
                        
                        pixels.append({
                            'latitude': coords[1],
                            'longitude': coords[0],
                            'monthly_data': monthly_features
                        })
                    
                    duration = (datetime.now() - start_time).total_seconds()
                    logger.info(f"Completed {tile_id} in {duration:.2f}s - {len(pixels)} pixels extracted")
                    return pixels
                
                except Exception as e:
                    if "over 5000 elements" in str(e) and depth < MAX_DEPTH:
                        logger.warning(f"Tile {tile_id} too large, splitting into subtiles (depth {depth+1})")
                        
                        # Split tile into 4 smaller tiles
                        bounds = tile_geom.bounds()
                        coords = bounds.coordinates().get(0).getInfo()
                        min_lon, min_lat = coords[0]
                        max_lon, max_lat = coords[2]
                        mid_lon = (min_lon + max_lon) / 2
                        mid_lat = (min_lat + max_lat) / 2
                        
                        subtiles = [
                            [min_lon, min_lat, mid_lon, mid_lat],
                            [min_lon, mid_lat, mid_lon, max_lat],
                            [mid_lon, min_lat, max_lon, mid_lat],
                            [mid_lon, mid_lat, max_lon, max_lat]
                        ]
                        
                        all_pixels = []
                        for k, st in enumerate(subtiles):
                            subtile_geom = ee.Geometry.Rectangle(st)
                            clipped_subtile = subtile_geom.intersection(geometry)
                            sub_area = clipped_subtile.area(maxError=scale).getInfo()
                            
                            if sub_area > 0:
                                sub_expected = sub_area / (scale * scale)
                                subtile = {
                                    'geometry': clipped_subtile,
                                    'id': f"{tile_id}_sub{k+1}",
                                    'expected_pixels': sub_expected
                                }
                                all_pixels.extend(process_tile(subtile, depth+1))
                        
                        return all_pixels
                    else:
                        logger.error(f"Failed processing {tile_id}: {str(e)}")
                        logger.error(traceback.format_exc())
                        return []
            
            # Parallel processing with ThreadPoolExecutor
            all_pixels = []
            total_tiles = len(tiles)
            completed_tiles = 0
            
            # Use ThreadPoolExecutor for parallel tile processing
            with ThreadPoolExecutor(max_workers=8) as executor:
                futures = []
                for tile in tiles:
                    futures.append(executor.submit(process_tile, tile))
                
                for future in futures:
                    try:
                        pixels = future.result()
                        all_pixels.extend(pixels)
                        completed_tiles += 1
                        
                        # Progress logging
                        progress = completed_tiles / total_tiles * 100
                        current_pixels = len(all_pixels)
                        logger.info(f"Progress: {progress:.1f}% - Completed tiles: {completed_tiles}/{total_tiles} - Total pixels: {current_pixels}")
                        
                        # Check max_pixels limit
                        if current_pixels >= max_pixels:
                            logger.warning(f"Reached max_pixels limit ({max_pixels}), terminating early")
                            # Cancel remaining tasks
                            for f in futures:
                                if not f.done():
                                    f.cancel()
                            break
                    except Exception as e:
                        logger.error(f"Tile processing failed: {str(e)}")
            
            # Final status
            if not all_pixels:
                raise ValueError("No data points found in the specified geometry")
            
            # Apply max_pixels limit
            if len(all_pixels) > max_pixels:
                all_pixels = all_pixels[:max_pixels]
            
            # Get base band names (without month suffixes)
            base_bands = set()
            for band_name in band_names:
                # Remove month suffix (last 4 characters: _M##)
                base_name = band_name[:-4] if band_name.endswith(("_M01", "_M12")) else band_name
                base_bands.add(base_name)
            
            return {
                'pixel_data': all_pixels,
                'total_pixels': len(all_pixels),
                'bands_per_month': self.config.TOTAL_FEATURES,
                'months': self.config.MONTHS_PER_YEAR,
                'year': year,
                'feature_bands': sorted(list(base_bands))  
            }
            
        except Exception as e:
            logger.error(f"Error extracting pixel data: {e}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Error extracting satellite data: {str(e)}")

# Initialize processor
processor = SatelliteDataProcessor()

# Add Land Cover Classifier
class LandCoverClassifier:
    def __init__(self, model_path: str = "C:/Users/HF/Documents/GitHub/urban-mapping/urban-backend/models/LSTM_model_64.keras"):
        model_path = os.path.abspath(model_path)
        print("Current working directory:", os.getcwd())
        logger.info(f"Loading model from: {model_path}")
        
        # Verify file exists
        if not os.path.exists(model_path):
            logger.error(f"Model file not found at: {model_path}")
            available_files = os.listdir(os.path.dirname(model_path))
            logger.error(f"Available files: {available_files}")
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        try:
            # Load the trained model
            self.model = load_model(model_path)
            
            # Check for GPU acceleration
            gpu_devices = tf.config.list_physical_devices('GPU')
            if gpu_devices:
                tf.config.experimental.set_memory_growth(gpu_devices[0], True)
                logger.info("Using GPU acceleration for model inference")
            else:
                logger.info("Using CPU for model inference")
                
            logger.info("Land cover classifier loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load classification model: {str(e)}")
            raise RuntimeError("Could not initialize land cover classifier")

    def preprocess_pixel(self, pixel: Dict) -> np.ndarray:
        """Convert pixel data to model input format (12 months × 18 features)"""
        # Initialize array with zeros (handles missing data)
        features = np.zeros((12, len(GEEConfig.MODEL_BAND_ORDER)), dtype=np.float32)
        
        for monthly_data in pixel["monthly_data"]:
            try:
                # Extract month index from timestamp (e.g., "2023-03-15" -> 2)
                month_idx = int(monthly_data["month"].split("-")[1]) - 1
                if 0 <= month_idx < 12:
                    for band in GEEConfig.MODEL_BAND_ORDER:
                        # Get value if available, else keep 0
                        value = monthly_data["features"].get(band)
                        if value is not None:
                            band_idx = GEEConfig.MODEL_BAND_ORDER.index(band)
                            features[month_idx, band_idx] = float(value)
            except Exception as e:
                logger.warning(f"Error processing monthly data: {str(e)}")
        
        # Return 2D array (12, 18) - DO NOT FLATTEN
        return features
    
    def predict(self, pixels: List[Dict]) -> List[ClassificationResult]:
        """Predict land cover classes for all pixels"""
        if not pixels:
            return []
            
        logger.info(f"Starting classification for {len(pixels)} pixels")
        
        # Preprocess all pixels to 3D array (samples, months, features)
        X = np.array([self.preprocess_pixel(p) for p in pixels])
        
        # Predict in batches to manage memory
        batch_size = 1000
        results = []
        total_batches = (len(X) + batch_size - 1) // batch_size
        
        for batch_idx in range(total_batches):
            start_idx = batch_idx * batch_size
            end_idx = min((batch_idx + 1) * batch_size, len(X))
            batch = X[start_idx:end_idx]
            
            logger.info(f"Processing batch {batch_idx+1}/{total_batches} ({len(batch)} pixels)")
            
            # Run model prediction - input shape (batch_size, 12, 18)
            predictions = self.model.predict(batch, verbose=0)
            class_ids = np.argmax(predictions, axis=1)
            confidences = np.max(predictions, axis=1)
            
            # Create results
            for i in range(len(batch)):
                global_idx = start_idx + i
                results.append(ClassificationResult(
                    latitude=pixels[global_idx]["latitude"],
                    longitude=pixels[global_idx]["longitude"],
                    predicted_class=GEEConfig.CLASS_NAMES[class_ids[i]],
                    confidence=float(confidences[i])
                ))
        
        logger.info(f"Completed classification for {len(pixels)} pixels")
        return results

# Initialize classifier during startup
classifier = LandCoverClassifier()

@router.post("/classify-polygon", response_model=APIResponse)
async def classify_polygon(request: PolygonRequest):
    """
    End-to-end land cover classification for a polygon
    """
    try:
        logger.info(f"Classification request for polygon with {len(request.polygon)} vertices")
        
        # Create GEE geometry
        geometry = processor.create_polygon_geometry(request.polygon)
        
        # Extract pixel data
        start_extract = datetime.now()
        extraction_result = processor.extract_pixel_data(
            geometry, request.year, request.scale, request.max_pixels
        )
        extract_duration = (datetime.now() - start_extract).total_seconds()
        
        pixel_data = extraction_result['pixel_data']
        logger.info(f"Extracted {len(pixel_data)} pixels in {extract_duration:.2f}s")
        
        # Run classification
        start_classify = datetime.now()
        predictions = classifier.predict(pixel_data)
        classify_duration = (datetime.now() - start_classify).total_seconds()
        
        logger.info(f"Classified {len(predictions)} pixels in {classify_duration:.2f}s")
        
        return APIResponse(
            success=True,
            message=f"Classified {len(predictions)} pixels",
            data=[p.dict() for p in predictions],
            metadata={
                'total_pixels': len(predictions),
                'extraction_time': extract_duration,
                'classification_time': classify_duration,
                'total_time': extract_duration + classify_duration,
                'year': request.year,
                'scale': request.scale
            }
        )
        
    except Exception as e:
        logger.error(f"Classification error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# Export the router to be included in main.py
def init_gee_once():
    try:
        ee.Initialize(project=os.getenv("GEE_PROJECT_ID", "your-project-id"))
        logger.info("GEE initialized with default credentials")
    except Exception as e:
        logger.error(f"Failed to initialize GEE: {e}")
        raise RuntimeError("Failed to initialize GEE")

# Initialize on import
init_gee_once()

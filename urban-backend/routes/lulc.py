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

class PixelData(BaseModel):
    latitude: float
    longitude: float
    features: List[float]
    timestamp: str

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
    TOTAL_FEATURES = 18  # 9 S2 + 2 S1 + calculated indices
    
    # Class names mapping (adjust based on your model)
    CLASS_NAMES = {
        0: "Water",
        1: "Urban",
        2: "Barren",
        3: "Forest",
        4: "Grassland",
        5: "Agriculture",
        6: "Wetland",
        7: "Scrubland",
        8: "Snow",
        9: "Cloud",
        10: "Shadow"
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
        
        # EVI (Enhanced Vegetation Index)
        evi = s2_image.expression(
            '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))',
            {
                'NIR': s2_image.select('B8'),
                'RED': s2_image.select('B4'),
                'BLUE': s2_image.select('B2')
            }
        ).rename('EVI')
        
        # SAVI (Soil Adjusted Vegetation Index)
        savi = s2_image.expression(
            '((NIR - RED) / (NIR + RED + 0.5)) * 1.5',
            {
                'NIR': s2_image.select('B8'),
                'RED': s2_image.select('B4')
            }
        ).rename('SAVI')
        
        # BSI (Bare Soil Index)
        bsi = s2_image.expression(
            '((SWIR1 + RED) - (NIR + BLUE)) / ((SWIR1 + RED) + (NIR + BLUE))',
            {
                'SWIR1': s2_image.select('B11'),
                'RED': s2_image.select('B4'),
                'NIR': s2_image.select('B8'),
                'BLUE': s2_image.select('B2')
            }
        ).rename('BSI')
        
        # MNDWI (Modified Normalized Difference Water Index)
        mndwi = s2_image.normalizedDifference(['B3', 'B11']).rename('MNDWI')
        
        # RVI (Radar Vegetation Index) using Sentinel-1
        rvi = s1_image.expression(
            '4 * VH / (VV + VH)',
            {
                'VH': s1_image.select('VH'),
                'VV': s1_image.select('VV')
            }
        ).rename('RVI')
        
        return ee.Image.cat([ndvi, ndwi, evi, savi, bsi, mndwi, rvi])
    
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
            
            # Get polygon bounds
            bounds = geometry.bounds()
            coords = bounds.coordinates().get(0).getInfo()
            min_lon, min_lat = coords[0]
            max_lon, max_lat = coords[2]

            # Calculate optimal grid size
            area = geometry.area(maxError=scale).getInfo()  # m²
            total_pixels_estimate = area / (scale * scale)
            tiles_required = max(1, int(np.ceil(total_pixels_estimate / 4000)))
            grid_size = int(np.ceil(np.sqrt(tiles_required)))
            
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
                        tiles.append({
                            'geometry': clipped_tile,
                            'id': f"tile_{i+1}_{j+1}",
                            'expected_pixels': int(tile_area / (scale * scale))
                        })
            
            logger.info(f"Created {len(tiles)} tiles for processing (max {tiles_required} expected)")
            
            # Get band names for feature extraction
            band_names = annual_composite.bandNames().getInfo()
            
            # Tile processing function
            def process_tile(tile: Dict[str, Any]) -> List[Dict]:
                tile_id = tile['id']
                tile_geom = tile['geometry']
                try:
                    start_time = datetime.now()
                    logger.info(f"Processing {tile_id} with ~{tile['expected_pixels']} pixels")
                    
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
                        feature_dict = {band: props[band] for band in band_names}
                        pixels.append({
                            'latitude': coords[1],
                            'longitude': coords[0],
                            'features': feature_dict,
                            'timestamp': f"{year}-01-01"
                        })
                    
                    duration = (datetime.now() - start_time).total_seconds()
                    logger.info(f"Completed {tile_id} in {duration:.2f}s - {len(pixels)} pixels extracted")
                    return pixels
                except Exception as e:
                    logger.error(f"Failed processing {tile_id}: {str(e)}")
                    logger.error(traceback.format_exc())
                    return []  # Return empty on error
            
            # Parallel processing with ThreadPoolExecutor
            all_pixels = []
            processed_tiles = 0
            failed_tiles = 0
            total_tiles = len(tiles)
            
            # Use ThreadPoolExecutor for parallel tile processing
            with ThreadPoolExecutor(max_workers=8) as executor:
                futures = []
                for tile in tiles:
                    futures.append(executor.submit(process_tile, tile))
                
                for future in futures:
                    try:
                        pixels = future.result()
                        all_pixels.extend(pixels)
                        processed_tiles += 1
                        
                        # Progress logging
                        progress = processed_tiles / total_tiles * 100
                        logger.info(f"Progress: {progress:.1f}% - Total pixels: {len(all_pixels)}")
                        
                        # Check max_pixels limit
                        if len(all_pixels) >= max_pixels:
                            logger.warning(f"Reached max_pixels limit ({max_pixels}), terminating early")
                            # Cancel remaining tasks
                            for f in futures:
                                if not f.done():
                                    f.cancel()
                            break
                    except Exception as e:
                        failed_tiles += 1
                        logger.error(f"Tile processing failed: {str(e)}")
            
            # Final status
            logger.info(f"Tile processing completed: {processed_tiles} succeeded, {failed_tiles} failed")
            
            if not all_pixels:
                raise ValueError("No data points found in the specified geometry")
            
            # Apply max_pixels limit
            if len(all_pixels) > max_pixels:
                all_pixels = all_pixels[:max_pixels]
            
            return {
                'pixel_data': all_pixels,
                'total_pixels': len(all_pixels),
                'bands_per_month': self.config.TOTAL_FEATURES,
                'months': self.config.MONTHS_PER_YEAR,
                'year': year,
                'feature_bands': band_names 
            }
            
        except Exception as e:
            logger.error(f"Error extracting pixel data: {e}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Error extracting satellite data: {str(e)}")

# Initialize processor
processor = SatelliteDataProcessor()

@router.post("/extract-satellite-data", response_model=APIResponse)
async def extract_satellite_data(request: PolygonRequest):
    """
    Extract pixel-wise satellite data for land cover classification.
    
    This endpoint processes a polygon geometry and extracts Sentinel-1 and Sentinel-2
    data along with calculated vegetation/water indices for each pixel.
    """
    try:
        logger.info(f"Processing request for {len(request.polygon)} polygon coordinates")
        
        # Create GEE geometry
        geometry = processor.create_polygon_geometry(request.polygon)
        
        # Extract pixel data
        result = processor.extract_pixel_data(
            geometry=geometry,
            year=request.year,
            scale=request.scale,
            max_pixels=request.max_pixels
        )
        
        return APIResponse(
            success=True,
            message=f"Successfully extracted data for {result['total_pixels']} pixels",
            data=result['pixel_data'],
            metadata={
                'total_pixels': result['total_pixels'],
                'bands_per_month': result['bands_per_month'],
                'months': result['months'],
                'year': result['year'],
                'scale': request.scale,
                'feature_count': result['bands_per_month'] * result['months'],
                'feature_bands': result['feature_bands']
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing request: {e}")
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

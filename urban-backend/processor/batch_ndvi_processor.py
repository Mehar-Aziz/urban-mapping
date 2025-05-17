import ee
import json
import mysql.connector
from datetime import datetime, timedelta
from database.connect_db import connect_db

# GEE Authentication
ee.Initialize(project = 'ee-sp22-bse-059')

# Database Configuration
db = connect_db()

def get_date_range():
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    return start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')

uc_collection = ee.FeatureCollection("projects/ee-sp22-bse-059/assets/lahore_ucs_shapefile")

def compute_ndvi(uc_feature):
    """Calculate NDVI for a Union Council feature with robust error handling."""
    try:
        # Get UC identifier
        uc_id = uc_feature.get('UC').getInfo()
        print(f"\n🏙 Processing UC: {uc_id}")

        # 1. Date Range Setup (Last 30 days)
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        # 2. Get Sentinel-2 imagery
        s2_collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                         .filterDate(start_date, end_date)
                         .filterBounds(uc_feature.geometry())
                         .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 20)))

        # 3. Check image availability
        if s2_collection.size().getInfo() == 0:
            print(f"☁️ No cloud-free images found for {uc_id} (Last 30 days)")
            return None

        # 4. Calculate NDVI
        image = s2_collection.median()
        ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
        
        # 5. Calculate mean NDVI with validation
        stats = ndvi.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=uc_feature.geometry(),
            scale=10,
            maxPixels=1e10
        )
        
        mean_ndvi = stats.get('NDVI')
        if not mean_ndvi:
            print(f"⚠️ No NDVI values calculated for {uc_id}")
            return None

        # 6. Return feature with NDVI property
        ndvi_value = mean_ndvi.getInfo()
        print(f"✅ Success: {uc_id} NDVI = {ndvi_value:.4f}")
        
        return uc_feature.set({
            'NDVI': ndvi_value,
            'uc_id': uc_id,
            'start_date': start_date,
            'end_date': end_date
        })

    except ee.EEException as gee_error:
        print(f"🌍 GEE API Error in {uc_id}: {str(gee_error)}")
        return None
    except Exception as generic_error:
        print(f"🔥 Unexpected error processing {uc_id}: {str(generic_error)}")
        return None

def process_batch(batch):
    """Process a batch of Union Councils and save results to database"""
    cursor = None
    try:
        cursor = db.cursor()
        batch_start_time = datetime.utcnow().isoformat() + "Z"
        processed_count = 0

        for uc in batch:
            try:
                # Convert to EE Feature
                ee_feature = ee.Feature(uc)
                
                # Compute NDVI
                result = compute_ndvi(ee_feature)
                if not result:
                    continue
                
                # Get result data
                feature_info = result.getInfo()
                
                # Validate and format GeoJSON
                valid_geojson = {
                    "type": "Feature",
                    "geometry": feature_info['geometry'],
                    "properties": {
                        "uc_id": feature_info['properties']['uc_id'],
                        "NDVI": feature_info['properties']['NDVI'],
                        "timestamp": batch_start_time
                    }
                }
                
                # Database insertion
                cursor.execute(
                    """INSERT INTO uc_analysis 
                    (uc_id, analysis_type, result_geojson, analysis_date)
                    VALUES (%s, %s, %s, %s)""",
                    (
                        valid_geojson['properties']['uc_id'],
                        'ndvi',
                        json.dumps(valid_geojson),
                        batch_start_time
                    )
                )
                processed_count += 1

            except Exception as uc_error:
                print(f"⚠️ Failed UC {uc.get('id', 'unknown')}: {str(uc_error)}")
                continue

        db.commit()
        print(f"✅ Successfully processed {processed_count}/{len(batch)} UCs in batch")
        return processed_count

    except Exception as batch_error:
        print(f"❌ Critical batch failure: {str(batch_error)}")
        db.rollback()
        return 0
        
    finally:
        if cursor:
            cursor.close()
# Remove limit(1) and use proper batching
uc_list = uc_collection.toList(uc_collection.size())
total_ucs = uc_collection.size().getInfo()
batch_size = 1  # For testing

for i in range(0, total_ucs, batch_size):
    batch = uc_list.slice(i, min(i+batch_size, total_ucs))
    process_batch(batch.getInfo())

if __name__ == "__main__":
    try:
        print(f"Total UCs: {uc_collection.size().getInfo()}")
        # Your processing loop
    except Exception as e:
        print(f"Fatal error: {str(e)}")
    finally:
        db.close()
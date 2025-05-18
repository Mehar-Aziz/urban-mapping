import ee
import json
import mysql.connector
from datetime import datetime, timedelta, UTC
from database.connect_db import connect_db

# GEE Authentication
ee.Initialize(project='ee-sp22-bse-059')

# Database Configuration
db = connect_db()

def get_date_range():
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    return start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')

uc_collection = ee.FeatureCollection("projects/ee-sp22-bse-059/assets/lahore_ucs_shapefile")

def calculate_lst(image):
    """Convert Landsat 8 ST_B10 to Land Surface Temperature (LST) in Kelvin"""
    return image.select('ST_B10') \
               .multiply(0.00341802) \
               .add(149.0) \
               .rename('LST')

def compute_thermal(uc_feature):
    """Calculate Land Surface Temperature for a Union Council"""
    try:
        uc_id = uc_feature.get('UC').getInfo()
        print(f"\n🌡 Processing UC: {uc_id}")

        # 1. Date Range Setup (Last 30 days)
        start_date, end_date = get_date_range()

        # 2. Get Landsat 8 imagery
        landsat_collection = (ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
                              .filterDate(start_date, end_date)
                              .filterBounds(uc_feature.geometry())
                              .select(['ST_B10']))

        # 3. Check image availability
        if landsat_collection.size().getInfo() == 0:
            print(f"☁️ No Landsat data found for {uc_id} (Last 30 days)")
            return None

        # 4. Calculate mean LST
        lst_collection = landsat_collection.map(calculate_lst)
        mean_lst = lst_collection.mean()

        # 5. Calculate zonal statistics
        stats = mean_lst.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=uc_feature.geometry(),
            scale=1000,  # Matching GEE script scale
            maxPixels=1e10
        )

        lst_value = stats.get('LST')
        if not lst_value:
            print(f"⚠️ No LST values calculated for {uc_id}")
            return None

        # Convert Kelvin to Celsius for storage
        lst_celsius = lst_value.getInfo() - 273.15
        print(f"✅ Success: {uc_id} LST = {lst_celsius:.2f}°C")

        return uc_feature.set({
            'LST': lst_celsius,
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
    """Process a batch of Union Councils for thermal analysis"""
    cursor = None
    try:
        cursor = db.cursor()
        batch_start_time = datetime.now(UTC).strftime('%Y-%m-%d %H:%M:%S')
        processed_count = 0

        for uc in batch:
            try:
                ee_feature = ee.Feature(uc)
                result = compute_thermal(ee_feature)
                
                if not result:
                    continue

                feature_info = result.getInfo()
                
                # Thermal-specific GeoJSON
                valid_geojson = {
                    "type": "Feature",
                    "geometry": feature_info['geometry'],
                    "properties": {
                        "uc_id": feature_info['properties']['uc_id'],
                        "LST": feature_info['properties']['LST'],
                        "timestamp": batch_start_time
                    }
                }

                cursor.execute(
                    """INSERT INTO uc_analysis 
                    (uc_id, analysis_type, result_geojson, analysis_date)
                    VALUES (%s, %s, %s, %s)""",
                    (
                        valid_geojson['properties']['uc_id'],
                        'thermal',
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

# Batch processing setup
uc_list = uc_collection.toList(uc_collection.size())
total_ucs = uc_collection.size().getInfo()
batch_size = 10  # Optimal for thermal processing

for i in range(0, total_ucs, batch_size):
    batch = uc_list.slice(i, min(i + batch_size, total_ucs))
    process_batch(batch.getInfo())

if __name__ == "__main__":
    try:
        print(f"Total UCs: {uc_collection.size().getInfo()}")
    except Exception as e:
        print(f"Fatal error: {str(e)}")
    finally:
        db.close()
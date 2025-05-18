import ee
import json
import mysql.connector
from datetime import datetime, timedelta, UTC
from database.connect_db import connect_db

ee.Initialize(project='ee-sp22-bse-059')
db = connect_db()

AQI_BREAKPOINTS = {
    'NO2': [    # mol/m² × 1e5 for conversion
        (0, 5.3, 0, 50), (5.3, 10, 51, 100), (10, 36, 101, 150),
        (36, 65, 151, 200), (65, 125, 201, 300)
    ],
    'SO2': [
        (0, 3.6, 0, 50), (3.6, 7.5, 51, 100), (7.5, 18.5, 101, 150),
        (18.5, 30.4, 151, 200), (30.4, 60.4, 201, 300)
    ],
    'CO': [     # Converted to mg/m³ (1 mol/m² ≈ 1.15 mg/m³)
        (0, 0.65, 0, 50), (0.65, 1.2, 51, 100), (1.2, 1.9, 101, 150),
        (1.9, 3.1, 151, 200), (3.1, 5.0, 201, 300)
    ],
    'O3': [
        (0, 108, 0, 50),      # Good (0-108 µg/m³)
        (109, 140, 51, 100),  # Moderate (109-140 µg/m³)
        (141, 170, 101, 150), # Unhealthy for sensitive groups
        (171, 210, 151, 200), # Unhealthy
        (211, 400, 201, 300)
        ]
}

def get_date_range():
    end_date = datetime.now(UTC)
    start_date = end_date - timedelta(days=30)
    return start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')

def calculate_subindex(value, pollutant):
    """Calculate AQI sub-index using linear interpolation"""
    for bp in AQI_BREAKPOINTS[pollutant]:
        c_low, c_high, i_low, i_high = bp
        if c_low <= value <= c_high:
            print(f"🔍 {pollutant} value {value} fits in range {c_low}-{c_high} → AQI {i_low}-{i_high}")
            return i_low + (value - c_low) * (i_high - i_low) / (c_high - c_low)
    print(f"⚠️ {pollutant} value {value} out of range! Using 0")
    return 0 

def compute_aqi(uc_feature):
    try:
        uc_id = uc_feature.get('UC').getInfo()
        print(f"\n🌫 Processing UC: {uc_id}")

        # Date range for analysis
        start_date, end_date = get_date_range()

        collections = {
            'NO2': ('COPERNICUS/S5P/OFFL/L3_NO2', 'NO2_column_number_density', 1e5),
            'SO2': ('COPERNICUS/S5P/OFFL/L3_SO2', 'SO2_column_number_density', 1e5),
            'CO': ('COPERNICUS/S5P/OFFL/L3_CO', 'CO_column_number_density', 1.15),
            'O3': ('COPERNICUS/S5P/OFFL/L3_O3', 'O3_column_number_density', 2e3)
        }

        pollutant_data = {}
        for pol, (collection_id, band, conv) in collections.items():
            try:
                img_col = ee.ImageCollection(collection_id) \
                    .filterDate(start_date, end_date) \
                    .filterBounds(uc_feature.geometry()) 
                if img_col.size().getInfo() == 0:
                    print(f"⚠️ No images found for {pol} ({collection_id})")
                    pollutant_data[pol] = 0
                    continue
                
                img = img_col.select(band).mean().multiply(conv)
                
                stats = img.reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=uc_feature.geometry(),
                    scale=5000
                )
                
                value = stats.get(band).getInfo()
                pollutant_data[pol] = calculate_subindex(value, pol) if value else 0
            except Exception as e:
                pollutant_data[pol] = 0

        # Calculate overall AQI
        aqi = max(pollutant_data.values())
        print(f"✅ AQI Components: {pollutant_data}")
        print(f"🚨 Final AQI: {aqi:.1f}")

        return uc_feature.set({
            'AQI': aqi,
            **{f'{k}_AQI': v for k, v in pollutant_data.items()},
            'uc_id': uc_id,
            'start_date': start_date,
            'end_date': end_date
        })

    except Exception as e:
        print(f"🔥 AQI Error: {str(e)}")
        return None

def process_batch(batch):
    cursor = None
    try:
        cursor = db.cursor()
        batch_time = datetime.now(UTC).strftime('%Y-%m-%d %H:%M:%S')
        processed = 0

        for uc in batch:
            try:
                result = compute_aqi(ee.Feature(uc))
                if not result: continue

                feature = result.getInfo()
                geojson = {
                    "type": "Feature",
                    "geometry": feature['geometry'],
                    "properties": {
                        'uc_id': feature['properties']['uc_id'],
                        'AQI': feature['properties']['AQI'],
                        'NO2_AQI': feature['properties']['NO2_AQI'],
                        'SO2_AQI': feature['properties']['SO2_AQI'],
                        'O3_AQI': feature['properties']['O3_AQI'],
                        'timestamp': batch_time
                    }
                }

                cursor.execute(
                    """INSERT INTO uc_analysis 
                    (uc_id, analysis_type, result_geojson, analysis_date)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE 
                    result_geojson=VALUES(result_geojson), 
                    analysis_date=VALUES(analysis_date)""",
                    (geojson['properties']['uc_id'], 'air_quality', 
                     json.dumps(geojson), batch_time)
                )
                processed += 1

            except Exception as e:
                print(f"⚠️ Failed UC: {str(e)}")

        db.commit()
        print(f"✅ Processed {processed}/{len(batch)} UCs")
        return processed

    except Exception as e:
        print(f"❌ Batch Failed: {str(e)}")
        db.rollback()
        return 0
    finally:
        if cursor: cursor.close()

# Batch processing setup
uc_collection = ee.FeatureCollection("projects/ee-sp22-bse-059/assets/lahore_ucs_shapefile")
uc_list = uc_collection.toList(uc_collection.size())
total_ucs = uc_collection.size().getInfo()

for i in range(0, total_ucs, 5):  # Optimal batch size for AQI
    batch = uc_list.slice(i, min(i+5, total_ucs)).getInfo()
    process_batch(batch)

if __name__ == "__main__":
    try:
        print(f"Total UCs: {total_ucs}")
    except Exception as e:
        print(f"Fatal Error: {str(e)}")
    finally:
        db.close()
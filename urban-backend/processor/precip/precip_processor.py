import ee
from datetime import datetime, timedelta

# Initialize GEE
ee.Initialize()

def get_precipitation_tile_url(date_str):
    # Example dataset: CHIRPS Daily
    dataset = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY") \
        .filterDate(date_str, date_str) \
        .mean()

    vis_params = {
        'min': 0,
        'max': 100,
        'palette': ['blue', 'cyan', 'green', 'yellow', 'red']
    }

    map_id_dict = ee.Image(dataset).getMapId(vis_params)
    return map_id_dict['tile_fetcher'].url_format

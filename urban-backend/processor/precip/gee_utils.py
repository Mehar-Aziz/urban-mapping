import ee
from datetime import datetime
ee.Initialize()

def get_today_precip_tile_url():
    today = datetime.now().strftime('%Y-%m-%d')
    collection = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY").filterDate(today, today)
    image = collection.mean()
    vis_params = {'min': 0, 'max': 100, 'palette': ['blue', 'green', 'red']}
    map_id_dict = ee.Image(image).getMapId(vis_params)
    return map_id_dict['tile_fetcher'].url_format

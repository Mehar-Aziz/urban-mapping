import geopandas as gpd
from shapely.geometry import shape
import json

def convert_geojson_to_kml(geojson_data):
    geojson_dict = json.loads(geojson_data)
    gdf = gpd.GeoDataFrame.from_features(geojson_dict["features"])
    return gdf.to_file(driver="KML")

from fastkml import kml
import json
from shapely.geometry import mapping

def convert_kml_to_geojson(kml_file_path):
    with open(kml_file_path, "r", encoding="utf-8") as file:
        kml_data = file.read()

    k = kml.KML()
    k.from_string(kml_data)

    geojson_features = []

    for feature in k.features():
        for placemark in feature.features():
            if hasattr(placemark, "geometry") and placemark.geometry:
                geojson_features.append({
                    "type": "Feature",
                    "geometry": mapping(placemark.geometry),
                    "properties": {}
                })

    return {"type": "FeatureCollection", "features": geojson_features}

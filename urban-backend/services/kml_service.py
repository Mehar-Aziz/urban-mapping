import logging
import os
import kml2geojson
from fastapi import HTTPException

logger = logging.getLogger(__name__)

def convert_kml_to_geojson(kml_bytes: bytes):
    """
    Converts KML bytes to GeoJSON.
    """
    try:
        # Write the KML bytes to a temporary file
        temp_file_path = "temp.kml"
        with open(temp_file_path, "wb") as temp_file:
            temp_file.write(kml_bytes)

        # Convert the KML file to GeoJSON using kml2geojson
        geojson_data = kml2geojson.convert(temp_file_path)

        # Clean up the temporary file
        os.remove(temp_file_path)

        # Return the first GeoJSON object
        if geojson_data:
            return geojson_data[0]
        else:
            raise ValueError("No valid GeoJSON data found in the KML file.")
    
    except Exception as e:
        logger.error(f"Error converting KML: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error converting KML: {str(e)}")
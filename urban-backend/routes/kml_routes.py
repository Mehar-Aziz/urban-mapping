from fastapi import APIRouter, File, UploadFile, HTTPException
from services.kml_service import convert_kml_to_geojson

router = APIRouter()

@router.post("/convert-kml")
async def convert_kml(file: UploadFile = File(...)):
    """
    Endpoint to upload a KML file and convert it to GeoJSON.
    """
    try:
        # Validate file type
        if not file.filename.endswith(".kml"):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .kml file.")

        # Read the uploaded file
        kml_bytes = await file.read()
        if not kml_bytes:
            raise HTTPException(status_code=400, detail="Empty file received.")

        # Convert KML to GeoJSON
        geojson = convert_kml_to_geojson(kml_bytes)
        return {"geoJson": geojson}

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
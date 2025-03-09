from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Location
from services.kml_converter import convert_geojson_to_kml

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/save-location/")
def save_location(name: str, geojson: str, projection: str, db: Session = Depends(get_db)):
    if projection not in ["Pakistan", "UAE"]:
        raise HTTPException(status_code=400, detail="Invalid projection. Only Pakistan and UAE are allowed.")
    
    kml_data = convert_geojson_to_kml(geojson)  # Convert to KML before saving
    
    new_location = Location(name=name, geojson=geojson, kml=kml_data, projection=projection)
    db.add(new_location)
    db.commit()
    
    return {"message": "Location saved successfully!"}

@router.get("/get-locations/")
def get_locations(db: Session = Depends(get_db)):
    locations = db.query(Location).all()
    return locations

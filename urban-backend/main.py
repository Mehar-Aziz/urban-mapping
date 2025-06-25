from fastapi import FastAPI,HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from routes.kml_routes import router as kml_router
from routes import auth
from database.database import engine, Base
from fastapi.responses import FileResponse
import os
import database, json
from database.connect_db import connect_db


Base.metadata.create_all(bind=engine)

app = FastAPI()
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
origins = ['http://localhost:3000']
# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
db=connect_db
app.include_router(auth.router)
# Include the KML routes
app.include_router(kml_router, prefix="/api")

#lahore UCs
@app.get("/geojson/lahore-ucs")
def get_uc_geojson():
    file_path = os.path.join("data", "lahore_ucs.geojson")
    return FileResponse(file_path, media_type="application/json")

@app.get("/geojson/ndvi")
def get_ndvi_geojson():
    file_path = os.path.join("data", "NDVI_Lahore_UCs_GeoJSON.geojson")
    return FileResponse(file_path, media_type="application/json")

@app.get("/geojson/thermal")
def get_thermal_data():
    file_path = os.path.join("data", "LST_Per_UC.geojson")
    return FileResponse(file_path, media_type="application/json")

@app.get("/geojson/air-quality")
def get_air_quality_geojson():
    file_path = os.path.join("data", "AQI.geojson")
    return FileResponse(file_path, media_type="application/json")

@app.get("/uc-data/{analysis_type}")
async def get_uc_data(analysis_type: str):
    db_connection = connect_db()
    cursor = db_connection.cursor(dictionary=True)
    
    try:
        cursor.execute(
            "SELECT result_geojson FROM uc_analysis WHERE analysis_type = %s",
            (analysis_type,)
        )
        results = cursor.fetchall()
        
        if not results:
            raise HTTPException(status_code=404, detail="No data found")
        
        # Create a proper FeatureCollection
        features = [json.loads(row['result_geojson']) for row in results]
        feature_collection = {
            "type": "FeatureCollection",
            "features": features
        }
        
        return feature_collection  # Directly return GeoJSON structure
        
    except Exception as e:
        print(f"Database Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        cursor.close()
        db_connection.close()

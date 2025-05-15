from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.kml_routes import router as kml_router
from routes import auth
from database import engine, Base
from fastapi.responses import FileResponse
import os


Base.metadata.create_all(bind=engine)

app = FastAPI()
origins = ['http://localhost:3000']
# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


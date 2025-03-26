from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.kml_routes import router as kml_router
from routes import auth
from database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI()
origins = ['http://localhost:3000']
# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
# Include the KML routes
app.include_router(kml_router, prefix="/api")

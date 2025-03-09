from fastapi import FastAPI
from database import engine, Base
from routes.location_routes import router as location_router

app = FastAPI()

# Create tables
Base.metadata.create_all(bind=engine)

# Register routes
app.include_router(location_router, prefix="/api")

@app.get("/")
def home():
    return {"message": "Urban Mapping API is running"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.kml_routes import router as kml_router

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the KML routes
app.include_router(kml_router, prefix="/api")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "Backend is running!"}
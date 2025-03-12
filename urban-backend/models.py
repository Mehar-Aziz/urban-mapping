from sqlalchemy import Column, Integer, String, Text, TIMESTAMP
from database import Base  # Ensure 'Base' is properly imported

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    geojson = Column(Text, nullable=True)  # Store GeoJSON data
    kml = Column(Text, nullable=True)      # Store converted KML data
    projection = Column(String(50), nullable=True)
    created_at = Column(TIMESTAMP, nullable=False)

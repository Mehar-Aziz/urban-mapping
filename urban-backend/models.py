from sqlalchemy import Column, Integer, String, Text, TIMESTAMP
from database import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    geojson = Column(Text)  # Store GeoJSON data
    kml = Column(Text)      # Store converted KML data
    projection = Column(String(50))
    created_at = Column(TIMESTAMP)

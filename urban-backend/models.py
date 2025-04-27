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

class User(Base):
    __tablename__ = 'users'
    __table_args__ = {'schema': 'urbandb'}
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)  

class Project(Base):
    __tablename__ = "projects"
    __table_args__ = {'schema': 'urbandb'}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, nullable=False)  # To associate projects with users
    created_at = Column(TIMESTAMP, nullable=False)
from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, JSON, Enum
from database.database import Base  
from sqlalchemy.sql import text 

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    geojson = Column(Text, nullable=True)  
    kml = Column(Text, nullable=True)
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

class UCBoundary(Base):
    __tablename__ = "uc_boundaries"
    __table_args__ = {'schema': 'urbandb'}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    geometry = Column(JSON, nullable=False)

class UC_analysis(Base):
    __tablename__ = "uc_analysis"
    __table_args__ = {'schema': 'urbandb'}
    
    id = Column(Integer, primary_key=True, index=True)
    uc_id = Column(String(255), nullable=False)
    analysis_type = Column(
        Enum('ndvi', 'thermal', 'air_quality', name='analysis_types'),
        nullable=False
    )
    result_geojson = Column(JSON, nullable=False)
    analysis_date = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text('CURRENT_TIMESTAMP')
    )
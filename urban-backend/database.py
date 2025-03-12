from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base  # Ensure declarative_base is imported
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Define Base before importing it anywhere else
Base = declarative_base()

# Database connection URL
DATABASE_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER')}:{os.getenv('MYSQL_PASSWORD')}@{os.getenv('MYSQL_HOST')}:{os.getenv('MYSQL_PORT')}/{os.getenv('MYSQL_DATABASE')}"

# Create engine
engine = create_engine(DATABASE_URL)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

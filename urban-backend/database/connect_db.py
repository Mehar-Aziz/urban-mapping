from urllib.parse import urlparse
import os
from dotenv import load_dotenv
import mysql.connector

load_dotenv()

def connect_db():
    db_url = os.getenv("DATABASE_URL")
    if db_url.startswith("mysql+mysqlconnector://"):
        db_url = db_url.replace("mysql+mysqlconnector://", "mysql://")

    parsed = urlparse(db_url)

    return mysql.connector.connect(
        host=parsed.hostname,
        port=parsed.port or 3306,
        user=parsed.username,
        password=parsed.password,
        database=parsed.path.lstrip('/')
    )

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DB_USER = os.getenv("POSTGRES_USER", "trainsAdmin")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "brokentrack")
DB_NAME = os.getenv("POSTGRES_DB", "trains")
DB_HOST = os.getenv("DB_HOST", "db")  # service name from docker-compose
DB_PORT = os.getenv("DB_PORT", "5432")

DATABASE_URL = f"postgresql+psycopg://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()
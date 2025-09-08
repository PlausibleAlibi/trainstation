import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# --- Database URL resolution ---
# Prefer a full DATABASE_URL (e.g. for prod), otherwise build from parts.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DB_USER = os.getenv("POSTGRES_USER", "trainsAdmin")
    DB_PASS = os.getenv("POSTGRES_PASSWORD", "brokentrack")
    DB_NAME = os.getenv("POSTGRES_DB", "trains")
    DB_HOST = os.getenv("DB_HOST", "db")  # service name from docker-compose
    DB_PORT = os.getenv("DB_PORT", "5432")

    # Use psycopg2 driver
    DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# --- SQLAlchemy setup ---
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

Base = declarative_base()
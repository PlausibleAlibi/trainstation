from logging.config import fileConfig
from alembic import context

import os, sys
from pathlib import Path

# --- Make sure /app is on sys.path ---
BASE_DIR = Path(__file__).resolve().parent.parent  # /app
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

# --- Import your app's engine & metadata ---
from app.db import Base, engine  # engine already uses .env via app/db.py
from app import models  # noqa: F401  (populate Base.metadata)

# --- Alembic Config & logging ---
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline():
    """Run migrations without a live DB connection."""
    url = str(engine.url)
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Run migrations with a live DB connection."""
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
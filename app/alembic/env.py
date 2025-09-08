from __future__ import annotations
import os, sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Make sure /app (project root) is on sys.path so 'import models' works
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

config = context.config

# Optional logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import your SQLAlchemy models (top-level module)
from models import Base
target_metadata = Base.metadata

# Resolve DB URL from env; fall back to alembic.ini if present
db_url = os.getenv(
    "DATABASE_URL",
    config.get_main_option("sqlalchemy.url", "postgresql+psycopg2://trainsAdmin:brokentrack@db:5432/trains"),
)
config.set_main_option("sqlalchemy.url", db_url)

def run_migrations_offline() -> None:
    context.configure(
        url=db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
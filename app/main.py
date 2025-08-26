import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, engine
from .routers import categories, accessories, actions
from .routers import actions

# --- Logging ---
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# --- FastAPI App ---
app = FastAPI(title="Lionel Control API")

# --- Middleware (CORS for future web UI) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://trainset.local",
        "http://localhost:5173",   # Vite default
        "http://localhost:3000"    # React default
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Health Check ---
@app.get("/health")
def health():
    return {"status": "ok"}

# --- Database bootstrap (only until Alembic migrations are in place) ---
Base.metadata.create_all(bind=engine)

# --- Routers ---
app.include_router(categories.router)
app.include_router(accessories.router)
app.include_router(actions.router)
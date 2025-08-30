import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, engine
from .routers import categories, accessories, actions

# --- Logging ---
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# --- App ---
app = FastAPI(title="Lionel Control API")

@app.get("/version", summary="Version info")
def version():
    return {"commit": os.getenv("GIT_COMMIT", "dev"),
            "built_at": os.getenv("BUILT_AT", "")}
# --- CORS (allow your UI to call the API from browser) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",    # React default
        "http://localhost:5173",    # Vite default
        "http://trainstation.local" # your VM hostname
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Health check ---
@app.get("/health", summary="Health")
def health():
    return {"status": "ok"}

# --- Temporary: create tables if missing (remove after Alembic baseline is applied) ---
#Base.metadata.create_all(bind=engine)

# --- Routers ---
app.include_router(categories.router)
app.include_router(accessories.router)
app.include_router(actions.router)
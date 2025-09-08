import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import Base, engine
from routers import categories, accessories, actions

# --- Logging ---
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# --- App ---
app = FastAPI(title="Lionel Control API")

@app.get("/version", summary="Version info")
def version():
    return {"commit": os.getenv("GIT_COMMIT", "dev"),
            "built_at": os.getenv("BUILT_AT", "")}
# --- CORS (allow your UI to call the API from browser) ---


app = FastAPI(title="Lionel Control API", version="0.1.0")

# allow Vite dev and common variants
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://trainstation.local:5173",  # if you ever open the UI via this host
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,   # exact origins here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... your existing routes: health, version, include_router(categories/accessories/actions) ...

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
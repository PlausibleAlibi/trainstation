import logging
import os
import traceback, sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import Base, engine
from routers import categories, accessories, actions


@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    print("UNHANDLED EXCEPTION:", file=sys.stderr)
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

# --- Logging ---
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# --- App ---
app = FastAPI(title="Lionel Control API", version="0.1.0")

# --- Version ---
@app.get("/version", summary="Version info")
def version():
    return {
        "commit": os.getenv("GIT_COMMIT", "dev"),
        "built_at": os.getenv("BUILT_AT", "")
    }

# --- CORS ---
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://trainstation.local:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://trainstation.local:3000"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Health ---
@app.get("/health", summary="Health")
def health():
    return {"status": "ok"}

# --- Temporary: create tables if missing (remove after Alembic baseline is applied) ---
# Base.metadata.create_all(bind=engine)

# --- Routers ---
app.include_router(categories.router)
app.include_router(accessories.router)
app.include_router(actions.router)
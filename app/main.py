# app/main.py
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import categories, accessories, actions, track_lines, sections, switches, section_connections, train_assets, asset_location_events, logging, track_layout
from dev_seed import seed_dev_layout
from logging_config import setup_logging, get_logger
from middleware import LoggingMiddleware

# Configure structured logging
setup_logging()
logger = get_logger("main")

# ---- create the app FIRST (only once) ----
app = FastAPI(title="Lionel Control API", version="0.1.0")

# ---- global exception handler (now app exists) ----
@app.exception_handler(Exception)
async def unhandled_exception(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception occurred", 
        method=request.method, 
        url=str(request.url), 
        error=str(exc),
        exc_info=True
    )
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

# ---- CORS ----
ALLOWED_ORIGINS = [
    "http://localhost:3000",   # frontend container
    "http://127.0.0.1:3000",
    "http://localhost:5173",   # vite dev
    "http://127.0.0.1:5173",
    "http://trainstation:3000",
    "http://trainstation.local:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # Optional: catch any port on these hosts during dev
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|trainstation\.local)(:\d+)?$",
    allow_credentials=True,   # ok if you actually need cookies/auth; else set False
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add structured logging middleware
app.add_middleware(LoggingMiddleware)

@app.on_event("startup")
async def startup_event():
    # You may want to wrap this in a try/except and/or use test_mode as needed
    logger.info("Application starting up")
    seed_dev_layout()
    logger.info("Development seed data loaded")

# ---- health/version ----
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/version")
def version():
    return {
        "commit": os.getenv("GIT_COMMIT", "dev"),
        "built_at": os.getenv("BUILT_AT", ""),
    }

# ---- routers ----
app.include_router(categories.router)
app.include_router(accessories.router)
app.include_router(actions.router)
app.include_router(track_lines.router)
app.include_router(sections.router)
app.include_router(switches.router)
app.include_router(section_connections.router)
app.include_router(train_assets.router)
app.include_router(asset_location_events.router)
app.include_router(logging.router)
app.include_router(track_layout.router)
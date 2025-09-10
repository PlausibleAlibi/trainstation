# app/main.py
import logging
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import categories, accessories, actions, track_lines, sections, switches, section_connections

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# ---- create the app FIRST (only once) ----
app = FastAPI(title="Lionel Control API", version="0.1.0")

# ---- global exception handler (now app exists) ----
@app.exception_handler(Exception)
async def unhandled_exception(request: Request, exc: Exception):
    logging.exception("Unhandled error on %s %s", request.method, request.url)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

# ---- CORS ----
ALLOWED_ORIGINS = [
    "http://localhost:3000",   # frontend container
    "http://127.0.0.1:3000",
    "http://localhost:5173",   # vite dev
    "http://127.0.0.1:5173",
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
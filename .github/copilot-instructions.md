# Copilot Instructions for AI Agents

## Project Overview
- **Backend**: Python FastAPI application, located in `app/`.
- **Frontend**: React + TypeScript + Vite, located in `frontend/`.
- **Database**: PostgreSQL managed via Alembic migrations in `app/alembic/`.
- **Containerization**: Multi-service Docker setup with nginx reverse proxy.
- **Build/Run**: Use `Makefile` for common tasks; root-level Docker Compose files for orchestration.
- **Logging**: Structured logging with Seq for centralized log management.

## Key Directories & Files
- `app/`: Main backend code. Includes:
  - `main.py`: FastAPI application entrypoint with routing setup.
  - `models.py`, `schemas.py`: SQLAlchemy models and Pydantic schemas.
  - `db.py`: Database connection and session management.
  - `routers/`: API route modules (accessories, actions, categories, etc.).
  - `hardware/`: Hardware abstraction layer for train control.
  - `alembic/`: Database migrations (see `env.py`).
  - `tests/`: Backend test suite using pytest.
  - `logging_config.py`: Structured logging configuration.
- `frontend/`: React app (Vite, TypeScript). Entry: `src/main.tsx`.
  - `tests/`: Frontend test suite using Vitest.
  - `eslint.config.js`: ESLint configuration.
  - `vitest.config.ts`: Test configuration.
- `api/`: Contains production Dockerfile for backend.
- `nginx/`: Nginx reverse proxy configuration.
- `Scripts/`: Build and deployment scripts.
- `requirements.txt`: Python dependencies.
- `Makefile`: Common build/test commands.
- Root-level Docker Compose files for different environments.
````instructions
# Copilot instructions for AI coding agents — trainstation

Summary
- Backend: FastAPI app in `app/` (entry: `app/main.py`). Frontend: React + TypeScript + Vite in `frontend/`.
- Multi-service Docker compose + nginx reverse proxy. Postgres + Alembic for DB. Seq used for structured logs.

What to read first (quick path to context)
- `app/main.py` — app startup, middleware and router registration.
- `app/db.py` and `app/models.py` — DB session and core models.
- `app/routers/` — concrete API surfaces (follow patterns in `accessories`, `actions`).
- `frontend/src/` and `frontend/AppRouter.tsx` — routing and API client patterns.
- `Makefile`, `docker-compose.yml`, and `deploy/` — how services are composed for dev/prod.

Project-specific conventions (do not invent these)
- API domain per router file (e.g., `app/routers/accessories.py`); register each router in `app/main.py`.
- Keep SQLAlchemy models in `app/models.py` and Pydantic DTOs in `app/schemas.py`.
- Alembic migrations live in `app/alembic/`; use `cd app && alembic ...` for migration commands.
- Hardware abstraction: `app/hardware/` contains control code — changes here require careful integration testing (hardware sims available in `app/examples/`).

Developer workflows & exact commands
- Local backend dev server (fast feedback):
  - cd into backend and run: `cd app && uvicorn main:app --reload --port 8000`
- Full-stack dev (recommended):
  - From repo root: `make dev` (starts frontend dev server, API, Postgres, nginx proxy in compose)
- Create and apply DB migrations:
  - `cd app && alembic revision --autogenerate -m "describe"`
  - `cd app && alembic upgrade head`
- Seed development data: `python run_dev_seed.py` (root) or `python seed.py` depending on target seed file.
- Tests:
  - Backend: `python -m pytest app/tests/ -q` (some tests require a running Postgres/mocked DB)
  - Frontend: `cd frontend && npm ci && npm run test`

Patterns and examples to copy
- Router handler pattern: take request, use DB session from `app/db.py`, call model methods, return Pydantic schema. See `app/routers/train_assets.py` for a typical example.
- Logging: use structured logger configured in `app/logging_config.py`; include request/session ids for traceability.
- Configuration: read from environment files in `deploy/` and `version.env`. Prefer existing env vars rather than adding new ones.

Integration & cross-service notes
- nginx proxies `/api/*` to the API container; frontend expects `/api` base paths. Keep route changes compatible with proxy.
- Seq ingest runs on the compose network (ports in `docker-compose.yml`); avoid hardcoding localhost for log endpoints.
- Docker compose networks: services communicate on `trainstation` network — use service names (e.g., `db`) in connection strings inside compose.

Small pitfalls observed
- Many backend tests assume a DB is available or use fixtures that set up a test DB. If adding tests, either mock DB or add fixtures that create ephemeral test schemas.
- Hardware changes require simulation: don't assume hardware is present in CI. Use example/mock implementations in `app/examples/`.

When changing project structure
- Update `app/main.py` router registration and `Makefile` targets. Keep `docker-compose*.yml` in sync with service names and ports.

Style and safety hints for automated edits
- Prefer small, focused diffs (one file/feature at a time). Follow existing naming (snake_case for python modules, PascalCase for React components).
- Avoid changing migration history; add forward migrations only.
- Do not commit secrets. Use `.env` and `deploy/sample.env` for guidance.

Where to place tests
- Backend unit/integration: `app/tests/` following pytest conventions.
- Frontend tests: `frontend/tests/` with Vitest and React Testing Library.

Key files to reference in PRs or patches
- app/main.py, app/db.py, app/models.py, app/schemas.py, app/routers/*, app/alembic/, frontend/src/, Makefile, docker-compose.yml

If anything is unclear, ask for:
- Which environment (dev vs prod) the change targets, and whether hardware sims should be used for testing.

_This file is maintained for AI agents. Please tell me if you'd like additional examples or editable templates (PR body, migration checklist)._ 

````


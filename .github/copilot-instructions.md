# Copilot Instructions for AI Agents

## Project Overview
- **Backend**: Python (likely FastAPI), located in `app/`.
- **Frontend**: React + TypeScript + Vite, located in `frontend/`.
- **Database**: Managed via Alembic migrations in `app/alembic/`.
- **Containerization**: Uses Docker (`Dockerfile`, deployment config in `deploy/`).
- **Build/Run**: Use `Makefile` for common tasks; see also Docker Compose in `deploy/` for orchestration.

## Key Directories & Files
- `app/`: Main backend code. Includes:
  - `main.py`: Likely FastAPI entrypoint.
  - `models.py`, `schemas.py`: Data models and Pydantic schemas.
  - `db.py`: Database connection logic.
  - `routers/`: API route modules (e.g., `actions.py`, `categories.py`).
  - `hardware/`: Hardware abstraction/providers.
  - `alembic/`: Database migrations (see `env.py`).
- `frontend/`: React app (Vite, TypeScript). Entry: `src/main.tsx`.
- `deploy/`: Docker Compose and deployment configuration.
- `requirements.txt`: Python dependencies.
- `Makefile`: Common build/test commands.

## Developer Workflows
- **Backend**:
  - Run locally: `uvicorn app.main:app --reload` (or use Docker Compose from `deploy/`).
  - Migrations: Use Alembic via `alembic` CLI in `app/alembic/`.
  - Seed data: Run `seed.py`.
- **Frontend**:
  - Dev server: `cd frontend && npm install && npm run dev`.
  - Linting: See `frontend/eslint.config.js` and README for advanced config.
- **Testing**: (Add details if/when test files are present.)

## Patterns & Conventions
- **API Routing**: Each API domain has its own file in `app/routers/`.
- **Models/Schemas**: Keep SQLAlchemy models and Pydantic schemas separate.
- **Config**: Use `deploy/.env`/`version.env` for environment variables.
- **Frontend**: Uses Vite plugins for React; see `frontend/README.md` for ESLint expansion.

## Integration Points
- **Database**: SQLAlchemy + Alembic for migrations.
- **Frontend/Backend**: Likely communicate via REST endpoints defined in `app/routers/`.
- **Docker**: All services can be run together with Docker Compose from the `deploy/` directory for local development.

## Examples
- To add a new API route: create a new file in `app/routers/`, register the router in `main.py`.
- To add a new frontend page: add a component in `frontend/src/`, update routing in `App.tsx`.

---

_If you update project structure or workflows, please update this file to keep AI agents productive._

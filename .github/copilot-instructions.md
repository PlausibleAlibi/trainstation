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

## Developer Workflows
- **Backend**:
  - Development: `cd app && uvicorn main:app --reload` (port 8000)
  - Production: Use Docker compose with `make dev` or `make prod`
  - Migrations: `cd app && alembic revision --autogenerate -m "description"` then `alembic upgrade head`
  - Seed data: `python seed.py` or `python run_dev_seed.py` for development data
  - Testing: `python -m pytest app/tests/ -v` (requires database setup)
  
- **Frontend**:
  - Development: `cd frontend && npm install && npm run dev` (port 5173)
  - Build: `npm run build` (outputs to `dist/`)
  - Testing: `npm run test` (Vitest), `npm run test:coverage` for coverage
  - Linting: `npm run lint` (ESLint with TypeScript support)
  
- **Full Stack Development**:
  - Development mode: `make dev` or `./Scripts/dev.sh` (uses Vite dev server + HMR)
  - Production mode: `make prod` or `./Scripts/prod.sh` (builds static files)
  - Service management: `make up`, `make down`, `make logs`, `make ps`

## Architecture & Infrastructure
- **Multi-service Docker setup** with nginx reverse proxy
- **Services**: API (FastAPI), Frontend (React), PostgreSQL DB, Seq logging, nginx
- **Networks**: All services communicate via `trainstation` Docker network
- **Volumes**: Persistent storage for database (`dbdata`) and logs (`seqdata`)
- **Health checks**: API and database have health monitoring
- **Environment modes**: Development (with HMR) and production (optimized builds)

## Testing Infrastructure
- **Backend**: pytest with asyncio support
  - Location: `app/tests/`
  - Includes: API endpoint tests, model tests, integration tests
  - Coverage: Available via pytest-cov
  - Note: Some tests may require database setup/mocking
  
- **Frontend**: Vitest with React Testing Library
  - Location: `frontend/tests/`
  - Setup: `tests/setup.ts` configures jsdom environment
  - Coverage: V8 provider with HTML/JSON reports
  - Includes: Component tests, service tests, modal tests

## Patterns & Conventions
- **API Routing**: Each API domain has its own file in `app/routers/` (accessories, actions, etc.)
- **Models/Schemas**: SQLAlchemy models (`models.py`) and Pydantic schemas (`schemas.py`) kept separate
- **Configuration**: Environment files (`.env`, `.env.dev`, `.env.prod`) and `version.env`
- **Frontend**: TypeScript strict mode, ESLint with React hooks support, Material-UI components
- **Database**: Alembic migrations with version tracking, PostgreSQL with health checks
- **Logging**: Structured logging with Seq for centralized collection and analysis

## Integration Points
- **Database**: SQLAlchemy ORM + Alembic migrations, PostgreSQL with connection pooling
- **API Communication**: REST endpoints with FastAPI automatic OpenAPI docs (`/api/docs`)
- **Frontend/Backend**: nginx proxy routes `/api/*` to backend, frontend served as static files
- **Docker Orchestration**: Multi-container setup with service dependencies and health checks
- **Development**: Hot module replacement via Vite dev server proxied through nginx
- **Logging**: Backend structured logs sent to Seq, accessible via web UI (port 5341)

## Common Commands
```bash
# Development (with hot reload)
make dev                    # Start all services in dev mode
docker compose logs -f api  # View API logs
docker compose logs -f frontend  # View frontend logs

# Production 
make prod                   # Start optimized production build
make up                     # Background start (uses root compose files)
make down                   # Stop all services

# Database
cd app && alembic upgrade head      # Apply migrations
cd app && alembic revision --autogenerate -m "description"  # Create migration

# Testing
cd frontend && npm run test         # Frontend tests
cd / && python -m pytest app/tests/ -v  # Backend tests (from root)

# Linting & Code Quality
cd frontend && npm run lint         # ESLint check
cd frontend && npm run test:coverage # Test coverage report
```

## Development Examples
- **Add API route**: Create file in `app/routers/`, register router in `main.py` imports and app.include_router()
- **Add frontend page**: Create component in `frontend/src/`, update routing in `AppRouter.tsx`
- **Database changes**: Create migration with `alembic revision`, modify models in `models.py`, update schemas in `schemas.py`
- **Add tests**: Backend tests in `app/tests/`, frontend tests in `frontend/tests/` following existing patterns
- **Environment config**: Update `.env` files for different deployment modes, use environment variables in Docker compose

## Troubleshooting
- **Backend tests failing**: Check database connection, ensure migrations are applied
- **Frontend build issues**: Check TypeScript errors, verify dependencies are installed
- **Docker issues**: Use `docker compose down` then `make dev` or `make prod` to rebuild
- **Database connection**: Verify PostgreSQL service is healthy, check connection strings in `.env`
- **Port conflicts**: Default ports are 80 (nginx), 5341 (Seq UI), 5342 (Seq ingestion)

---

_This file is automatically maintained. Update when project structure or workflows change to keep AI agents productive._

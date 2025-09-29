# 🚂 TrainStation Release {{VERSION}}

## 📌 Summary
- Short description of what this release does.
- Example: “First stable release of TrainStation with FastAPI backend, Postgres support, and switch categories.”

---

## ✨ Features
- [ ] List new features or enhancements.
  - Example: Added `/health` endpoint for container healthchecks.
  - Example: Added categories for switches and accessories.

---

## 🐞 Fixes
- [ ] List bugs resolved.
  - Example: Fixed port binding conflict in Docker Compose.

---

## 🗂 Database / Migrations
- [ ] Note if Alembic migrations are required.
  - Example: Run `alembic upgrade head` before deploying.

---

## ⚠️ Breaking Changes
- [ ] Any config, API, or DB changes that break compatibility.
  - Example: Renamed service from `app` → `web` in docker-compose.

---

## 🐳 Deployment Notes
- Image: `ghcr.io/plausiblealibi/trainstation:{{VERSION}}`
- Update steps on target machine:
  ```bash
  cd ~/trainstation
  
  # For development mode:
  make dev
  # or: ./Scripts/dev.sh
  
  # For production mode:
  make prod  
  # or: ./Scripts/prod.sh
  
  # Verify deployment:
  curl http://localhost:3000/health  # dev mode
  curl http://localhost/health       # prod mode
  ```

- **Current deployment paths** (use these instead of legacy deploy/ directory):
  - Development: `docker-compose.yml` + `docker-compose.dev.yml`
  - Production: `docker-compose.yml` + `docker-compose.prod.yml`
  - Environment configs: `.env.dev` and `.env.prod` (root level)

- **Legacy deployment** in `deploy/` directory is deprecated and scheduled for removal
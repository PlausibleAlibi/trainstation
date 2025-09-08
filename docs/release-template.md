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
  docker compose pull
  docker compose up -d
  curl http://localhost:8080/health
# Legacy local development (kept for compatibility)
up:
	docker compose -f docker-compose.yml -f docker-compose.override.local.yml up -d --build
down:
	docker compose -f docker-compose.yml -f docker-compose.override.local.yml down
logs:
	docker compose -f docker-compose.yml -f docker-compose.override.local.yml logs -f web
ps:
	docker compose ps

# Development environment (port 8080 by default, override with WEB_PORT=8090 make dev-up)
dev-up:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
dev-down:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down
dev-logs:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f web
dev-build:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml build

# QA environment  
qa-up:
	docker compose -f docker-compose.yml -f docker-compose.qa.yml -p trainstation-qa up -d --build
qa-down:
	docker compose -f docker-compose.yml -f docker-compose.qa.yml -p trainstation-qa down
qa-logs:
	docker compose -f docker-compose.yml -f docker-compose.qa.yml -p trainstation-qa logs -f web
qa-build:
	docker compose -f docker-compose.yml -f docker-compose.qa.yml -p trainstation-qa build

# Production environment
prod-up:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml -p trainstation-prod up -d
prod-down:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml -p trainstation-prod down
prod-logs:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml -p trainstation-prod logs -f web
prod-pull:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml -p trainstation-prod pull

# Utility commands
clean:
	docker system prune -f
	docker volume prune -f

# Environment-specific database resets (use with caution!)
dev-reset-db:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down
	docker volume rm trainstation_dbdata_dev || true
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

qa-reset-db:
	docker compose -f docker-compose.yml -f docker-compose.qa.yml -p trainstation-qa down
	docker volume rm trainstation-qa_dbdata_qa || true
	docker compose -f docker-compose.yml -f docker-compose.qa.yml -p trainstation-qa up -d
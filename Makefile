# Legacy local development (kept for compatibility)
up:
	docker compose -f docker-compose.yml -f docker-compose.override.local.yml up -d --build
down:
	docker compose -f docker-compose.yml -f docker-compose.override.local.yml down
logs:
	docker compose -f docker-compose.yml -f docker-compose.override.local.yml logs -f web
ps:
	docker compose ps

# Development environment
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
	docker compose -f docker-compose.yml -f docker-compose.qa.yml up -d --build
qa-down:
	docker compose -f docker-compose.yml -f docker-compose.qa.yml down
qa-logs:
	docker compose -f docker-compose.yml -f docker-compose.qa.yml logs -f web
qa-build:
	docker compose -f docker-compose.yml -f docker-compose.qa.yml build

# Production environment
prod-up:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
prod-down:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml down
prod-logs:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f web
prod-pull:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml pull

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
	docker compose -f docker-compose.yml -f docker-compose.qa.yml down
	docker volume rm trainstation_dbdata_qa || true
	docker compose -f docker-compose.yml -f docker-compose.qa.yml up -d
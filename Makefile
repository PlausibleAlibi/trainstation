up:
	docker compose -f deploy/docker-compose.yml up -d --build
down:
	docker compose -f deploy/docker-compose.yml down
logs:
	docker compose -f deploy/docker-compose.yml logs -f web
ps:
	docker compose -f deploy/docker-compose.yml ps

# Development mode (with Vite dev server and HMR)
dev:
	./Scripts/dev.sh

# Production mode (with built static files)
prod:
	./Scripts/prod.sh

# Stop all containers (works for both root and deploy compose files)
stop:
	docker compose down 2>/dev/null || true
	docker compose -f deploy/docker-compose.yml down 2>/dev/null || true
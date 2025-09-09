up:
	docker compose up -d --build
down:
	docker compose down
logs:
	docker compose logs -f api
ps:
	docker compose ps

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
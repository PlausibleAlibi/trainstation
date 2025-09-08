up:
	docker compose -f docker-compose.yml -f docker-compose.override.local.yml up -d --build
down:
	docker compose -f docker-compose.yml -f docker-compose.override.local.yml down
logs:
	docker compose -f docker-compose.yml -f docker-compose.override.local.yml logs -f web
ps:
	docker compose ps
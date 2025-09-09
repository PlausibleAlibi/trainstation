up:
	docker compose -f deploy/docker-compose.yml up -d --build
down:
	docker compose -f deploy/docker-compose.yml down
logs:
	docker compose -f deploy/docker-compose.yml logs -f web
ps:
	docker compose -f deploy/docker-compose.yml ps
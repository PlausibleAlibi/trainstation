#!/bin/bash
# Stop and remove the database container and its data volumes for development

set -e

# Stop all containers and remove the dbdata volume

echo "Stopping and removing all containers, including database..."
docker compose down -v --remove-orphans

echo "Database container and volumes removed."

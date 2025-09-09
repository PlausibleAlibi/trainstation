#!/usr/bin/env bash
set -euo pipefail

# Script to start TrainStation in development mode
# This will run frontend with Vite dev server and nginx will proxy to it

echo "🚀 Starting TrainStation in DEVELOPMENT mode..."
echo "   - Frontend: Vite dev server (http://localhost:3000 -> frontend:5173)"  
echo "   - Backend API: http://localhost:3000/api -> api:8000"
echo "   - Hot Module Replacement enabled"
echo ""

# Copy dev environment
cp .env.dev .env

# Stop any existing containers
docker compose down 2>/dev/null || true

# Build and start in development mode
docker compose \
  -f docker-compose.yml \
  -f docker-compose.dev.yml \
  up --build -d

echo ""
echo "✅ Development mode started!"
echo "🌐 Access the application at: http://localhost:3000"
echo "📊 API docs at: http://localhost:3000/api/docs"
echo ""
echo "To view logs: docker compose logs -f"
echo "To stop: docker compose down"
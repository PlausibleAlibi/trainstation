#!/usr/bin/env bash
set -euo pipefail

# Script to start TrainStation in production mode
# This will build the frontend and serve static files via nginx

echo "🚀 Starting TrainStation in PRODUCTION mode..."
echo "   - Frontend: Built static files served by nginx"
echo "   - Backend API: http://localhost/api -> api:8000"
echo "   - Optimized for performance"
echo ""

# Copy prod environment
cp .env.prod .env

# Stop any existing containers
docker compose down 2>/dev/null || true

# Make sure frontend is built first
echo "🔨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Verify dist folder exists
if [ ! -d "frontend/dist" ]; then
    echo "❌ Frontend build failed - dist folder not found"
    exit 1
fi

echo "✅ Frontend built successfully"

# Build and start in production mode  
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up --build -d

echo ""
echo "✅ Production mode started!"
echo "🌐 Access the application at: http://localhost"
echo "📊 API docs at: http://localhost/api/docs"
echo ""
echo "To view logs: docker compose logs -f"
echo "To stop: docker compose down"
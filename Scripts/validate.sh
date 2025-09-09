#!/usr/bin/env bash
set -euo pipefail

# Validation script to test nginx reverse proxy configuration
echo "🔍 Validating TrainStation nginx reverse proxy implementation..."
echo ""

# Test 1: Check if all required files exist
echo "1. Checking required files..."
required_files=(
    "nginx/nginx.dev.conf"
    "nginx/nginx.prod.conf" 
    "nginx/nginx.deploy.conf"
    "frontend/Dockerfile.dev"
    "docker-compose.dev.yml"
    "docker-compose.prod.yml"
    ".env.dev"
    ".env.prod"
    "Scripts/dev.sh"
    "Scripts/prod.sh"
)

for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (missing)"
        exit 1
    fi
done

# Test 2: Validate nginx configurations
echo ""
echo "2. Validating nginx configurations..."
for config in nginx/nginx.dev.conf nginx/nginx.prod.conf nginx/nginx.deploy.conf; do
    if grep -q "proxy_pass" "$config" && grep -q "location /" "$config"; then
        echo "   ✅ $config (has proxy_pass and location blocks)"
    else
        echo "   ❌ $config (missing required directives)"
        exit 1
    fi
done

# Test 3: Check docker-compose configurations
echo ""
echo "3. Validating docker-compose configurations..."
for compose_combo in \
    "docker-compose.yml -f docker-compose.dev.yml" \
    "docker-compose.yml -f docker-compose.prod.yml" \
    "deploy/docker-compose.yml"
do
    if docker compose -f $compose_combo config --quiet; then
        echo "   ✅ $compose_combo"
    else
        echo "   ❌ $compose_combo (invalid configuration)"
        exit 1
    fi
done

# Test 4: Check scripts are executable
echo ""
echo "4. Checking script permissions..."
for script in Scripts/dev.sh Scripts/prod.sh; do
    if [[ -x "$script" ]]; then
        echo "   ✅ $script (executable)"
    else
        echo "   ❌ $script (not executable)"
        exit 1
    fi
done

# Test 5: Validate environment files
echo ""
echo "5. Validating environment files..."
if grep -q "MODE=dev" .env.dev && grep -q "MODE=prod" .env.prod; then
    echo "   ✅ Environment files contain correct MODE settings"
else
    echo "   ❌ Environment files missing MODE settings"
    exit 1
fi

# Test 6: Check frontend can build
echo ""
echo "6. Testing frontend build..."
if cd frontend && npm install --silent && npm run build --silent; then
    echo "   ✅ Frontend builds successfully"
    cd ..
else
    echo "   ❌ Frontend build failed"
    cd .. 2>/dev/null || true
    exit 1
fi

echo ""
echo "✅ All validations passed! The nginx reverse proxy implementation is ready."
echo ""
echo "📋 Usage:"
echo "   Development mode: make dev  or  ./Scripts/dev.sh"
echo "   Production mode:  make prod or  ./Scripts/prod.sh"
echo "   Legacy deploy:    make up   (uses deploy/docker-compose.yml)"
echo ""
echo "🌐 Access URLs:"
echo "   Development: http://localhost:3000 (with HMR)"
echo "   Production:  http://localhost (optimized static files)"
echo "   Legacy:      http://localhost:3000 (nginx proxy)"
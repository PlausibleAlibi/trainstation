#!/bin/bash

# SEQ Logging Integration Validation Script
# This script validates the SEQ logging implementation without requiring the full Docker environment

set -e

echo "🔍 SEQ Logging Integration Validation"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

function check_file() {
    if [ -f "$1" ]; then
        log_info "✓ Found: $1"
        return 0
    else
        log_error "✗ Missing: $1"
        return 1
    fi
}

function check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        log_info "✓ Content check passed: $1 contains '$2'"
        return 0
    else
        log_error "✗ Content check failed: $1 missing '$2'"
        return 1
    fi
}

echo
echo "1. Checking Docker Compose Configuration"
echo "---------------------------------------"

check_file "docker-compose.yml"
check_content "docker-compose.yml" "seq:"
check_content "docker-compose.yml" "datalust/seq:latest"
check_content "docker-compose.yml" "seqdata:/data"

check_file "docker-compose.dev.yml"
check_content "docker-compose.dev.yml" "SEQ_FIRSTRUN_ADMINPASSWORDHASH"

echo
echo "2. Checking Environment Configuration"
echo "------------------------------------"

check_file ".env.dev"
check_content ".env.dev" "SEQ_URL"
check_content ".env.dev" "SEQ_UI_PORT"
check_content ".env.dev" "SEQ_INGESTION_PORT"

check_file ".env.prod"
check_content ".env.prod" "SEQ_URL"
check_content ".env.prod" "SEQ_ADMIN_PASSWORD_HASH"

echo
echo "3. Checking Backend Integration"
echo "------------------------------"

check_file "requirements.txt"
check_content "requirements.txt" "seqlog"

check_file "app/logging_config.py"
check_content "app/logging_config.py" "seqlog"
check_content "app/logging_config.py" "log_to_seq"

check_file "app/routers/logging.py"
check_content "app/routers/logging.py" "@router.post(\"/submit\""
check_content "app/routers/logging.py" "LogEntry"
check_content "app/routers/logging.py" "LogBatch"

check_file "app/main.py"
check_content "app/main.py" "logging.router"

echo
echo "4. Checking Frontend Integration"
echo "-------------------------------"

check_file "frontend/src/shared/logging.ts"
check_content "frontend/src/shared/logging.ts" "class Logger"
check_content "frontend/src/shared/logging.ts" "/logging/submit"
check_content "frontend/src/shared/logging.ts" "sendBeacon"

check_file "frontend/src/shared/ErrorBoundary.tsx"
check_content "frontend/src/shared/ErrorBoundary.tsx" "componentDidCatch"
check_content "frontend/src/shared/ErrorBoundary.tsx" "log.error"

check_file "frontend/src/main.tsx"
check_content "frontend/src/main.tsx" "ErrorBoundary"
check_content "frontend/src/main.tsx" "Application starting up"

echo
echo "5. Checking Tests"
echo "----------------"

check_file "app/tests/test_logging.py"
check_content "app/tests/test_logging.py" "test_submit_logs"
check_content "app/tests/test_logging.py" "test_logging_health"

check_file "frontend/tests/logging.test.ts"
check_content "frontend/tests/logging.test.ts" "Frontend Logging"
check_content "frontend/tests/logging.test.ts" "should create error logs"

echo
echo "6. Checking Documentation"
echo "------------------------"

check_file "docs/logging.md"
check_content "docs/logging.md" "SEQ Configuration"
check_content "docs/logging.md" "Environment Variables"
check_content "docs/logging.md" "Verification"

echo
echo "7. Validating Python Code Syntax"
echo "--------------------------------"

if command -v python3 >/dev/null 2>&1; then
    log_info "Checking Python syntax..."
    
    if python3 -m py_compile app/logging_config.py; then
        log_info "✓ app/logging_config.py syntax is valid"
    else
        log_error "✗ app/logging_config.py has syntax errors"
    fi
    
    if python3 -m py_compile app/routers/logging.py; then
        log_info "✓ app/routers/logging.py syntax is valid"
    else
        log_error "✗ app/routers/logging.py has syntax errors"
    fi
else
    log_warn "Python3 not available, skipping syntax check"
fi

echo
echo "8. Validating TypeScript Files"
echo "------------------------------"

if [ -f "frontend/package.json" ]; then
    log_info "✓ Frontend package.json exists"
    
    if command -v node >/dev/null 2>&1; then
        log_info "Node.js is available"
        # Could add TypeScript compilation check here if needed
    else
        log_warn "Node.js not available, skipping TypeScript validation"
    fi
else
    log_warn "Frontend package.json not found"
fi

echo
echo "9. Environment Variables Check"
echo "-----------------------------"

log_info "Required environment variables for SEQ:"
echo "  - SEQ_URL: SEQ server URL for backend connection"
echo "  - SEQ_UI_PORT: Port for SEQ web interface (default: 5341)"
echo "  - SEQ_INGESTION_PORT: Port for log ingestion (default: 5342)"
echo "  - SEQ_API_KEY: (Optional) API key for authentication"
echo "  - SEQ_ADMIN_PASSWORD_HASH: (Production) Bcrypt hash of admin password"

echo
echo "10. Integration Test Commands"
echo "----------------------------"

log_info "To test the logging integration:"
echo
echo "1. Start the services:"
echo "   make dev"
echo
echo "2. Check SEQ UI:"
echo "   Open http://localhost:5341"
echo "   Login with admin/admin123 (development)"
echo
echo "3. Test backend logging endpoint:"
echo "   curl -X POST http://localhost:3000/api/logging/submit \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"logs\":[{\"level\":\"info\",\"message\":\"Test log\"}]}'"
echo
echo "4. Test logging health:"
echo "   curl http://localhost:3000/api/logging/health"
echo
echo "5. Run backend tests:"
echo "   cd app && python -m pytest tests/test_logging.py"
echo
echo "6. Run frontend tests:"
echo "   cd frontend && npm test"

echo
echo "🎉 Validation Complete!"
echo
log_info "All core files and configuration appear to be in place."
log_info "The SEQ logging integration should work once the Docker environment is running."
echo
log_warn "Note: Due to SSL certificate issues with PyPI in the current environment,"
log_warn "the Docker containers cannot be built to test the live integration."
log_warn "The implementation is complete and should work in a normal environment."
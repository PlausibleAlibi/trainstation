#!/usr/bin/env bash
set -euo pipefail

# TrainStation Latest Image Deployment Script (Linux/macOS)
# 
# This script automates pulling and deploying the latest Docker image 
# of the TrainStation app for local testing.
#
# Features:
# - Detects latest tagged Docker image from GitHub Container Registry
# - Pulls latest image automatically  
# - Stops and removes existing containers safely
# - Starts new container with proper port mappings
# - Provides health check verification
#
# Usage:
#   ./Scripts/deploy-latest.sh [OPTIONS]
#
# Options:
#   --tag TAG        Use specific tag instead of latest (e.g., --tag v1.2.3)
#   --port PORT      Use custom port for web interface (default: 8080) 
#   --seq-port PORT  Use custom port for SEQ logging UI (default: 5341)
#   --keep-data      Keep existing database and log data (default: false)
#   --help           Show this help message
#
# Examples:
#   ./Scripts/deploy-latest.sh                    # Deploy latest with defaults
#   ./Scripts/deploy-latest.sh --tag v1.2.3      # Deploy specific version
#   ./Scripts/deploy-latest.sh --port 3000       # Use port 3000 for web
#   ./Scripts/deploy-latest.sh --keep-data       # Preserve existing data
#
# Requirements:
#   - Docker installed and running
#   - curl (for health checks)
#   - jq (for JSON parsing)
#   - Internet connection

# --- Configuration ---
IMAGE_REGISTRY="ghcr.io"
IMAGE_OWNER="plausiblealibi" 
IMAGE_NAME="trainstation"
CONTAINER_PREFIX="trainstation"
DEFAULT_WEB_PORT=8080
DEFAULT_SEQ_PORT=5341
DEFAULT_SEQ_INGESTION_PORT=5342

# --- Parse command line arguments ---
TAG=""
WEB_PORT="$DEFAULT_WEB_PORT"
SEQ_PORT="$DEFAULT_SEQ_PORT"
SEQ_INGESTION_PORT="$DEFAULT_SEQ_INGESTION_PORT"
KEEP_DATA=false

show_help() {
    head -n 35 "$0" | tail -n +3 | sed 's/^# //' | sed 's/^#//'
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --tag)
            shift
            TAG="${1:-}"
            [[ -n "$TAG" ]] || { echo "ERROR: --tag requires a value"; exit 1; }
            shift
            ;;
        --port)
            shift
            WEB_PORT="${1:-}"
            [[ -n "$WEB_PORT" ]] || { echo "ERROR: --port requires a value"; exit 1; }
            shift
            ;;
        --seq-port)
            shift
            SEQ_PORT="${1:-}"
            [[ -n "$SEQ_PORT" ]] || { echo "ERROR: --seq-port requires a value"; exit 1; }
            shift
            ;;
        --keep-data)
            KEEP_DATA=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "ERROR: Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# --- Helper functions ---
log_info() { echo "ℹ️  $*"; }
log_success() { echo "✅ $*"; }
log_warning() { echo "⚠️  $*"; }
log_error() { echo "❌ $*" >&2; }
die() { log_error "$*"; exit 1; }

check_requirements() {
    local missing=()
    
    command -v docker >/dev/null 2>&1 || missing+=("docker")
    command -v curl >/dev/null 2>&1 || missing+=("curl")
    command -v jq >/dev/null 2>&1 || missing+=("jq")
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        die "Missing required tools: ${missing[*]}. Please install them first."
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        die "Docker is not running. Please start Docker and try again."
    fi
}

get_latest_tag() {
    log_info "Detecting latest tag from GitHub API..."
    
    local api_url="https://api.github.com/repos/${IMAGE_OWNER}/${IMAGE_NAME}/releases/latest"
    local latest_tag
    
    latest_tag=$(curl -sSf "$api_url" 2>/dev/null | jq -r '.tag_name // empty') || {
        log_warning "Failed to get latest release from GitHub API, falling back to 'latest' tag"
        echo "latest"
        return
    }
    
    if [[ -z "$latest_tag" || "$latest_tag" == "null" ]]; then
        log_warning "No releases found, using 'latest' tag"
        echo "latest"
    else
        log_success "Found latest release: $latest_tag"
        echo "$latest_tag"
    fi
}

pull_image() {
    local image_tag="$1"
    local full_image="${IMAGE_REGISTRY}/${IMAGE_OWNER}/${IMAGE_NAME}:${image_tag}"
    
    log_info "Pulling Docker image: $full_image"
    
    if docker pull "$full_image"; then
        log_success "Successfully pulled $full_image"
    else
        log_error "Failed to pull $full_image"
        log_info "This might be because:"
        log_info "  1. The image doesn't exist or tag is incorrect"
        log_info "  2. You need to authenticate: docker login ghcr.io"
        log_info "  3. Network connectivity issues"
        die "Cannot proceed without the Docker image"
    fi
    
    echo "$full_image"
}

stop_existing_containers() {
    log_info "Checking for existing TrainStation containers..."
    
    local containers
    containers=$(docker ps -aq --filter "name=${CONTAINER_PREFIX}" 2>/dev/null || true)
    
    if [[ -n "$containers" ]]; then
        log_info "Stopping existing containers..."
        echo "$containers" | xargs docker stop >/dev/null 2>&1 || true
        
        log_info "Removing existing containers..."
        echo "$containers" | xargs docker rm >/dev/null 2>&1 || true
        
        log_success "Cleaned up existing containers"
    else
        log_info "No existing containers found"
    fi
}

cleanup_volumes() {
    if [[ "$KEEP_DATA" == "true" ]]; then
        log_info "Keeping existing data volumes (--keep-data specified)"
        return
    fi
    
    log_warning "Removing existing data volumes (database and logs will be lost)"
    log_warning "Use --keep-data to preserve existing data"
    
    # Remove named volumes that might exist
    docker volume rm "${CONTAINER_PREFIX}_dbdata" 2>/dev/null || true
    docker volume rm "${CONTAINER_PREFIX}_seqdata" 2>/dev/null || true
    
    log_info "Data volumes cleaned up"
}

create_network() {
    local network_name="${CONTAINER_PREFIX}_network"
    
    if docker network inspect "$network_name" >/dev/null 2>&1; then
        log_info "Network $network_name already exists"
    else
        log_info "Creating Docker network: $network_name"
        docker network create "$network_name" >/dev/null
        log_success "Created network: $network_name"
    fi
    
    echo "$network_name"
}

start_database() {
    local network_name="$1"
    local container_name="${CONTAINER_PREFIX}_db"
    
    log_info "Starting PostgreSQL database..."
    
    docker run -d \
        --name "$container_name" \
        --network "$network_name" \
        --restart unless-stopped \
        -e POSTGRES_DB=trains \
        -e POSTGRES_USER=trainsAdmin \
        -e POSTGRES_PASSWORD=brokentrack \
        -v "${CONTAINER_PREFIX}_dbdata:/var/lib/postgresql/data" \
        postgres:16 >/dev/null
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    local retries=30
    while [[ $retries -gt 0 ]]; do
        if docker exec "$container_name" pg_isready -U trainsAdmin -d trains >/dev/null 2>&1; then
            log_success "Database is ready"
            return
        fi
        sleep 2
        ((retries--))
    done
    
    die "Database failed to start within expected time"
}

start_seq() {
    local network_name="$1"
    local container_name="${CONTAINER_PREFIX}_seq"
    
    log_info "Starting SEQ logging service..."
    
    docker run -d \
        --name "$container_name" \
        --network "$network_name" \
        --restart unless-stopped \
        -e ACCEPT_EULA=Y \
        -e SEQ_FIRSTRUN_ADMINPASSWORD=admin123 \
        -p "${SEQ_PORT}:80" \
        -p "${SEQ_INGESTION_PORT}:5341" \
        -v "${CONTAINER_PREFIX}_seqdata:/data" \
        datalust/seq:latest >/dev/null
    
    log_success "SEQ logging service started on port $SEQ_PORT"
}

start_app() {
    local network_name="$1"
    local image="$2"
    local container_name="${CONTAINER_PREFIX}_app"
    
    log_info "Starting TrainStation application..."
    
    docker run -d \
        --name "$container_name" \
        --network "$network_name" \
        --restart unless-stopped \
        -p "${WEB_PORT}:8000" \
        -e DATABASE_URL="postgresql+psycopg2://trainsAdmin:brokentrack@${CONTAINER_PREFIX}_db:5432/trains" \
        -e SEQ_URL="http://${CONTAINER_PREFIX}_seq:5341" \
        -e PYTHONPATH=/app \
        -e PORT=8000 \
        -e UVICORN_HOST=0.0.0.0 \
        -e UVICORN_WORKERS=1 \
        "$image" >/dev/null
    
    log_success "TrainStation application started on port $WEB_PORT"
}

verify_deployment() {
    local max_retries=30
    local retry_count=0
    
    log_info "Verifying deployment health..."
    
    while [[ $retry_count -lt $max_retries ]]; do
        if curl -sSf "http://localhost:${WEB_PORT}/health" >/dev/null 2>&1; then
            log_success "Health check passed! TrainStation is running"
            return 0
        fi
        
        sleep 3
        ((retry_count++))
        
        if [[ $((retry_count % 10)) -eq 0 ]]; then
            log_info "Still waiting for application to be ready... ($retry_count/$max_retries)"
        fi
    done
    
    log_error "Health check failed after $max_retries attempts"
    log_error "Application may not be running correctly"
    return 1
}

show_status() {
    echo
    echo "🚂 TrainStation Deployment Complete!"
    echo "======================================="
    echo
    echo "📱 Web Interface:    http://localhost:${WEB_PORT}"
    echo "📊 SEQ Logs:         http://localhost:${SEQ_PORT}"
    echo "    SEQ Login:       admin / admin123"
    echo
    echo "🔧 Management Commands:"
    echo "  View logs:         docker logs ${CONTAINER_PREFIX}_app -f"
    echo "  Stop all:          docker stop ${CONTAINER_PREFIX}_app ${CONTAINER_PREFIX}_db ${CONTAINER_PREFIX}_seq"
    echo "  Remove all:        docker rm ${CONTAINER_PREFIX}_app ${CONTAINER_PREFIX}_db ${CONTAINER_PREFIX}_seq"
    echo "  Health check:      curl http://localhost:${WEB_PORT}/health"
    echo
    if [[ "$KEEP_DATA" == "false" ]]; then
        echo "💾 Data: Fresh database and logs (use --keep-data to preserve)"
    else
        echo "💾 Data: Existing data preserved"
    fi
    echo
}

# --- Main execution ---
main() {
    echo "🚂 TrainStation Docker Deployment Script"
    echo "========================================"
    echo
    
    check_requirements
    
    # Determine which tag to use
    if [[ -z "$TAG" ]]; then
        TAG=$(get_latest_tag)
    else
        log_info "Using specified tag: $TAG"
    fi
    
    # Pull the image
    local image
    image=$(pull_image "$TAG")
    
    # Stop existing containers
    stop_existing_containers
    
    # Handle data volumes
    cleanup_volumes
    
    # Create network
    local network
    network=$(create_network)
    
    # Start services in order
    start_database "$network"
    start_seq "$network"
    start_app "$network" "$image"
    
    # Verify everything is working
    if verify_deployment; then
        show_status
    else
        log_error "Deployment verification failed"
        log_info "Check container logs for troubleshooting:"
        log_info "  docker logs ${CONTAINER_PREFIX}_app"
        log_info "  docker logs ${CONTAINER_PREFIX}_db"
        log_info "  docker logs ${CONTAINER_PREFIX}_seq"
        exit 1
    fi
}

# Run main function
main "$@"
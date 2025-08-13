#!/bin/bash

# AppCompatCheck Production Deployment Script
set -e

# Configuration
APP_NAME="appcompatcheck"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-docker.io}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
ENVIRONMENT="${ENVIRONMENT:-production}"
COMPOSE_FILE="docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    if [ ! -f ".env.production" ]; then
        error ".env.production file is missing"
    fi
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        error "$COMPOSE_FILE file is missing"
    fi
    
    log "Prerequisites check passed"
}

# Build application image
build_image() {
    log "Building application image..."
    
    # Build the image
    docker build -t "${APP_NAME}:${IMAGE_TAG}" .
    
    # Tag for registry if specified
    if [ "$DOCKER_REGISTRY" != "docker.io" ]; then
        docker tag "${APP_NAME}:${IMAGE_TAG}" "${DOCKER_REGISTRY}/${APP_NAME}:${IMAGE_TAG}"
    fi
    
    log "Image built successfully"
}

# Push image to registry
push_image() {
    if [ "$DOCKER_REGISTRY" != "docker.io" ]; then
        log "Pushing image to registry..."
        docker push "${DOCKER_REGISTRY}/${APP_NAME}:${IMAGE_TAG}"
        log "Image pushed successfully"
    fi
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    sudo mkdir -p /var/app/data
    sudo mkdir -p /var/log/appcompat
    sudo mkdir -p /var/lib/postgresql/data
    sudo mkdir -p /var/lib/redis
    sudo mkdir -p /var/lib/prometheus
    sudo mkdir -p /var/lib/grafana
    sudo mkdir -p /var/lib/loki
    sudo mkdir -p /var/log/nginx
    sudo mkdir -p /var/cache/nginx
    
    # Set proper permissions
    sudo chown -R 1001:1001 /var/app/data
    sudo chown -R 999:999 /var/lib/postgresql/data
    sudo chown -R 999:999 /var/lib/redis
    sudo chown -R 65534:65534 /var/lib/prometheus
    sudo chown -R 472:472 /var/lib/grafana
    sudo chown -R 10001:10001 /var/lib/loki
    
    log "Directories created successfully"
}

# Generate SSL certificates
setup_ssl() {
    log "Setting up SSL certificates..."
    
    if [ ! -f "/etc/letsencrypt/live/appcompatcheck.com/fullchain.pem" ]; then
        warn "SSL certificates not found. Please run certbot to generate certificates:"
        warn "sudo certbot certonly --standalone -d appcompatcheck.com -d www.appcompatcheck.com"
        warn "Continuing with self-signed certificates for now..."
        
        # Create self-signed certificates for development
        sudo mkdir -p /etc/letsencrypt/live/appcompatcheck.com
        sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /etc/letsencrypt/live/appcompatcheck.com/privkey.pem \
            -out /etc/letsencrypt/live/appcompatcheck.com/fullchain.pem \
            -subj "/C=US/ST=CA/L=San Francisco/O=AppCompatCheck/CN=appcompatcheck.com"
        sudo cp /etc/letsencrypt/live/appcompatcheck.com/fullchain.pem \
            /etc/letsencrypt/live/appcompatcheck.com/chain.pem
    fi
    
    log "SSL setup completed"
}

# Backup database
backup_database() {
    log "Creating database backup..."
    
    BACKUP_FILE="/var/app/backups/pre-deployment-$(date +%Y%m%d-%H%M%S).sql"
    sudo mkdir -p /var/app/backups
    
    if docker-compose -f $COMPOSE_FILE ps postgres | grep -q "Up"; then
        docker-compose -f $COMPOSE_FILE exec -T postgres pg_dumpall -U appcompat > "$BACKUP_FILE"
        log "Database backup created: $BACKUP_FILE"
    else
        warn "Database not running, skipping backup"
    fi
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait for database to be ready
    docker-compose -f $COMPOSE_FILE exec -T app npm run db:migrate
    
    log "Migrations completed"
}

# Health checks
health_check() {
    log "Performing health checks..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost/health > /dev/null 2>&1; then
            log "Health check passed"
            return 0
        fi
        
        log "Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Deploy application
deploy() {
    log "Starting deployment..."
    
    # Load environment variables
    export $(cat .env.production | xargs)
    
    # Stop existing services gracefully
    if docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
        log "Stopping existing services..."
        docker-compose -f $COMPOSE_FILE down --timeout 30
    fi
    
    # Start services
    log "Starting services..."
    docker-compose -f $COMPOSE_FILE up -d
    
    # Wait for services to be ready
    sleep 30
    
    # Run migrations
    run_migrations
    
    # Perform health check
    health_check
    
    log "Deployment completed successfully"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    # Stop current services
    docker-compose -f $COMPOSE_FILE down --timeout 30
    
    # Restore from backup if available
    local latest_backup=$(ls -t /var/app/backups/pre-deployment-*.sql 2>/dev/null | head -n1)
    if [ -n "$latest_backup" ]; then
        log "Restoring database from backup: $latest_backup"
        docker-compose -f $COMPOSE_FILE up -d postgres
        sleep 10
        docker-compose -f $COMPOSE_FILE exec -T postgres psql -U appcompat -d appcompatcheck < "$latest_backup"
    fi
    
    # Start previous version (assuming it's tagged as 'previous')
    IMAGE_TAG="previous" docker-compose -f $COMPOSE_FILE up -d
    
    log "Rollback completed"
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old Docker resources..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f
    
    log "Cleanup completed"
}

# Monitor deployment
monitor() {
    log "Monitoring deployment..."
    
    # Show service status
    docker-compose -f $COMPOSE_FILE ps
    
    # Show recent logs
    docker-compose -f $COMPOSE_FILE logs --tail=50 app
    
    # Show resource usage
    docker stats --no-stream
}

# Main function
main() {
    case "$1" in
        "build")
            check_prerequisites
            build_image
            ;;
        "push")
            push_image
            ;;
        "setup")
            create_directories
            setup_ssl
            ;;
        "deploy")
            check_prerequisites
            create_directories
            backup_database
            build_image
            deploy
            cleanup
            monitor
            ;;
        "rollback")
            rollback
            ;;
        "health")
            health_check
            ;;
        "monitor")
            monitor
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            echo "Usage: $0 {build|push|setup|deploy|rollback|health|monitor|cleanup}"
            echo ""
            echo "Commands:"
            echo "  build     - Build Docker image"
            echo "  push      - Push image to registry"
            echo "  setup     - Setup directories and SSL"
            echo "  deploy    - Full deployment process"
            echo "  rollback  - Rollback to previous version"
            echo "  health    - Run health checks"
            echo "  monitor   - Show deployment status"
            echo "  cleanup   - Clean up old Docker resources"
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"
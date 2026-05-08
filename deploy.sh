#!/bin/bash

# SwachhCity Docker Deployment Script
# Usage: ./deploy.sh [development|production] [up|down|restart|logs]

set -e

COMPOSE_FILE="docker-compose.yml"
ENVIRONMENT="development"
ACTION="up"

# Parse arguments
if [ -n "$1" ]; then
    ENVIRONMENT=$1
fi

if [ -n "$2" ]; then
    ACTION=$2
fi

# Use production compose file if specified
if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    echo "🚀 Deploying in PRODUCTION mode..."
else
    echo "🔧 Deploying in DEVELOPMENT mode..."
fi

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${GREEN}=====================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}=====================================${NC}"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Check Docker installation
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install it first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check compose file exists
check_compose_file() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Compose file $COMPOSE_FILE not found"
        exit 1
    fi
    print_success "Found compose file: $COMPOSE_FILE"
}

# Check environment files
check_env_files() {
    if [ "$ENVIRONMENT" = "production" ]; then
        if [ ! -f "backend/.env.production" ]; then
            print_warning "backend/.env.production not found. Creating from template..."
            cp backend/.env.production backend/.env 2>/dev/null || true
        fi
        
        if [ ! -f "frontend/.env.production" ]; then
            print_warning "frontend/.env.production not found. Creating from template..."
            cp frontend/.env.production frontend/.env 2>/dev/null || true
        fi
        
        print_warning "Please ensure SSL certificates are in place (ssl/cert.pem, ssl/key.pem)"
    fi
}

# Pull latest images
pull_images() {
    print_header "Pulling Latest Base Images"
    docker pull node:18-alpine
    docker pull python:3.11-slim
    docker pull mongo:7
    docker pull redis:7-alpine
    docker pull nginx:alpine
    print_success "Images pulled successfully"
}

# Build images
build_images() {
    print_header "Building Docker Images"
    docker-compose -f "$COMPOSE_FILE" build --pull
    print_success "Images built successfully"
}

# Start services
start_services() {
    print_header "Starting Services"
    docker-compose -f "$COMPOSE_FILE" up -d
    print_success "Services started"
    
    # Wait for services to be ready
    sleep 3
    
    print_header "Service Status"
    docker-compose -f "$COMPOSE_FILE" ps
}

# Stop services
stop_services() {
    print_header "Stopping Services"
    docker-compose -f "$COMPOSE_FILE" down
    print_success "Services stopped"
}

# Restart services
restart_services() {
    print_header "Restarting Services"
    docker-compose -f "$COMPOSE_FILE" restart
    print_success "Services restarted"
    
    sleep 2
    docker-compose -f "$COMPOSE_FILE" ps
}

# Show logs
show_logs() {
    print_header "Showing Logs (Press Ctrl+C to exit)"
    docker-compose -f "$COMPOSE_FILE" logs -f
}

# Show status
show_status() {
    print_header "Container Status"
    docker-compose -f "$COMPOSE_FILE" ps
    
    print_header "Service Health Checks"
    
    echo "Frontend (3000):"
    curl -s http://localhost:3000/ | head -c 50
    echo "..."
    
    echo -e "\nBackend Health (/health):"
    curl -s http://localhost:5000/health 2>/dev/null || echo "Not responding"
    
    echo -e "\nML Service Health (/health):"
    curl -s http://localhost:8000/health 2>/dev/null || echo "Not responding"
    
    echo -e "\nDatabase Status:"
    docker exec swachhcity-mongodb mongosh --eval "db.adminCommand('ping')" 2>/dev/null || echo "Cannot connect"
    
    echo -e "\nRedis Status:"
    docker exec swachhcity-redis redis-cli ping 2>/dev/null || echo "Cannot connect"
}

# Cleanup unused images and volumes
cleanup() {
    print_header "Cleanup"
    read -p "Remove unused Docker images and volumes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker system prune -f
        print_success "Cleanup complete"
    fi
}

# Backup database
backup_database() {
    print_header "Backing Up Database"
    
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    echo "Backing up MongoDB..."
    docker exec swachhcity-mongodb mongodump --out /data/db/backup
    docker cp swachhcity-mongodb:/data/db/backup "$BACKUP_DIR/mongodb"
    
    echo "Backing up Redis..."
    docker exec swachhcity-redis redis-cli BGSAVE
    docker cp swachhcity-redis:/data "$BACKUP_DIR/redis"
    
    print_success "Backup complete in $BACKUP_DIR"
}

# Show usage
show_usage() {
    echo "SwachhCity Docker Deployment Script"
    echo ""
    echo "Usage: $0 [environment] [action]"
    echo ""
    echo "Environments:"
    echo "  development  - Use docker-compose.yml (default)"
    echo "  production   - Use docker-compose.prod.yml"
    echo ""
    echo "Actions:"
    echo "  up           - Build and start services (default)"
    echo "  down         - Stop services"
    echo "  restart      - Restart services"
    echo "  logs         - Show live logs"
    echo "  status       - Show service status"
    echo "  build        - Build images only"
    echo "  pull         - Pull latest base images"
    echo "  cleanup      - Remove unused Docker artifacts"
    echo "  backup       - Backup databases"
    echo ""
    echo "Examples:"
    echo "  $0                     # Start in development"
    echo "  $0 production up       # Deploy production"
    echo "  $0 development logs    # Show dev logs"
    echo "  $0 production restart  # Restart production"
}

# Main
main() {
    case "$ACTION" in
        up)
            check_docker
            check_compose_file
            check_env_files
            pull_images
            build_images
            start_services
            show_status
            ;;
        down)
            check_docker
            check_compose_file
            stop_services
            ;;
        restart)
            check_docker
            check_compose_file
            restart_services
            show_status
            ;;
        logs)
            check_docker
            check_compose_file
            show_logs
            ;;
        status)
            check_docker
            check_compose_file
            show_status
            ;;
        build)
            check_docker
            check_compose_file
            build_images
            ;;
        pull)
            pull_images
            ;;
        cleanup)
            cleanup
            ;;
        backup)
            check_docker
            check_compose_file
            backup_database
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main

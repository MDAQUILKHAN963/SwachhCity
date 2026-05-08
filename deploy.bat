@echo off
REM SwachhCity Docker Deployment Script for Windows
REM Usage: deploy.bat [development|production] [up|down|restart|logs|status]

setlocal enabledelayedexpansion

set COMPOSE_FILE=docker-compose.yml
set ENVIRONMENT=development
set ACTION=up

REM Parse arguments
if not "%1"=="" set ENVIRONMENT=%1
if not "%2"=="" set ACTION=%2

REM Use production compose file if specified
if "%ENVIRONMENT%"=="production" (
    set COMPOSE_FILE=docker-compose.prod.yml
    echo 🚀 Deploying in PRODUCTION mode...
) else (
    echo 🔧 Deploying in DEVELOPMENT mode...
)

REM Check Docker installation
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not in PATH
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Compose is not installed or not in PATH
    exit /b 1
)

echo ✓ Docker and Docker Compose are installed

REM Check compose file exists
if not exist "%COMPOSE_FILE%" (
    echo ERROR: Compose file %COMPOSE_FILE% not found
    exit /b 1
)
echo ✓ Found compose file: %COMPOSE_FILE%

REM Execute action
if "%ACTION%"=="up" (
    echo.
    echo ====================================
    echo Pulling Latest Base Images
    echo ====================================
    docker pull node:18-alpine
    docker pull python:3.11-slim
    docker pull mongo:7
    docker pull redis:7-alpine
    docker pull nginx:alpine
    
    echo.
    echo ====================================
    echo Building Docker Images
    echo ====================================
    docker-compose -f %COMPOSE_FILE% build --pull
    
    echo.
    echo ====================================
    echo Starting Services
    echo ====================================
    docker-compose -f %COMPOSE_FILE% up -d
    
    timeout /t 3 /nobreak
    
    echo.
    echo ====================================
    echo Service Status
    echo ====================================
    docker-compose -f %COMPOSE_FILE% ps
    
    echo.
    echo ====================================
    echo Checking Service Health
    echo ====================================
    echo Frontend: http://localhost:3000
    echo Backend API: http://localhost:5000/health
    echo ML Service: http://localhost:8000/health
    echo.
    
) else if "%ACTION%"=="down" (
    echo.
    echo ====================================
    echo Stopping Services
    echo ====================================
    docker-compose -f %COMPOSE_FILE% down
    
) else if "%ACTION%"=="restart" (
    echo.
    echo ====================================
    echo Restarting Services
    echo ====================================
    docker-compose -f %COMPOSE_FILE% restart
    
    timeout /t 3 /nobreak
    docker-compose -f %COMPOSE_FILE% ps
    
) else if "%ACTION%"=="logs" (
    echo.
    echo ====================================
    echo Showing Logs (Press Ctrl+C to exit)
    echo ====================================
    docker-compose -f %COMPOSE_FILE% logs -f
    
) else if "%ACTION%"=="status" (
    echo.
    echo ====================================
    echo Container Status
    echo ====================================
    docker-compose -f %COMPOSE_FILE% ps
    
    echo.
    echo ====================================
    echo Checking Service Health
    echo ====================================
    
    echo Frontend (3000):
    curl -s http://localhost:3000/ 2>&1 | findstr /r "^" > nul && echo "✓ Running" || echo "✗ Not responding"
    
    echo Backend (5000):
    curl -s http://localhost:5000/health 2>&1 | findstr /r "^" > nul && echo "✓ Running" || echo "✗ Not responding"
    
    echo ML Service (8000):
    curl -s http://localhost:8000/health 2>&1 | findstr /r "^" > nul && echo "✓ Running" || echo "✗ Not responding"
    
    echo Database (MongoDB):
    docker exec swachhcity-mongodb mongosh --eval "db.adminCommand('ping')" 2>&1 | findstr "ok" > nul && echo "✓ Connected" || echo "✗ Cannot connect"
    
    echo Cache (Redis):
    docker exec swachhcity-redis redis-cli ping 2>&1 | findstr "PONG" > nul && echo "✓ Connected" || echo "✗ Cannot connect"
    
) else if "%ACTION%"=="build" (
    echo.
    echo ====================================
    echo Building Docker Images
    echo ====================================
    docker-compose -f %COMPOSE_FILE% build --pull
    
) else if "%ACTION%"=="pull" (
    echo.
    echo ====================================
    echo Pulling Latest Base Images
    echo ====================================
    docker pull node:18-alpine
    docker pull python:3.11-slim
    docker pull mongo:7
    docker pull redis:7-alpine
    docker pull nginx:alpine
    echo ✓ Images pulled successfully
    
) else (
    echo.
    echo SwachhCity Docker Deployment Script
    echo.
    echo Usage: deploy.bat [environment] [action]
    echo.
    echo Environments:
    echo   development  - Use docker-compose.yml (default)
    echo   production   - Use docker-compose.prod.yml
    echo.
    echo Actions:
    echo   up           - Build and start services (default)
    echo   down         - Stop services
    echo   restart      - Restart services
    echo   logs         - Show live logs
    echo   status       - Show service status
    echo   build        - Build images only
    echo   pull         - Pull latest base images
    echo.
    echo Examples:
    echo   deploy.bat                     # Start in development
    echo   deploy.bat production up       # Deploy production
    echo   deploy.bat development logs    # Show dev logs
    echo   deploy.bat production restart  # Restart production
)

endlocal

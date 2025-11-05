@echo off
title OpenSign Docker Deployment

echo Starting OpenSign deployment with Docker...
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker could not be found. Please install Docker and try again.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker Compose could not be found. Please install Docker Compose and try again.
    pause
    exit /b 1
)

REM Build and start services with docker-compose
echo Building and starting services...
docker-compose up -d --build

REM Wait for services to start
echo Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Check if services are running
echo Checking service status...
docker-compose ps

echo.
echo Deployment completed!
echo Frontend is available at: http://localhost
echo Backend API is available at: http://localhost:8081/app
echo.

REM Show logs
echo Showing recent logs...
docker-compose logs --tail=20

echo.
echo Press any key to exit...
pause >nul
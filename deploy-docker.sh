#!/bin/bash

# Docker Deployment Script for OpenSign

echo "Starting OpenSign deployment with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "Docker could not be found. Please install Docker and try again."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo "Docker Compose could not be found. Please install Docker Compose and try again."
    exit 1
fi

# Build and start services with docker-compose
echo "Building and starting services..."
docker-compose up -d --build

# Wait for services to start
echo "Waiting for services to start..."
sleep 30

# Check if services are running
echo "Checking service status..."
docker-compose ps

echo "Deployment completed!"
echo "Frontend is available at: http://localhost"
echo "Backend API is available at: http://localhost:8081/app"

# Show logs
echo "Showing recent logs (press Ctrl+C to exit)..."
docker-compose logs -f --tail=20
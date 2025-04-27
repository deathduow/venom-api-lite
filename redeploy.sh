#!/bin/bash

echo "Stopping and removing running containers..."
docker-compose down

echo "Pruning old Docker images..."
docker image prune -af

echo "Pruning old Docker networks..."
docker network prune -f

echo "Building Docker images without cache..."
docker-compose build --no-cache

echo "Starting up Docker containers..."
docker-compose up -d

echo "Deployment finished!"
docker ps -a

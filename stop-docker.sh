#!/bin/bash

echo \"🛑 Stopping and Removing Docker Containers...\"
docker-compose down

echo \"🧹 Cleaning up dangling Docker images...\"
docker image prune -a -f

echo \"✅ Docker containers stopped and images cleaned.\"

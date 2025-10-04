#!/bin/bash

# Charge les variables d'environnement
set -a
source .env.local
set +a

# Lance Docker Compose
docker compose -f docker-compose.local.yml up -d

echo "✅ Infrastructure lancée !"
echo "📊 N8N: http://localhost:5678"
echo "📈 Grafana: http://localhost:3000"
echo "🔍 Prometheus: http://localhost:9090"

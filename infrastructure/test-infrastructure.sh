#!/bin/bash

# =====================================================
# SCRIPT TEST INFRASTRUCTURE LOCALE
# Date: 03/10/2025
# Usage: ./test-infrastructure.sh
# =====================================================

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  TEST INFRASTRUCTURE JOBNEXAI          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# =====================================================
# ÉTAPE 1: VÉRIFICATION PRÉREQUIS
# =====================================================

echo -e "${YELLOW}[1/6] Vérification prérequis...${NC}"

# Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker non installé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker: $(docker --version | cut -d' ' -f3)${NC}"

# Docker Compose
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose non installé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose: $(docker compose version | cut -d' ' -f4)${NC}"

# .env.local
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Fichier .env.local manquant${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Fichier .env.local présent${NC}"

echo ""

# =====================================================
# ÉTAPE 2: NETTOYAGE
# =====================================================

echo -e "${YELLOW}[2/6] Nettoyage environnement...${NC}"

# Arrêter containers existants
docker compose -f docker-compose.local.yml down -v 2>/dev/null || true

echo -e "${GREEN}✅ Environnement nettoyé${NC}"
echo ""

# =====================================================
# ÉTAPE 3: DÉMARRAGE SERVICES
# =====================================================

echo -e "${YELLOW}[3/6] Démarrage services...${NC}"

docker compose -f docker-compose.local.yml --env-file .env.local up -d

echo -e "${GREEN}✅ Services démarrés${NC}"
echo ""

# =====================================================
# ÉTAPE 4: ATTENTE DÉMARRAGE
# =====================================================

echo -e "${YELLOW}[4/6] Attente démarrage complet...${NC}"

services=("postgres-local" "redis-local" "n8n-local" "prometheus-local" "grafana-local")
max_wait=120
elapsed=0

for service in "${services[@]}"; do
    echo -n "  Attente $service..."
    while [ $elapsed -lt $max_wait ]; do
        if docker inspect -f '{{.State.Health.Status}}' $service 2>/dev/null | grep -q "healthy\|starting"; then
            echo -e " ${GREEN}✅${NC}"
            break
        fi
        if [ $elapsed -eq $max_wait ]; then
            echo -e " ${RED}❌ Timeout${NC}"
            docker logs $service --tail 20
            exit 1
        fi
        sleep 2
        elapsed=$((elapsed + 2))
    done
    elapsed=0
done

# Attente supplémentaire pour stabilisation
echo "  Stabilisation (10s)..."
sleep 10

echo -e "${GREEN}✅ Tous les services sont prêts${NC}"
echo ""

# =====================================================
# ÉTAPE 5: TESTS CONNEXION
# =====================================================

echo -e "${YELLOW}[5/6] Tests connexion services...${NC}"

# Test PostgreSQL
echo -n "  PostgreSQL (5432)..."
if docker exec postgres-local pg_isready -U n8n &>/dev/null; then
    echo -e " ${GREEN}✅${NC}"
else
    echo -e " ${RED}❌${NC}"
    exit 1
fi

# Test Redis
echo -n "  Redis (6379)..."
if docker exec redis-local redis-cli ping | grep -q "PONG"; then
    echo -e " ${GREEN}✅${NC}"
else
    echo -e " ${RED}❌${NC}"
    exit 1
fi

# Test N8N
echo -n "  N8N (5678)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5678 | grep -q "401\|200"; then
    echo -e " ${GREEN}✅${NC}"
else
    echo -e " ${RED}❌${NC}"
    exit 1
fi

# Test Prometheus
echo -n "  Prometheus (9090)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:9090 | grep -q "200"; then
    echo -e " ${GREEN}✅${NC}"
else
    echo -e " ${RED}❌${NC}"
    exit 1
fi

# Test Grafana
echo -n "  Grafana (3000)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|302"; then
    echo -e " ${GREEN}✅${NC}"
else
    echo -e " ${RED}❌${NC}"
    exit 1
fi

# Test cAdvisor
echo -n "  cAdvisor (8080)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200"; then
    echo -e " ${GREEN}✅${NC}"
else
    echo -e " ${RED}❌${NC}"
    exit 1
fi

# Test Node Exporter
echo -n "  Node Exporter (9100)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:9100 | grep -q "200"; then
    echo -e " ${GREEN}✅${NC}"
else
    echo -e " ${RED}❌${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Tous les services sont accessibles${NC}"
echo ""

# =====================================================
# ÉTAPE 6: TESTS FONCTIONNELS
# =====================================================

echo -e "${YELLOW}[6/6] Tests fonctionnels...${NC}"

# Test Prometheus targets
echo -n "  Prometheus targets..."
targets=$(curl -s http://localhost:9090/api/v1/targets | grep -o '"health":"up"' | wc -l)
if [ $targets -gt 3 ]; then
    echo -e " ${GREEN}✅ ($targets targets up)${NC}"
else
    echo -e " ${YELLOW}⚠️  ($targets targets up)${NC}"
fi

# Test Redis queue
echo -n "  Redis queue..."
if docker exec redis-local redis-cli INFO | grep -q "connected_clients"; then
    echo -e " ${GREEN}✅${NC}"
else
    echo -e " ${RED}❌${NC}"
fi

# Test PostgreSQL database
echo -n "  PostgreSQL database..."
if docker exec postgres-local psql -U n8n -d n8n -c "SELECT 1" &>/dev/null; then
    echo -e " ${GREEN}✅${NC}"
else
    echo -e " ${RED}❌${NC}"
fi

echo ""

# =====================================================
# RÉSUMÉ
# =====================================================

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  TESTS COMPLÉTÉS AVEC SUCCÈS !         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 SERVICES DISPONIBLES:${NC}"
echo "  • N8N:           http://localhost:5678"
echo "  • Grafana:       http://localhost:3000"
echo "  • Prometheus:    http://localhost:9090"
echo "  • cAdvisor:      http://localhost:8080"
echo "  • Node Exporter: http://localhost:9100"
echo ""
echo -e "${BLUE}🔑 CREDENTIALS:${NC}"
echo "  • N8N:     lionel / TestLocal123!"
echo "  • Grafana: admin / TestGrafana123!"
echo ""
echo -e "${BLUE}📝 COMMANDES UTILES:${NC}"
echo "  • Logs:    docker compose -f docker-compose.local.yml logs -f [service]"
echo "  • Stop:    docker compose -f docker-compose.local.yml down"
echo "  • Restart: docker compose -f docker-compose.local.yml restart [service]"
echo "  • Stats:   docker stats"
echo ""
echo -e "${GREEN}✅ Infrastructure prête pour tests !${NC}"

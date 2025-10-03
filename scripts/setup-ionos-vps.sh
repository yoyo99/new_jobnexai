#!/bin/bash

# =====================================================
# SETUP VPS IONOS POUR N8N - JobNexAI
# Date: 03/10/2025
# VPS: IONOS Linux L (6 vCores, 8GB RAM, 240GB NVMe)
# OS: Ubuntu 24.04 LTS
# =====================================================

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  SETUP VPS IONOS - JobNexAI N8N       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# =====================================================
# 1. MISE À JOUR SYSTÈME (2 min)
# =====================================================

echo -e "${YELLOW}[1/8] Mise à jour système...${NC}"

apt-get update
apt-get upgrade -y
apt-get install -y \
  curl \
  wget \
  git \
  htop \
  vim \
  ufw \
  fail2ban \
  unzip

echo -e "${GREEN}✅ Système à jour${NC}"
echo ""

# =====================================================
# 2. INSTALLATION DOCKER (3 min)
# =====================================================

echo -e "${YELLOW}[2/8] Installation Docker...${NC}"

# Supprimer anciennes versions
apt-get remove -y docker docker-engine docker.io containerd runc || true

# Ajouter repo Docker
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Démarrer Docker
systemctl start docker
systemctl enable docker

# Vérifier
docker --version
docker compose version

echo -e "${GREEN}✅ Docker installé${NC}"
echo ""

# =====================================================
# 3. CONFIGURATION FIREWALL (1 min)
# =====================================================

echo -e "${YELLOW}[3/8] Configuration firewall...${NC}"

# Autoriser SSH
ufw allow 22/tcp

# Autoriser N8N
ufw allow 5678/tcp

# Autoriser HTTP/HTTPS (si reverse proxy futur)
ufw allow 80/tcp
ufw allow 443/tcp

# Activer firewall
ufw --force enable

echo -e "${GREEN}✅ Firewall configuré${NC}"
echo ""

# =====================================================
# 4. CONFIGURATION FAIL2BAN (1 min)
# =====================================================

echo -e "${YELLOW}[4/8] Configuration Fail2ban...${NC}"

# Créer config SSH
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log
EOF

# Démarrer Fail2ban
systemctl start fail2ban
systemctl enable fail2ban

echo -e "${GREEN}✅ Fail2ban configuré${NC}"
echo ""

# =====================================================
# 5. OPTIMISATION SYSTÈME (2 min)
# =====================================================

echo -e "${YELLOW}[5/8] Optimisation système...${NC}"

# Augmenter limites fichiers
cat >> /etc/security/limits.conf << 'EOF'
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
EOF

# Optimiser kernel
cat >> /etc/sysctl.conf << 'EOF'
# Network optimizations
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.ip_local_port_range = 1024 65535

# Memory optimizations
vm.swappiness = 10
vm.dirty_ratio = 60
vm.dirty_background_ratio = 2
EOF

sysctl -p

echo -e "${GREEN}✅ Système optimisé${NC}"
echo ""

# =====================================================
# 6. CRÉATION STRUCTURE N8N (1 min)
# =====================================================

echo -e "${YELLOW}[6/8] Création structure N8N...${NC}"

# Créer répertoires
mkdir -p /opt/jobnexai-scraping
mkdir -p /opt/jobnexai-scraping/n8n-workflows
mkdir -p /root/.n8n
mkdir -p /var/log/n8n

# Permissions
chmod 755 /opt/jobnexai-scraping
chmod 755 /root/.n8n

echo -e "${GREEN}✅ Structure créée${NC}"
echo ""

# =====================================================
# 7. CONFIGURATION DOCKER COMPOSE (2 min)
# =====================================================

echo -e "${YELLOW}[7/8] Configuration Docker Compose...${NC}"

# Récupérer IP publique
PUBLIC_IP=$(curl -s ifconfig.me)

cat > /opt/jobnexai-scraping/docker-compose.yml << EOF
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      # Auth
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=lionel
      - N8N_BASIC_AUTH_PASSWORD=JobNexAI_Admin_2025!
      
      # Network
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://${PUBLIC_IP}:5678/
      
      # Timezone
      - GENERIC_TIMEZONE=Europe/Paris
      - TZ=Europe/Paris
      
      # Performance
      - N8N_METRICS=true
      - N8N_LOG_LEVEL=info
      - N8N_LOG_OUTPUT=console,file
      - N8N_LOG_FILE_LOCATION=/var/log/n8n/
      
      # Execution
      - EXECUTIONS_PROCESS=main
      - EXECUTIONS_MODE=regular
      - EXECUTIONS_TIMEOUT=300
      - EXECUTIONS_TIMEOUT_MAX=600
      
      # Database (SQLite par défaut, PostgreSQL recommandé pour prod)
      - DB_TYPE=sqlite
      
    volumes:
      - /root/.n8n:/home/node/.n8n
      - /opt/jobnexai-scraping/n8n-workflows:/home/node/.n8n/workflows
      - /var/log/n8n:/var/log/n8n
      
    networks:
      - n8n-network
    
    # Limites ressources (adapté VPS L)
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 6G
        reservations:
          cpus: '2'
          memory: 2G

networks:
  n8n-network:
    driver: bridge
EOF

echo -e "${GREEN}✅ Docker Compose configuré${NC}"
echo -e "${YELLOW}   IP publique: ${PUBLIC_IP}${NC}"
echo ""

# =====================================================
# 8. DÉMARRAGE N8N (1 min)
# =====================================================

echo -e "${YELLOW}[8/8] Démarrage N8N...${NC}"

cd /opt/jobnexai-scraping
docker compose up -d

# Attendre démarrage
echo "⏳ Attente démarrage N8N (30s)..."
sleep 30

# Vérifier
docker compose ps

echo -e "${GREEN}✅ N8N démarré${NC}"
echo ""

# =====================================================
# RÉSUMÉ
# =====================================================

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  SETUP COMPLÉTÉ AVEC SUCCÈS !          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📊 INFORMATIONS:${NC}"
echo "  • OS: Ubuntu 24.04 LTS"
echo "  • Docker: $(docker --version | cut -d' ' -f3)"
echo "  • IP publique: ${PUBLIC_IP}"
echo "  • N8N URL: http://${PUBLIC_IP}:5678"
echo "  • Login: lionel"
echo "  • Password: JobNexAI_Admin_2025!"
echo ""
echo -e "${YELLOW}🔧 PROCHAINES ÉTAPES:${NC}"
echo "  1. Ouvrir http://${PUBLIC_IP}:5678"
echo "  2. Login avec credentials"
echo "  3. Importer workflows depuis Contabo"
echo "  4. Configurer credentials (Supabase, Mammouth.ai)"
echo "  5. Tester un workflow"
echo ""
echo -e "${YELLOW}📁 EMPLACEMENTS:${NC}"
echo "  • N8N data: /root/.n8n"
echo "  • Workflows: /opt/jobnexai-scraping/n8n-workflows"
echo "  • Logs: /var/log/n8n"
echo "  • Docker Compose: /opt/jobnexai-scraping/docker-compose.yml"
echo ""
echo -e "${YELLOW}🔍 COMMANDES UTILES:${NC}"
echo "  • Logs N8N: docker compose logs -f n8n"
echo "  • Restart N8N: docker compose restart n8n"
echo "  • Stop N8N: docker compose down"
echo "  • Start N8N: docker compose up -d"
echo "  • Stats: docker stats n8n"
echo ""
echo -e "${GREEN}✅ VPS IONOS prêt pour N8N !${NC}"

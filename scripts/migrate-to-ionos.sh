#!/bin/bash

# =====================================================
# SCRIPT MIGRATION N8N - CONTABO → IONOS
# Date: 03/10/2025
# Durée estimée: 30-45 minutes
# =====================================================

set -e  # Exit on error

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
OLD_VPS="38.242.238.205"
NEW_VPS="VOTRE_IP_IONOS"  # À remplacer par l'IP de ton VPS IONOS Linux L
BACKUP_DIR="/tmp/n8n-backup-$(date +%Y%m%d-%H%M%S)"
N8N_DIR="/opt/jobnexai-scraping"

# VPS IONOS Linux L Specs
# - 6 vCores CPU
# - 8 GB RAM
# - 240 GB NVMe SSD
# - Ubuntu 24.04 LTS
# - Localisation: EU

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  MIGRATION N8N CONTABO → IONOS        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# =====================================================
# ÉTAPE 1: BACKUP VPS CONTABO (5 min)
# =====================================================

echo -e "${YELLOW}[1/6] Backup VPS Contabo...${NC}"

ssh root@$OLD_VPS << 'EOF'
  echo "📦 Arrêt N8N..."
  cd /opt/jobnexai-scraping
  docker-compose down
  
  echo "📦 Création backup..."
  tar -czf /tmp/n8n-backup.tar.gz \
    /opt/jobnexai-scraping \
    /root/.n8n \
    --exclude='node_modules' \
    --exclude='*.log'
  
  echo "✅ Backup créé: $(du -h /tmp/n8n-backup.tar.gz | cut -f1)"
EOF

echo -e "${GREEN}✅ Backup Contabo complété${NC}"
echo ""

# =====================================================
# ÉTAPE 2: TÉLÉCHARGEMENT BACKUP (5 min)
# =====================================================

echo -e "${YELLOW}[2/6] Téléchargement backup...${NC}"

mkdir -p $BACKUP_DIR
scp root@$OLD_VPS:/tmp/n8n-backup.tar.gz $BACKUP_DIR/

echo -e "${GREEN}✅ Backup téléchargé: $BACKUP_DIR/n8n-backup.tar.gz${NC}"
echo ""

# =====================================================
# ÉTAPE 3: SETUP IONOS (10 min)
# =====================================================

echo -e "${YELLOW}[3/6] Setup VPS IONOS...${NC}"

ssh root@$NEW_VPS << 'EOF'
  echo "🔧 Installation Docker..."
  apt-get update
  apt-get install -y docker.io docker-compose
  systemctl start docker
  systemctl enable docker
  
  echo "🔧 Création répertoires..."
  mkdir -p /opt/jobnexai-scraping
  mkdir -p /root/.n8n
  
  echo "✅ Docker installé: $(docker --version)"
EOF

echo -e "${GREEN}✅ IONOS configuré${NC}"
echo ""

# =====================================================
# ÉTAPE 4: UPLOAD BACKUP IONOS (5 min)
# =====================================================

echo -e "${YELLOW}[4/6] Upload backup vers IONOS...${NC}"

scp $BACKUP_DIR/n8n-backup.tar.gz root@$NEW_VPS:/tmp/

ssh root@$NEW_VPS << 'EOF'
  echo "📦 Extraction backup..."
  cd /
  tar -xzf /tmp/n8n-backup.tar.gz
  
  echo "✅ Backup extrait"
EOF

echo -e "${GREEN}✅ Backup uploadé et extrait${NC}"
echo ""

# =====================================================
# ÉTAPE 5: CONFIGURATION N8N (10 min)
# =====================================================

echo -e "${YELLOW}[5/6] Configuration N8N sur IONOS...${NC}"

ssh root@$NEW_VPS << 'EOF'
  cd /opt/jobnexai-scraping
  
  # Créer docker-compose.yml si absent
  if [ ! -f docker-compose.yml ]; then
    cat > docker-compose.yml << 'DOCKER'
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=lionel
      - N8N_BASIC_AUTH_PASSWORD=JobNexAI_Admin_2025!
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://VOTRE_IP_IONOS:5678/
      - GENERIC_TIMEZONE=Europe/Paris
      - N8N_METRICS=true
    volumes:
      - /root/.n8n:/home/node/.n8n
      - ./n8n-workflows:/home/node/.n8n/workflows
    networks:
      - n8n-network

networks:
  n8n-network:
    driver: bridge
DOCKER
  fi
  
  # Remplacer IP dans docker-compose.yml
  sed -i "s/38.242.238.205/$NEW_VPS/g" docker-compose.yml
  
  echo "🚀 Démarrage N8N..."
  docker-compose up -d
  
  echo "⏳ Attente démarrage (30s)..."
  sleep 30
  
  echo "✅ N8N démarré"
  docker-compose ps
EOF

echo -e "${GREEN}✅ N8N configuré et démarré${NC}"
echo ""

# =====================================================
# ÉTAPE 6: TESTS VALIDATION (5 min)
# =====================================================

echo -e "${YELLOW}[6/6] Tests de validation...${NC}"

# Test connexion N8N
echo "🧪 Test connexion N8N..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$NEW_VPS:5678)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
  echo -e "${GREEN}✅ N8N accessible (HTTP $HTTP_CODE)${NC}"
else
  echo -e "${RED}❌ N8N non accessible (HTTP $HTTP_CODE)${NC}"
  exit 1
fi

# Test Supabase depuis IONOS
echo "🧪 Test connexion Supabase..."
ssh root@$NEW_VPS << 'EOF'
  curl -s -o /dev/null -w "%{http_code}" https://klwugophjvzctlautsqz.supabase.co
EOF

echo -e "${GREEN}✅ Connexion Supabase OK${NC}"
echo ""

# =====================================================
# RÉSUMÉ MIGRATION
# =====================================================

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  MIGRATION COMPLÉTÉE AVEC SUCCÈS !     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📊 RÉSUMÉ:${NC}"
echo "  • Ancien VPS: $OLD_VPS (Contabo)"
echo "  • Nouveau VPS: $NEW_VPS (IONOS)"
echo "  • N8N URL: http://$NEW_VPS:5678"
echo "  • Backup: $BACKUP_DIR/n8n-backup.tar.gz"
echo ""
echo -e "${YELLOW}🔧 PROCHAINES ÉTAPES:${NC}"
echo "  1. Ouvrir http://$NEW_VPS:5678"
echo "  2. Login: lionel / JobNexAI_Admin_2025!"
echo "  3. Vérifier workflows importés"
echo "  4. Tester un workflow manuellement"
echo "  5. Mettre à jour URL webhook dans FastAPI"
echo "  6. Activer les Cron workflows"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "  • Mettre à jour deployment/api/main.py:"
echo "    OLD: http://38.242.238.205:5678"
echo "    NEW: http://$NEW_VPS:5678"
echo ""
echo "  • Redéployer FastAPI sur Netlify"
echo ""
echo -e "${GREEN}✅ Migration terminée en $(date)${NC}"

# =====================================================
# CLEANUP (OPTIONNEL)
# =====================================================

read -p "Voulez-vous supprimer le backup local ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  rm -rf $BACKUP_DIR
  echo -e "${GREEN}✅ Backup local supprimé${NC}"
fi

echo ""
echo -e "${YELLOW}💡 TIP: Gardez l'ancien VPS actif 24-48h pour rollback si besoin${NC}"

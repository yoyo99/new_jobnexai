#!/bin/bash

# 🚀 Script de déploiement JobNexAI Scraping Stack
# Contabo CX31 - IP: 38.242.238.205

set -e

# Configuration
VPS_IP="38.242.238.205"
VPS_USER="root"
DEPLOYMENT_DIR="/opt/jobnexai-scraping"
LOCAL_DIR="./deployment"

echo "🚀 Déploiement JobNexAI Scraping Stack sur Contabo CX31"
echo "📍 IP: $VPS_IP"
echo "📁 Dossier: $DEPLOYMENT_DIR"
echo ""

# Vérification des fichiers locaux
echo "📋 Vérification des fichiers..."
if [ ! -f "$LOCAL_DIR/docker-compose.yml" ]; then
    echo "❌ docker-compose.yml manquant"
    exit 1
fi

if [ ! -f "$LOCAL_DIR/api/main.py" ]; then
    echo "❌ API main.py manquant"
    exit 1
fi

echo "✅ Fichiers vérifiés"

# Étape 1: Connexion et préparation VPS
echo ""
echo "🔧 Étape 1: Préparation du VPS..."

ssh $VPS_USER@$VPS_IP << 'EOF'
# Mise à jour système
apt-get update && apt-get upgrade -y

# Installation Docker si nécessaire
if ! command -v docker &> /dev/null; then
    echo "📦 Installation Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Installation Docker Compose si nécessaire
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installation Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Création structure dossiers
echo "📁 Création structure dossiers..."
mkdir -p /opt/jobnexai-scraping/{api,n8n-workflows,nginx,logs,postgres-init}

# Configuration firewall
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS  
ufw allow 5678  # N8N (temporaire)
ufw allow 8000  # API (temporaire)
ufw --force enable

echo "✅ VPS préparé"
EOF

# Étape 2: Upload des fichiers
echo ""
echo "📤 Étape 2: Upload des fichiers..."

# Upload docker-compose.yml
scp $LOCAL_DIR/docker-compose.yml $VPS_USER@$VPS_IP:$DEPLOYMENT_DIR/

# Upload API
scp -r $LOCAL_DIR/api/ $VPS_USER@$VPS_IP:$DEPLOYMENT_DIR/

# Upload Nginx config
scp -r $LOCAL_DIR/nginx/ $VPS_USER@$VPS_IP:$DEPLOYMENT_DIR/

echo "✅ Fichiers uploadés"

# Étape 3: Déploiement containers
echo ""
echo "🐳 Étape 3: Déploiement des containers..."

ssh $VPS_USER@$VPS_IP << EOF
cd $DEPLOYMENT_DIR

# Arrêt containers existants (si présents)
docker-compose down 2>/dev/null || true

# Construction et démarrage
echo "🏗️ Construction des images..."
docker-compose build --no-cache

echo "🚀 Démarrage des services..."
docker-compose up -d

# Attendre que les services démarrent
echo "⏳ Attente démarrage des services (30s)..."
sleep 30

# Vérification status
echo "📊 Status des containers:"
docker-compose ps

echo "🔍 Logs des services:"
docker-compose logs --tail=20 n8n
docker-compose logs --tail=20 scraping-api
EOF

# Étape 4: Tests de santé
echo ""
echo "🏥 Étape 4: Tests de santé..."

# Test API
echo "🧪 Test API..."
if curl -f http://$VPS_IP:8000/ &>/dev/null; then
    echo "✅ API accessible"
else
    echo "⚠️ API non accessible (normal si en cours de démarrage)"
fi

# Test N8N
echo "🧪 Test N8N..."  
if curl -f http://$VPS_IP:5678/ &>/dev/null; then
    echo "✅ N8N accessible"
else
    echo "⚠️ N8N non accessible (normal si en cours de démarrage)"
fi

# Étape 5: Instructions finales
echo ""
echo "🎉 DÉPLOIEMENT TERMINÉ !"
echo ""
echo "📍 Services disponibles:"
echo "   • N8N Interface: http://$VPS_IP:5678"
echo "   • API Scraping:  http://$VPS_IP:8000"
echo "   • Docs API:      http://$VPS_IP:8000/docs"
echo "   • Nginx Proxy:   http://$VPS_IP/"
echo ""
echo "🔐 Identifiants N8N:"
echo "   • Utilisateur: lionel"
echo "   • Mot de passe: JobNexAI_Admin_2025!"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Configurer les workflows N8N"
echo "   2. Tester les 5 scrapers prioritaires"
echo "   3. Intégrer avec JobNexAI frontend"
echo ""
echo "📊 Monitoring:"
echo "   ssh $VPS_USER@$VPS_IP 'cd $DEPLOYMENT_DIR && docker-compose logs -f'"
echo ""
echo "🔧 Commandes utiles:"
echo "   • Redémarrer: ssh $VPS_USER@$VPS_IP 'cd $DEPLOYMENT_DIR && docker-compose restart'"
echo "   • Logs: ssh $VPS_USER@$VPS_IP 'cd $DEPLOYMENT_DIR && docker-compose logs'"
echo "   • Status: ssh $VPS_USER@$VPS_IP 'cd $DEPLOYMENT_DIR && docker-compose ps'"

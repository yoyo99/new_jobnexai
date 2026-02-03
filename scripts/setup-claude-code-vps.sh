#!/bin/bash
# =============================================================
# Installation de Claude Code sur un VPS
# =============================================================
# Usage: ssh root@votre-vps 'bash -s' < scripts/setup-claude-code-vps.sh
#    ou: scp scripts/setup-claude-code-vps.sh root@votre-vps: && ssh root@votre-vps ./setup-claude-code-vps.sh
#
# Pre-requis:
#   - VPS avec Ubuntu/Debian
#   - Acces root ou sudo
#   - Cle API Anthropic (https://console.anthropic.com/)
# =============================================================

set -e

echo "=========================================="
echo "  Installation de Claude Code sur le VPS"
echo "=========================================="
echo ""

# 1. Verifier l'OS
if ! command -v apt &> /dev/null; then
  echo "Ce script est concu pour Ubuntu/Debian."
  echo "Pour un autre OS, adapte les commandes."
  exit 1
fi

# 2. Installer Node.js (v18+) si absent
echo "[1/6] Verification de Node.js..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -ge 18 ]; then
    echo "  Node.js $(node -v) deja installe"
  else
    echo "  Node.js $(node -v) trop ancien, mise a jour..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  fi
else
  echo "  Installation de Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "  Node.js $(node -v) - npm $(npm -v)"

# 3. Installer les outils necessaires
echo ""
echo "[2/6] Installation des outils (git, tmux, jq, curl)..."
apt-get update -qq
apt-get install -y git tmux jq curl > /dev/null 2>&1
echo "  git, tmux, jq, curl installes"

# 4. Installer Claude Code
echo ""
echo "[3/6] Installation de Claude Code..."
npm install -g @anthropic-ai/claude-code 2>/dev/null
echo "  Claude Code $(claude --version 2>/dev/null || echo 'installe')"

# 5. Cloner ou mettre a jour le repo JobNexAI
echo ""
echo "[4/6] Configuration du repo JobNexAI..."
REPO_DIR="/home/user/JobNexAI"

if [ -d "$REPO_DIR/.git" ]; then
  echo "  Repo existe deja dans $REPO_DIR"
  cd "$REPO_DIR"
  git fetch origin
else
  echo "  Clonage du repo..."
  mkdir -p "$(dirname $REPO_DIR)"
  git clone https://github.com/yoyo99/JobNexAI.git "$REPO_DIR"
  cd "$REPO_DIR"
fi

# 6. Configurer la cle API Anthropic
echo ""
echo "[5/6] Configuration de la cle API Anthropic..."

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo ""
  echo "  Tu as besoin d'une cle API Anthropic."
  echo "  Obtiens-la sur: https://console.anthropic.com/settings/keys"
  echo ""
  read -p "  Entre ta cle API Anthropic (sk-ant-...): " API_KEY

  if [ -n "$API_KEY" ]; then
    # Ajouter au profil bash
    if ! grep -q "ANTHROPIC_API_KEY" ~/.bashrc 2>/dev/null; then
      echo "export ANTHROPIC_API_KEY=\"$API_KEY\"" >> ~/.bashrc
    fi
    export ANTHROPIC_API_KEY="$API_KEY"
    echo "  Cle API configuree dans ~/.bashrc"
  else
    echo "  Pas de cle fournie. Tu pourras la configurer plus tard :"
    echo "  echo 'export ANTHROPIC_API_KEY=\"sk-ant-...\"' >> ~/.bashrc"
  fi
else
  echo "  ANTHROPIC_API_KEY deja definie"
fi

# 7. Copier la config MCP pour n8n
echo ""
echo "[6/6] Configuration MCP pour n8n..."
mkdir -p "$REPO_DIR/.claude"

if [ -f "$REPO_DIR/mcp_config.json" ]; then
  cp "$REPO_DIR/mcp_config.json" "$REPO_DIR/.claude/mcp.json"
  echo "  Config MCP copiee dans .claude/mcp.json"
else
  echo "  mcp_config.json non trouve, a configurer manuellement"
fi

echo ""
echo "=========================================="
echo "  Installation terminee !"
echo "=========================================="
echo ""
echo "Pour utiliser Claude Code :"
echo ""
echo "  # Demarre une session tmux (persistante)"
echo "  tmux new -s claude"
echo ""
echo "  # Lance Claude Code dans le projet"
echo "  cd $REPO_DIR"
echo "  claude"
echo ""
echo "  # Pour te detacher de tmux : Ctrl+B puis D"
echo "  # Pour te reconnecter      : tmux attach -t claude"
echo ""
echo "Avantages de Claude Code sur le VPS :"
echo "  - Meme reseau que n8n, Firecrawl, Ollama"
echo "  - Mac Mini allege"
echo "  - Scripts executables localement"
echo "  - Acces direct aux conteneurs Docker"
echo ""

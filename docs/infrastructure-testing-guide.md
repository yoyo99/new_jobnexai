# 🧪 GUIDE TEST INFRASTRUCTURE LOCALE

## 📋 Vue d'ensemble

Ce guide explique comment tester l'infrastructure JobNexAI en local avant la migration IONOS du 28/10/2025.

---

## 🎯 OBJECTIFS DES TESTS

1. ✅ Valider que tous les services démarrent correctement
2. ✅ Vérifier les connexions entre services
3. ✅ Tester le monitoring (Prometheus + Grafana)
4. ✅ Valider les dashboards Grafana
5. ✅ Identifier les problèmes potentiels
6. ✅ Optimiser la configuration

---

## 🔧 PRÉREQUIS

### **Logiciels Nécessaires**
```bash
# Docker Desktop (Mac)
# Télécharger: https://www.docker.com/products/docker-desktop

# Vérifier installation
docker --version          # >= 24.0.0
docker compose version    # >= 2.20.0
```

### **Ressources Système**
- **CPU** : 4+ cores recommandés
- **RAM** : 8 GB minimum (16 GB recommandé)
- **Disk** : 20 GB libres

---

## 🚀 DÉMARRAGE RAPIDE

### **Méthode 1 : Script Automatique** ⭐

```bash
# 1. Aller dans le dossier infrastructure
cd infrastructure

# 2. Lancer le script de test
./test-infrastructure.sh

# Le script va :
# - Vérifier les prérequis
# - Démarrer tous les services
# - Tester les connexions
# - Afficher les URLs d'accès
```

### **Méthode 2 : Manuel**

```bash
# 1. Aller dans le dossier infrastructure
cd infrastructure

# 2. Démarrer les services
docker compose -f docker-compose.local.yml --env-file .env.local up -d

# 3. Vérifier les logs
docker compose -f docker-compose.local.yml logs -f

# 4. Attendre que tous les services soient "healthy"
docker ps
```

---

## 📊 SERVICES DISPONIBLES

### **URLs d'Accès**

| Service | URL | Credentials |
|---------|-----|-------------|
| **N8N** | http://localhost:5678 | lionel / TestLocal123! |
| **Grafana** | http://localhost:3000 | admin / TestGrafana123! |
| **Prometheus** | http://localhost:9090 | - |
| **cAdvisor** | http://localhost:8080 | - |
| **Node Exporter** | http://localhost:9100/metrics | - |
| **Redis** | localhost:6379 | - |
| **PostgreSQL** | localhost:5432 | n8n / TestPostgres123! |

---

## ✅ CHECKLIST TESTS

### **1. Services de Base**

#### **PostgreSQL**
```bash
# Test connexion
docker exec postgres-local psql -U n8n -d n8n -c "SELECT version();"

# Vérifier tables N8N
docker exec postgres-local psql -U n8n -d n8n -c "\dt"

# Expected: Tables N8N créées automatiquement
```

#### **Redis**
```bash
# Test connexion
docker exec redis-local redis-cli ping
# Expected: PONG

# Vérifier info
docker exec redis-local redis-cli INFO | grep connected_clients

# Test set/get
docker exec redis-local redis-cli SET test "hello"
docker exec redis-local redis-cli GET test
# Expected: "hello"
```

#### **N8N**
```bash
# Test HTTP
curl -I http://localhost:5678
# Expected: HTTP/1.1 401 Unauthorized (normal, auth requise)

# Test avec auth
curl -u lionel:TestLocal123! http://localhost:5678/healthz
# Expected: {"status":"ok"}

# Ouvrir dans navigateur
open http://localhost:5678
```

---

### **2. Monitoring Stack**

#### **Prometheus**
```bash
# Test HTTP
curl http://localhost:9090/-/healthy
# Expected: Prometheus is Healthy.

# Vérifier targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Expected: Tous les targets "up"
```

#### **Grafana**
```bash
# Test HTTP
curl -I http://localhost:3000
# Expected: HTTP/1.1 302 Found

# Login et créer API key
# 1. Ouvrir http://localhost:3000
# 2. Login: admin / TestGrafana123!
# 3. Configuration → Data Sources
# 4. Vérifier Prometheus connecté
```

#### **cAdvisor**
```bash
# Test HTTP
curl http://localhost:8080/healthz
# Expected: ok

# Vérifier métriques containers
curl http://localhost:8080/metrics | grep container_cpu_usage_seconds_total

# Ouvrir interface
open http://localhost:8080
```

---

### **3. Tests Fonctionnels**

#### **Test N8N Workflow**
```bash
# 1. Ouvrir N8N: http://localhost:5678
# 2. Login: lionel / TestLocal123!
# 3. Créer workflow simple:
#    - Manual Trigger
#    - Set Node (test: "hello")
#    - Execute Workflow
# 4. Vérifier exécution réussie
```

#### **Test Redis Queue**
```bash
# Vérifier queue BullMQ
docker exec redis-local redis-cli KEYS "bull:*"

# Si N8N en queue mode, devrait voir des clés
```

#### **Test PostgreSQL N8N**
```bash
# Vérifier données N8N
docker exec postgres-local psql -U n8n -d n8n -c "SELECT COUNT(*) FROM execution_entity;"

# Après avoir exécuté un workflow, count > 0
```

---

### **4. Tests Performance**

#### **Charge CPU/RAM**
```bash
# Monitoring en temps réel
docker stats

# Expected:
# - n8n-local: < 10% CPU, < 1GB RAM (idle)
# - postgres-local: < 5% CPU, < 200MB RAM
# - redis-local: < 2% CPU, < 100MB RAM
# - prometheus-local: < 5% CPU, < 300MB RAM
# - grafana-local: < 3% CPU, < 200MB RAM
```

#### **Test Charge N8N**
```bash
# Exécuter 10 workflows simultanément
# Vérifier dans docker stats que CPU reste < 50%
```

---

### **5. Tests Dashboards Grafana**

#### **Import Dashboards**
```bash
# 1. Ouvrir Grafana: http://localhost:3000
# 2. Login: admin / TestGrafana123!
# 3. Dashboards → Import
# 4. Importer chaque dashboard:
#    - vps-overview.json
#    - docker-containers.json
#    - n8n-workflows.json
```

#### **Vérifier Métriques**
```
Dashboard VPS Overview:
- ✅ CPU Usage visible
- ✅ Memory Usage visible
- ✅ Disk Usage visible
- ✅ Network Traffic visible

Dashboard Docker Containers:
- ✅ Container Status = 7 (tous les containers)
- ✅ CPU par container visible
- ✅ Memory par container visible

Dashboard N8N Workflows:
- ✅ Workflow Executions visible
- ✅ Success Rate calculé
- ✅ Queue Size = 0 (si aucun job)
```

---

### **6. Tests Alerting**

#### **Test Alert Rules**
```bash
# Vérifier règles chargées
curl http://localhost:9090/api/v1/rules | jq '.data.groups[].rules[] | {alert: .name, state: .state}'

# Expected: Toutes les règles en état "inactive" (normal si pas de problème)
```

#### **Simuler Alert**
```bash
# Créer charge CPU artificielle
docker exec n8n-local sh -c "yes > /dev/null &"

# Attendre 5 minutes
# Vérifier dans Prometheus: http://localhost:9090/alerts
# Expected: Alert "HighCPUUsage" devrait se déclencher
```

---

## 🐛 TROUBLESHOOTING

### **Problème 1 : Service ne démarre pas**

```bash
# Vérifier logs
docker compose -f docker-compose.local.yml logs [service-name]

# Exemples:
docker compose -f docker-compose.local.yml logs n8n
docker compose -f docker-compose.local.yml logs postgres
docker compose -f docker-compose.local.yml logs redis
```

### **Problème 2 : Port déjà utilisé**

```bash
# Trouver processus utilisant le port
lsof -i :5678  # N8N
lsof -i :3000  # Grafana
lsof -i :9090  # Prometheus

# Tuer le processus
kill -9 [PID]

# Ou changer le port dans docker-compose.local.yml
```

### **Problème 3 : Manque de RAM**

```bash
# Vérifier utilisation RAM
docker stats --no-stream

# Réduire limites dans docker-compose.local.yml
# Ou augmenter RAM Docker Desktop:
# Docker Desktop → Settings → Resources → Memory
```

### **Problème 4 : Prometheus targets down**

```bash
# Vérifier réseau Docker
docker network inspect infrastructure_jobnexai-local

# Vérifier que tous les containers sont sur le même réseau

# Redémarrer Prometheus
docker compose -f docker-compose.local.yml restart prometheus
```

### **Problème 5 : Grafana dashboards vides**

```bash
# Vérifier datasource Prometheus
curl http://localhost:3000/api/datasources

# Re-configurer datasource:
# Grafana → Configuration → Data Sources → Prometheus
# URL: http://prometheus:9090
# Save & Test
```

---

## 🧹 NETTOYAGE

### **Arrêter tous les services**
```bash
cd infrastructure
docker compose -f docker-compose.local.yml down
```

### **Arrêter + Supprimer volumes**
```bash
docker compose -f docker-compose.local.yml down -v

# ⚠️ Supprime toutes les données (workflows N8N, dashboards Grafana, etc.)
```

### **Nettoyage complet Docker**
```bash
# Supprimer containers arrêtés
docker container prune -f

# Supprimer images inutilisées
docker image prune -a -f

# Supprimer volumes orphelins
docker volume prune -f

# Libérer espace disque
docker system prune -a --volumes -f
```

---

## 📈 MÉTRIQUES DE SUCCÈS

### **Tests Réussis Si :**

✅ **Services**
- Tous les 7 containers démarrent
- Tous les health checks passent
- Aucune erreur dans les logs

✅ **Connexions**
- N8N se connecte à PostgreSQL
- N8N se connecte à Redis
- Prometheus scrape tous les targets
- Grafana se connecte à Prometheus

✅ **Performance**
- CPU total < 30% (idle)
- RAM totale < 4 GB
- Tous les services répondent < 1s

✅ **Monitoring**
- Prometheus collecte métriques
- Grafana affiche dashboards
- Alertes configurées (inactives)

---

## 🎯 PROCHAINES ÉTAPES

### **Après Tests Réussis**

1. ✅ Documenter problèmes rencontrés
2. ✅ Optimiser configuration si nécessaire
3. ✅ Créer dashboards personnalisés
4. ✅ Tester workers BullMQ (prochaine session)
5. ✅ Préparer migration IONOS (28/10)

### **Si Tests Échouent**

1. ❌ Identifier cause racine
2. ❌ Corriger configuration
3. ❌ Re-tester
4. ❌ Documenter solution

---

## 📚 RESSOURCES

### **Documentation**
- Docker Compose: https://docs.docker.com/compose/
- Prometheus: https://prometheus.io/docs/
- Grafana: https://grafana.com/docs/
- N8N: https://docs.n8n.io/

### **Dashboards Grafana**
- Node Exporter: https://grafana.com/grafana/dashboards/1860
- cAdvisor: https://grafana.com/grafana/dashboards/193
- Redis: https://grafana.com/grafana/dashboards/11835

---

**Version** : 1.0  
**Date** : 03/10/2025  
**Auteur** : Cascade + Lionel  
**Projet** : JobNexAI - Infrastructure Testing

# 🚀 MIGRATION IONOS VPS L - 28 OCTOBRE 2025

## 📅 PLANNING DÉTAILLÉ

**Date migration** : 28 octobre 2025  
**Durée estimée** : 4-6 heures  
**Downtime** : ~30 minutes  
**Préparation** : 25 jours (du 03/10 au 28/10)

---

## 🎯 OBJECTIFS

### **Infrastructure Production**
- ✅ Nginx reverse proxy + HTTPS + compression
- ✅ BullMQ workers pour tâches lourdes
- ✅ Monitoring complet (Grafana + Prometheus + Loki)
- ✅ Alerting automatique (Slack + Email)
- ✅ Logs centralisés
- ✅ Backups automatiques
- ✅ Object storage externe (fichiers)

### **Performance Targets**
- CPU moyen < 60%
- RAM < 75%
- IO wait < 5%
- Erreurs 5xx < 1%
- Response time < 2s

---

## 📋 CHECKLIST PRÉPARATION (03/10 → 28/10)

### **Semaine 1 (03-09 Oct) : Infrastructure**
- [x] Analyser workflows N8N existants
- [x] Créer architecture Docker Compose
- [x] Configurer Nginx reverse proxy
- [x] Setup monitoring (Prometheus + Grafana)
- [ ] Tester configuration localement
- [ ] Créer dashboards Grafana
- [ ] Configurer alertes Prometheus

### **Semaine 2 (10-16 Oct) : Workers & Queue**
- [ ] Implémenter BullMQ workers
- [ ] Créer queue CV extraction
- [ ] Créer queue AI enrichment
- [ ] Créer queue scraping
- [ ] Tester workers localement
- [ ] Optimiser concurrency

### **Semaine 3 (17-23 Oct) : Storage & Backups**
- [ ] Setup object storage (Supabase Storage ou S3)
- [ ] Migrer fichiers existants
- [ ] Configurer backups automatiques
- [ ] Tester restauration backups
- [ ] Documenter procédures

### **Semaine 4 (24-28 Oct) : Tests & Migration**
- [ ] Commander VPS IONOS Linux L
- [ ] Tests charge sur environnement staging
- [ ] Validation tous les workflows
- [ ] Dry-run migration
- [ ] **28 Oct : MIGRATION PRODUCTION**

---

## 🏗️ ARCHITECTURE FINALE

```
┌─────────────────────────────────────────────────────────┐
│                    INTERNET                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              NGINX REVERSE PROXY                         │
│  • HTTPS (Let's Encrypt)                                │
│  • Compression Gzip                                      │
│  • Rate Limiting                                         │
│  • Cache statique                                        │
└────────────┬────────────────┬──────────────┬────────────┘
             │                │              │
             ▼                ▼              ▼
    ┌────────────┐   ┌────────────┐  ┌────────────┐
    │    N8N     │   │  FastAPI   │  │  Grafana   │
    │ Workflows  │   │  Backend   │  │ Monitoring │
    └─────┬──────┘   └─────┬──────┘  └────────────┘
          │                │
          ▼                ▼
    ┌─────────────────────────────┐
    │         REDIS               │
    │  • Cache                    │
    │  • BullMQ Queue             │
    │  • Session storage          │
    └──────────┬──────────────────┘
               │
               ▼
    ┌─────────────────────────────┐
    │      BullMQ WORKERS         │
    │  • CV Extraction (5 workers)│
    │  • AI Enrichment (3 workers)│
    │  • Scraping (2 workers)     │
    └──────────┬──────────────────┘
               │
               ▼
    ┌─────────────────────────────┐
    │      POSTGRESQL             │
    │  • N8N Database             │
    │  • Workflow history         │
    └─────────────────────────────┘
               │
               ▼
    ┌─────────────────────────────┐
    │    MONITORING STACK         │
    │  • Prometheus               │
    │  • Grafana                  │
    │  • Loki (logs)              │
    │  • AlertManager             │
    │  • cAdvisor                 │
    │  • Node Exporter            │
    └─────────────────────────────┘
```

---

## 🔧 CONFIGURATION VPS L IONOS

### **Specs**
- **CPU** : 6 vCores
- **RAM** : 8 GB
- **Storage** : 240 GB NVMe SSD
- **OS** : Ubuntu 24.04 LTS
- **Network** : 1 Gbps
- **Prix** : 6€/mois

### **Allocation Ressources**

```yaml
Services:
  nginx:        CPU: 1 core,  RAM: 512 MB
  n8n:          CPU: 3 cores, RAM: 4 GB
  fastapi:      CPU: 1 core,  RAM: 1 GB
  redis:        CPU: 0.5 core, RAM: 1 GB
  postgres:     CPU: 1 core,  RAM: 1 GB
  workers:      CPU: 1 core,  RAM: 1 GB (total)
  monitoring:   CPU: 1 core,  RAM: 1 GB (total)
  
Total:          6 cores,     8 GB RAM
Marge:          ~10% CPU,    ~5% RAM
```

---

## 📊 MONITORING & ALERTING

### **Métriques Surveillées**

#### **VPS Resources**
- CPU usage (avg, max, per core)
- Memory usage (used, available, swap)
- Disk usage (/, /var, /tmp)
- IO wait
- Network traffic (in/out)

#### **Docker Containers**
- Container status (up/down)
- Container restarts
- CPU per container
- Memory per container
- Network per container

#### **N8N Workflows**
- Workflow executions (success/failed)
- Execution duration
- Queue size
- Active workflows
- Webhook response time

#### **Redis**
- Memory usage
- Connected clients
- Commands per second
- Evicted keys
- Hit rate

#### **PostgreSQL**
- Connections (active/idle)
- Query duration
- Database size
- Slow queries
- Replication lag (si applicable)

#### **HTTP/HTTPS**
- Request rate
- Response time (p50, p95, p99)
- Status codes (2xx, 4xx, 5xx)
- SSL certificate expiry

### **Alertes Configurées**

#### **Critical (Slack + Email)**
- 🚨 CPU > 80% pendant 2 min
- 🚨 RAM > 90% pendant 2 min
- 🚨 Disk > 90%
- 🚨 Service down > 1 min
- 🚨 SSL certificate < 7 jours
- 🚨 Erreurs 5xx > 10/min

#### **High (Slack)**
- ⚠️ CPU > 60% pendant 5 min
- ⚠️ RAM > 75% pendant 5 min
- ⚠️ IO wait > 5% pendant 5 min
- ⚠️ Workflow failures > 10%
- ⚠️ Response time > 2s

#### **Warning (Slack, throttled)**
- ⚡ Disk > 80%
- ⚡ Redis evicting keys
- ⚡ PostgreSQL slow queries
- ⚡ Container restarting

---

## 🔐 SÉCURITÉ

### **Firewall (UFW)**
```bash
# SSH
ufw allow 22/tcp

# HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Monitoring (IP whitelist)
ufw allow from YOUR_IP to any port 3000  # Grafana
ufw allow from YOUR_IP to any port 9090  # Prometheus

# Deny all other
ufw default deny incoming
ufw default allow outgoing
ufw enable
```

### **Fail2Ban**
```ini
[sshd]
enabled = true
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
maxretry = 5
bantime = 3600

[nginx-limit-req]
enabled = true
maxretry = 10
bantime = 600
```

### **SSL/TLS**
```bash
# Let's Encrypt avec Certbot
certbot certonly --webroot \
  -w /var/www/certbot \
  -d n8n.jobnexai.com \
  -d api.jobnexai.com \
  -d monitoring.jobnexai.com \
  --email lionel@jobnexai.com \
  --agree-tos \
  --non-interactive

# Auto-renewal
echo "0 3 * * * certbot renew --quiet" | crontab -
```

### **Secrets Management**
```bash
# Utiliser .env pour secrets
# JAMAIS commiter .env dans Git

# .env.example (template)
N8N_PASSWORD=CHANGE_ME
DB_PASSWORD=CHANGE_ME
GRAFANA_PASSWORD=CHANGE_ME
MAMMOUTH_API_KEY=CHANGE_ME
SUPABASE_KEY=CHANGE_ME
```

---

## 💾 BACKUPS

### **Stratégie 3-2-1**
- **3** copies des données
- **2** supports différents
- **1** copie off-site

### **Backups Automatiques**

#### **1. Code (Git)**
```bash
# Déjà géré par GitHub
# Vérifier que tout est commité
git status
git push origin main
```

#### **2. N8N Workflows**
```bash
# Export automatique quotidien
0 2 * * * docker exec n8n n8n export:workflow --all --output=/backup/workflows-$(date +\%Y\%m\%d).json
```

#### **3. PostgreSQL**
```bash
# Backup quotidien
0 3 * * * docker exec postgres pg_dump -U n8n n8n | gzip > /backup/postgres-$(date +\%Y\%m\%d).sql.gz

# Rétention 30 jours
find /backup -name "postgres-*.sql.gz" -mtime +30 -delete
```

#### **4. Redis (optionnel)**
```bash
# Snapshot quotidien
0 4 * * * docker exec redis redis-cli BGSAVE
```

#### **5. Logs**
```bash
# Rotation automatique (logrotate)
/var/log/nginx/*.log {
  daily
  rotate 30
  compress
  delaycompress
  notifempty
  create 0640 www-data adm
  sharedscripts
  postrotate
    docker exec nginx nginx -s reload
  endscript
}
```

#### **6. Supabase**
```bash
# Backups gérés par Supabase
# Vérifier configuration :
# - Point-in-time recovery activé
# - Rétention 7 jours minimum
# - Backups quotidiens
```

### **Backup Off-Site**
```bash
# Sync vers S3/Backblaze/Wasabi
aws s3 sync /backup s3://jobnexai-backups/ionos-vps/ \
  --exclude "*.tmp" \
  --storage-class STANDARD_IA

# Ou vers Supabase Storage
supabase storage cp /backup/* supabase://backups/ionos-vps/
```

---

## 🚀 PROCÉDURE MIGRATION 28/10

### **J-7 (21 Oct) : Préparation**
1. Commander VPS IONOS Linux L
2. Recevoir IP + credentials
3. Tester connexion SSH
4. Cloner repo sur VPS
5. Setup environnement de staging

### **J-3 (25 Oct) : Dry Run**
1. Migration complète sur staging
2. Tests tous les workflows
3. Validation monitoring
4. Mesure performance
5. Documenter problèmes

### **J-1 (27 Oct) : Final Check**
1. Backup complet Contabo
2. Export tous les workflows N8N
3. Vérifier credentials
4. Préparer rollback plan
5. Informer équipe

### **J-Day (28 Oct) : Migration**

#### **Phase 1 : Setup VPS (1h)**
```bash
# 08h00 - 09h00
ssh root@IONOS_IP
./scripts/setup-ionos-vps.sh
```

#### **Phase 2 : Migration Données (1h)**
```bash
# 09h00 - 10h00
./scripts/migrate-to-ionos.sh
```

#### **Phase 3 : Configuration (1h)**
```bash
# 10h00 - 11h00
# Configurer Nginx
# Setup SSL
# Configurer monitoring
# Importer workflows
```

#### **Phase 4 : Tests (1h)**
```bash
# 11h00 - 12h00
# Tester tous les endpoints
# Vérifier workflows
# Valider monitoring
# Tests charge
```

#### **Phase 5 : DNS Switch (30 min)**
```bash
# 12h00 - 12h30
# Mettre à jour DNS
# n8n.jobnexai.com → NOUVELLE_IP
# api.jobnexai.com → NOUVELLE_IP
# monitoring.jobnexai.com → NOUVELLE_IP

# Attendre propagation DNS (5-15 min)
```

#### **Phase 6 : Validation (30 min)**
```bash
# 12h30 - 13h00
# Vérifier tous les services
# Monitorer métriques
# Tester depuis différents pays
# Valider SSL
```

#### **Phase 7 : Monitoring (24h)**
```bash
# 13h00 - 13h00+1j
# Surveiller dashboards
# Vérifier alertes
# Analyser logs
# Optimiser si nécessaire
```

### **Rollback Plan**
Si problème critique :
1. Redémarrer services Contabo
2. Revert DNS vers ancienne IP
3. Attendre propagation (15 min)
4. Analyser logs IONOS
5. Corriger et re-tenter

---

## 📈 POST-MIGRATION

### **Semaine 1 : Stabilisation**
- Monitoring 24/7
- Optimisation performance
- Correction bugs
- Documentation retours

### **Semaine 2 : Optimisation**
- Tuning PostgreSQL
- Optimisation Redis
- Ajustement workers
- Fine-tuning alertes

### **Semaine 3 : Features**
- Activer nouveaux workflows
- Scaling horizontal si besoin
- Amélioration monitoring

---

## 📚 DOCUMENTATION

### **Runbooks**
- [ ] Redémarrage service N8N
- [ ] Restauration backup PostgreSQL
- [ ] Rotation logs manuels
- [ ] Ajout nouveau worker
- [ ] Scaling Redis
- [ ] Investigation CPU spike
- [ ] Investigation memory leak
- [ ] SSL renewal manuel

### **Dashboards Grafana**
- [ ] VPS Overview
- [ ] Docker Containers
- [ ] N8N Workflows
- [ ] Redis Performance
- [ ] PostgreSQL Performance
- [ ] HTTP/HTTPS Metrics
- [ ] Logs Explorer

---

## ✅ CHECKLIST FINALE

### **Avant Migration**
- [ ] VPS IONOS commandé et accessible
- [ ] Backup complet Contabo
- [ ] Tous les workflows exportés
- [ ] Credentials sauvegardés
- [ ] DNS prêt à être modifié
- [ ] Équipe informée
- [ ] Rollback plan validé

### **Pendant Migration**
- [ ] Setup VPS complété
- [ ] Migration données OK
- [ ] Nginx configuré
- [ ] SSL actif
- [ ] Monitoring opérationnel
- [ ] Workflows importés
- [ ] Tests passés

### **Après Migration**
- [ ] DNS propagé
- [ ] Tous les services UP
- [ ] Monitoring actif
- [ ] Alertes configurées
- [ ] Backups automatiques
- [ ] Documentation à jour
- [ ] Contabo désactivé (après 48h)

---

**Version** : 1.0  
**Date** : 03/10/2025  
**Migration prévue** : 28/10/2025  
**Auteur** : Cascade + Lionel  
**Projet** : JobNexAI - Production Infrastructure

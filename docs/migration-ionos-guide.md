# 🚀 GUIDE MIGRATION N8N - CONTABO → IONOS

## 📋 Vue d'ensemble

**Durée estimée** : 30-45 minutes  
**Difficulté** : Facile (script automatisé)  
**Downtime** : ~10 minutes

---

## ⏱️ TIMELINE DÉTAILLÉE

### **Phase 1 : Backup Contabo (5 min)**
- Arrêt N8N
- Création archive tar.gz
- Vérification intégrité

### **Phase 2 : Téléchargement (5 min)**
- Download backup local
- Vérification checksum

### **Phase 3 : Setup IONOS (10 min)**
- Installation Docker
- Configuration réseau
- Création répertoires

### **Phase 4 : Upload IONOS (5 min)**
- Upload backup
- Extraction fichiers

### **Phase 5 : Configuration N8N (10 min)**
- docker-compose.yml
- Variables d'environnement
- Démarrage service

### **Phase 6 : Tests (5 min)**
- Vérification N8N accessible
- Test connexion Supabase
- Validation workflows

---

## 🔧 PRÉREQUIS

### **1. Accès VPS**
```bash
# Tester connexion Contabo
ssh root@38.242.238.205

# Tester connexion IONOS
ssh root@VOTRE_IP_IONOS
```

### **2. Informations nécessaires**
- ✅ IP IONOS
- ✅ Credentials SSH IONOS
- ✅ Backup Supabase (optionnel)

### **3. Outils locaux**
```bash
# Vérifier installations
which ssh
which scp
which docker
```

---

## 🚀 MÉTHODE 1 : SCRIPT AUTOMATIQUE (RECOMMANDÉ)

### **Étape 1 : Configuration**

```bash
# Éditer le script
nano scripts/migrate-to-ionos.sh

# Remplacer VOTRE_IP_IONOS par votre IP
NEW_VPS="123.456.789.012"  # Votre IP IONOS
```

### **Étape 2 : Exécution**

```bash
# Lancer migration
./scripts/migrate-to-ionos.sh
```

### **Étape 3 : Suivi**

Le script affiche la progression :
```
[1/6] Backup VPS Contabo...
✅ Backup Contabo complété

[2/6] Téléchargement backup...
✅ Backup téléchargé

[3/6] Setup VPS IONOS...
✅ IONOS configuré

[4/6] Upload backup vers IONOS...
✅ Backup uploadé

[5/6] Configuration N8N...
✅ N8N démarré

[6/6] Tests de validation...
✅ Migration complétée !
```

---

## 🛠️ MÉTHODE 2 : MIGRATION MANUELLE

### **Étape 1 : Backup Contabo**

```bash
# Connexion Contabo
ssh root@38.242.238.205

# Arrêt N8N
cd /opt/jobnexai-scraping
docker-compose down

# Création backup
tar -czf /tmp/n8n-backup.tar.gz \
  /opt/jobnexai-scraping \
  /root/.n8n \
  --exclude='node_modules' \
  --exclude='*.log'

# Vérification
ls -lh /tmp/n8n-backup.tar.gz
```

### **Étape 2 : Téléchargement**

```bash
# Sur votre Mac
scp root@38.242.238.205:/tmp/n8n-backup.tar.gz ~/Downloads/
```

### **Étape 3 : Setup IONOS**

```bash
# Connexion IONOS
ssh root@VOTRE_IP_IONOS

# Installation Docker
apt-get update
apt-get install -y docker.io docker-compose git

# Vérification
docker --version
docker-compose --version
```

### **Étape 4 : Upload IONOS**

```bash
# Sur votre Mac
scp ~/Downloads/n8n-backup.tar.gz root@VOTRE_IP_IONOS:/tmp/

# Sur IONOS
ssh root@VOTRE_IP_IONOS
cd /
tar -xzf /tmp/n8n-backup.tar.gz
```

### **Étape 5 : Configuration N8N**

```bash
# Sur IONOS
cd /opt/jobnexai-scraping

# Éditer docker-compose.yml
nano docker-compose.yml

# Remplacer l'ancienne IP par la nouvelle
# OLD: WEBHOOK_URL=http://38.242.238.205:5678/
# NEW: WEBHOOK_URL=http://VOTRE_IP_IONOS:5678/

# Démarrer N8N
docker-compose up -d

# Vérifier logs
docker-compose logs -f n8n
```

### **Étape 6 : Tests**

```bash
# Test connexion
curl http://VOTRE_IP_IONOS:5678

# Devrait retourner la page N8N
```

---

## ✅ CHECKLIST POST-MIGRATION

### **1. Vérifier N8N**
- [ ] N8N accessible : http://VOTRE_IP_IONOS:5678
- [ ] Login fonctionne (lionel / JobNexAI_Admin_2025!)
- [ ] Workflows visibles
- [ ] Credentials configurés

### **2. Tester Workflows**
- [ ] Ouvrir workflow "JobNexAI - Error Handler Global"
- [ ] Cliquer "Execute Workflow"
- [ ] Vérifier exécution réussie
- [ ] Tester workflow Indeed

### **3. Vérifier Connexions**
- [ ] Supabase accessible
- [ ] Mammouth.ai accessible
- [ ] Credentials valides

### **4. Mettre à jour FastAPI**

```python
# deployment/api/main.py

# OLD
n8n_response = await client.post(
    f"http://38.242.238.205:5678/webhook/{scraper['webhook']}",
    ...
)

# NEW
n8n_response = await client.post(
    f"http://VOTRE_IP_IONOS:5678/webhook/{scraper['webhook']}",
    ...
)
```

### **5. Redéployer FastAPI**

```bash
# Commit changement
git add deployment/api/main.py
git commit -m "fix(api): Update N8N webhook URL to IONOS"
git push

# Redéployer sur Netlify (automatique)
```

### **6. Activer Workflows**

```
1. Ouvrir N8N
2. Pour chaque workflow:
   - Ouvrir workflow
   - Cliquer "Active" (toggle en haut à droite)
   - Vérifier Cron configuré
3. Workflows à activer:
   - JobNexAI - Error Handler Global
   - JobNexAI - Job Enrichment avec Mammouth.ai
   - JobNexAI - LinkedIn Scraper
   - JobNexAI - Malt Scraper
```

---

## 🔍 VÉRIFICATION DONNÉES

### **Exécuter script de test**

```sql
-- Dans Supabase SQL Editor
-- Copier/coller: scripts/test-n8n-workflows.sql

-- Vérifier résultats:
-- ✅ = OK
-- ⚠️ = Attention
-- ❌ = Problème
```

### **Métriques attendues**

```
✅ Jobs scrapés dernières 24h: > 50
✅ Taux enrichissement: > 80%
✅ Qualité données: > 95%
✅ Doublons: < 5%
✅ Erreurs: < 5
```

---

## 🚨 TROUBLESHOOTING

### **Problème 1 : N8N non accessible**

```bash
# Vérifier Docker
docker ps

# Vérifier logs
docker-compose logs n8n

# Redémarrer
docker-compose restart n8n
```

### **Problème 2 : Workflows manquants**

```bash
# Vérifier répertoire workflows
ls -la /root/.n8n/workflows/

# Réimporter manuellement
# Dans N8N: Import from File
```

### **Problème 3 : Credentials perdus**

```bash
# Reconfigurer dans N8N:
# 1. Settings → Credentials
# 2. Add Credential → Supabase
# 3. Add Credential → HTTP Header Auth (Mammouth.ai)
```

### **Problème 4 : Erreurs Supabase**

```bash
# Tester connexion
curl https://klwugophjvzctlautsqz.supabase.co

# Vérifier Service Role Key
# Dans N8N credentials
```

---

## 🔄 ROLLBACK (SI NÉCESSAIRE)

### **Option 1 : Redémarrer Contabo**

```bash
# Sur Contabo
ssh root@38.242.238.205
cd /opt/jobnexai-scraping
docker-compose up -d
```

### **Option 2 : Restaurer backup**

```bash
# Sur IONOS
cd /
tar -xzf /tmp/n8n-backup.tar.gz --overwrite
cd /opt/jobnexai-scraping
docker-compose restart
```

---

## 📊 COMPARAISON CONTABO vs IONOS

### **Contabo**
- ✅ Déjà configuré
- ✅ Workflows testés
- ❌ Ancien fournisseur
- ❌ Moins performant

### **IONOS**
- ✅ Nouveau fournisseur
- ✅ Plus performant
- ✅ Meilleur support
- ⚠️ Configuration nécessaire

---

## 💡 CONSEILS

### **Avant migration**
1. ✅ Tester connexion IONOS
2. ✅ Vérifier espace disque (>10GB)
3. ✅ Backup Supabase (optionnel)
4. ✅ Prévenir équipe (downtime 10 min)

### **Pendant migration**
1. ✅ Suivre logs script
2. ✅ Noter erreurs éventuelles
3. ✅ Garder terminal Contabo ouvert

### **Après migration**
1. ✅ Tester tous les workflows
2. ✅ Monitorer 24-48h
3. ✅ Garder Contabo actif 48h (rollback)
4. ✅ Mettre à jour documentation

---

## 📞 SUPPORT

### **En cas de problème**

1. **Vérifier logs** : `docker-compose logs -f n8n`
2. **Consulter** : `/docs/n8n-troubleshooting.md`
3. **Tester** : `scripts/test-n8n-workflows.sql`
4. **Rollback** : Redémarrer Contabo

---

## ✅ VALIDATION FINALE

### **Checklist complète**

- [ ] N8N accessible sur IONOS
- [ ] Tous les workflows importés
- [ ] Credentials configurés
- [ ] Tests manuels réussis
- [ ] FastAPI mis à jour
- [ ] Workflows activés
- [ ] Données Supabase OK
- [ ] Monitoring actif
- [ ] Documentation à jour
- [ ] Équipe informée

---

**Version** : 1.0  
**Date** : 03/10/2025  
**Auteur** : Cascade + Lionel  
**Projet** : JobNexAI - Migration IONOS

# 🔗 INTÉGRATION N8N ↔ NETLIFY

## 📋 Architecture

```
jobnexai-windsurf.netlify.app (Frontend)
    ↓
Bouton "Scraping Temps Réel"
    ↓
FastAPI (deployment/api/main.py)
    ↓
N8N Webhook (38.242.238.205:5678/webhook/scrape-indeed)
    ↓
Workflow N8N (Scraping + Enrichissement)
    ↓
Callback FastAPI (/webhook/job-complete)
    ↓
Supabase (jobs table)
    ↓
Frontend (affichage résultats)
```

---

## 🎯 DEUX TYPES DE WORKFLOWS

### **TYPE 1 : CRON (Automatique)**
- ✅ Déjà créés : Indeed, LinkedIn, Malt
- ✅ S'exécutent automatiquement toutes les X heures
- ✅ Pas besoin d'interaction utilisateur

### **TYPE 2 : WEBHOOK (À la demande)**
- 🔄 À créer pour Netlify
- 🔄 Déclenchés par bouton "Temps Réel"
- 🔄 Retournent les résultats immédiatement

---

## 🔧 CRÉER UN WORKFLOW WEBHOOK

### **Étape 1 : Dupliquer un workflow existant**

1. Ouvrir `job-enrichment-mammouth-complete.json`
2. Remplacer le node "Cron Trigger" par "Webhook Trigger"
3. Configurer le webhook

### **Étape 2 : Configuration Webhook**

```json
{
  "parameters": {
    "httpMethod": "POST",
    "path": "scrape-indeed",
    "responseMode": "lastNode",
    "options": {}
  },
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1.1,
  "position": [250, 300]
}
```

### **Étape 3 : Récupérer les paramètres**

```javascript
// Dans le premier Function Node:
const webhookData = $input.item.json;

const query = webhookData.query || 'react';
const location = webhookData.location || 'paris';
const jobId = webhookData.job_id;
const callbackUrl = webhookData.callback_url;

// Construire l'URL de scraping
const scrapingUrl = `https://fr.indeed.com/jobs?q=${query}&l=${location}`;
```

### **Étape 4 : Callback à FastAPI**

```javascript
// Ajouter un node HTTP Request à la fin:
{
  "url": "={{ $json.callback_url }}",
  "method": "POST",
  "body": {
    "job_id": "={{ $json.job_id }}",
    "status": "completed",
    "jobs_count": "={{ $json.jobs.length }}",
    "timestamp": "={{ new Date().toISOString() }}"
  }
}
```

---

## 🧪 TESTER AVEC NETLIFY

### **Méthode 1 : Via l'interface Netlify**

1. **Aller sur** : https://jobnexai-windsurf.netlify.app/app/jobs
2. **Cliquer sur** : Bouton "Scraping Temps Réel"
3. **Remplir** : Recherche (ex: "React Developer")
4. **Attendre** : 30-60 secondes
5. **Vérifier** : Résultats s'affichent dans l'interface

### **Méthode 2 : Via curl (test direct)**

```bash
# Test webhook N8N direct
curl -X POST http://38.242.238.205:5678/webhook/scrape-indeed \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "test_123",
    "query": "react",
    "location": "paris",
    "callback_url": "http://localhost:8000/webhook/job-complete"
  }'

# Test via FastAPI
curl -X POST https://jobnexai-windsurf.netlify.app/api/scraping/start \
  -H "Content-Type: application/json" \
  -d '{
    "scraper_id": "indeed",
    "query": "react developer",
    "location": "paris",
    "user_email": "test@example.com"
  }'
```

---

## 📊 VÉRIFIER LES RÉSULTATS

### **Dans Supabase :**

```sql
-- Voir les jobs scrapés via webhook
SELECT 
  title,
  company,
  scraping_source,
  created_at
FROM jobs
WHERE scraping_source = 'indeed'
  AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
```

### **Dans N8N :**

```
1. Aller dans "Executions"
2. Filtrer par workflow "Indeed Webhook"
3. Voir les détails de l'exécution
4. Vérifier les données en entrée/sortie
```

### **Dans Netlify (Frontend) :**

```javascript
// Le frontend devrait afficher:
- Badge "Temps Réel" sur les jobs
- Nombre de jobs trouvés
- Temps d'exécution
```

---

## ⚙️ CONFIGURATION FASTAPI

### **Vérifier l'URL N8N :**

```python
# Dans deployment/api/main.py
n8n_response = await client.post(
    f"http://38.242.238.205:5678/webhook/{scraper['webhook']}",
    # ⚠️ Changer si N8N est sur un autre port/domaine
    json={...}
)
```

### **Webhooks disponibles :**

```python
SCRAPERS = {
    "indeed": {"webhook": "scrape-indeed"},
    "linkedin": {"webhook": "scrape-linkedin"},
    "malt": {"webhook": "scrape-malt"},
    "freework": {"webhook": "scrape-freework"},
    "wttj": {"webhook": "scrape-wttj"}
}
```

---

## 🔒 SÉCURITÉ

### **Protéger les webhooks N8N :**

```javascript
// Dans le node Webhook, ajouter une authentification:
{
  "authentication": "headerAuth",
  "headerAuth": {
    "name": "X-API-Key",
    "value": "YOUR_SECRET_KEY"
  }
}
```

### **Vérifier dans FastAPI :**

```python
headers = {
    "X-API-Key": "YOUR_SECRET_KEY"
}
n8n_response = await client.post(url, json=data, headers=headers)
```

---

## 🚀 DÉPLOIEMENT

### **1. Workflows Cron (Automatiques)**
- ✅ Déjà déployés sur VPS
- ✅ S'exécutent en arrière-plan
- ✅ Pas besoin de Netlify

### **2. Workflows Webhook (À la demande)**
- 🔄 À créer et déployer
- 🔄 Nécessitent configuration FastAPI
- 🔄 Intégration avec frontend Netlify

---

## 📝 TODO POUR INTÉGRATION COMPLÈTE

1. **Créer workflows webhook** (versions des workflows Cron)
2. **Configurer les webhooks** dans N8N
3. **Tester les callbacks** FastAPI
4. **Vérifier l'affichage** frontend
5. **Ajouter authentification** sur les webhooks

---

**Version**: 1.0  
**Date**: 01/10/2025  
**Auteur**: Lionel + Cascade  
**Projet**: JobNexAI - N8N ↔ Netlify Integration

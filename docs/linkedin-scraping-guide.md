# 🔍 LINKEDIN SCRAPING - GUIDE COMPLET

## 📋 Vue d'ensemble

**3 méthodes de scraping LinkedIn**, du plus légal au plus technique :

1. **Google Custom Search API** ⭐⭐⭐⭐⭐ (Recommandé)
2. **ScrapingBee Visual** ⭐⭐⭐⭐
3. **Scraping Direct** ⭐⭐ (Risqué)

---

## 🏆 MÉTHODE 1 : GOOGLE CUSTOM SEARCH API (LÉGAL)

### **Avantages**
- ✅ **100% légal** : API officielle Google
- ✅ **Pas de ban** : Aucun risque compte LinkedIn
- ✅ **Stable** : Pas de sélecteurs CSS à maintenir
- ✅ **Gratuit** : 100 requêtes/jour
- ✅ **Scalable** : $5 pour 1000 requêtes

### **Inconvénients**
- ⚠️ **Limité** : 100 résultats max par recherche
- ⚠️ **Snippets courts** : Description limitée
- ⚠️ **Pas de détails** : Salaire, type contrat non disponibles

### **Configuration**

#### **Étape 1 : Créer projet Google Cloud**

1. Aller sur https://console.cloud.google.com
2. Créer nouveau projet "JobNexAI-Scraping"
3. Activer "Custom Search API"
4. Créer credentials → API Key
5. Copier l'API Key

#### **Étape 2 : Créer Search Engine**

1. Aller sur https://programmablesearchengine.google.com
2. Cliquer "Add" → "Create new search engine"
3. Configuration :
   - **Sites to search** : `linkedin.com/jobs/*`
   - **Name** : JobNexAI LinkedIn Search
   - **Language** : French
4. Copier le **Search Engine ID (cx)**

#### **Étape 3 : Configurer N8N**

```json
{
  "google_api_key": "AIzaSy...",
  "google_cx": "a1b2c3d4e5f6g7h8i9",
  "search_query": "react developer paris site:linkedin.com/jobs"
}
```

### **Coûts**

```
Plan Gratuit:
- 100 requêtes/jour
- 10 résultats/requête
- = 1000 jobs/jour max

Plan Payant:
- $5 pour 1000 requêtes
- 10 résultats/requête
- = 10,000 jobs pour $5
```

### **Workflow**

**Fichier** : `linkedin-google-search.json`

```
Cron (4h) → Set Params → Google Search → Extract → Mammouth.ai → Supabase
```

---

## 🎨 MÉTHODE 2 : SCRAPINGBEE VISUAL (ANTI-BOT)

### **Avantages**
- ✅ **Contourne anti-bot** : Proxies résidentiels
- ✅ **Render JS** : Sites dynamiques
- ✅ **Pas de maintenance** : Service géré
- ✅ **Légal** : Scraping éthique

### **Inconvénients**
- ⚠️ **Payant** : 1000 crédits gratuits puis $49/mois
- ⚠️ **Coût par requête** : 5 crédits/requête LinkedIn
- ⚠️ **Rate limiting** : Limites ScrapingBee

### **Configuration**

#### **Étape 1 : Créer compte ScrapingBee**

1. Aller sur https://www.scrapingbee.com
2. S'inscrire (1000 crédits gratuits)
3. Copier API Key

#### **Étape 2 : Configurer N8N**

```json
{
  "api_key": "YOUR_SCRAPINGBEE_KEY",
  "url": "https://www.linkedin.com/jobs/search/?keywords=react&location=Paris",
  "render_js": true,
  "premium_proxy": true,
  "country_code": "fr"
}
```

### **Coûts**

```
Plan Free:
- 1000 crédits
- 5 crédits/requête LinkedIn
- = 200 scrapes gratuits

Plan Freelance ($49/mois):
- 150,000 crédits
- = 30,000 scrapes LinkedIn/mois
```

### **Workflow**

**Fichier** : `linkedin-visual-scraper.json`

```
Cron (6h) → Set Params → ScrapingBee → Parse HTML → Mammouth.ai → Supabase
```

---

## ⚠️ MÉTHODE 3 : SCRAPING DIRECT (RISQUÉ)

### **Avantages**
- ✅ **Gratuit** : Pas de coût API
- ✅ **Contrôle total** : Personnalisation complète

### **Inconvénients**
- ❌ **Risque ban** : Compte LinkedIn bloqué
- ❌ **Captcha** : Détection bot fréquente
- ❌ **Maintenance** : Sélecteurs CSS changent
- ❌ **Cookies** : Rotation nécessaire

### **⚠️ NON RECOMMANDÉ POUR PRODUCTION**

Si tu veux quand même :

```javascript
// Précautions minimales
const config = {
  headers: {
    'User-Agent': 'Mozilla/5.0...',
    'Cookie': 'YOUR_LINKEDIN_COOKIES'
  },
  delays: {
    min: 2000,
    max: 5000
  },
  maxJobsPerRun: 20,
  proxyRotation: true
};
```

---

## 📊 COMPARAISON DES MÉTHODES

| Critère | Google Search | ScrapingBee | Direct |
|---------|---------------|-------------|--------|
| **Légalité** | ✅ Légal | ✅ Légal | ⚠️ Gris |
| **Risque ban** | ✅ Aucun | ✅ Aucun | ❌ Élevé |
| **Coût** | 💰 Gratuit/Cheap | 💰💰 Moyen | 💰 Gratuit |
| **Maintenance** | ✅ Aucune | ✅ Faible | ❌ Élevée |
| **Qualité données** | ⚠️ Limitée | ✅ Complète | ✅ Complète |
| **Scalabilité** | ✅ Excellente | ✅ Bonne | ❌ Limitée |
| **Recommandation** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

---

## 🎯 RECOMMANDATION FINALE

### **Pour JobNexAI : STRATÉGIE HYBRIDE**

#### **Phase 1 : Google Custom Search (Immédiat)**
- Setup rapide (30 min)
- 100% légal
- Gratuit pour commencer
- Valide le concept

#### **Phase 2 : ScrapingBee (Scaling)**
- Quand >100 requêtes/jour nécessaires
- Données plus complètes
- Toujours légal

#### **Phase 3 : Jamais Direct Scraping**
- Trop risqué pour production
- Maintenance cauchemar
- Risque légal

---

## 🚀 GUIDE SETUP GOOGLE CUSTOM SEARCH

### **1. Créer API Key (5 min)**

```bash
# Via gcloud CLI
gcloud auth login
gcloud projects create jobnexai-scraping
gcloud services enable customsearch.googleapis.com
gcloud alpha services api-keys create --display-name="JobNexAI"
```

Ou via console : https://console.cloud.google.com/apis/credentials

### **2. Créer Search Engine (5 min)**

1. https://programmablesearchengine.google.com/controlpanel/create
2. **Sites to search** : `linkedin.com/jobs/*`
3. **Search the entire web** : OFF
4. **Language** : French
5. Copier **Search Engine ID**

### **3. Tester l'API (2 min)**

```bash
curl "https://www.googleapis.com/customsearch/v1?\
key=YOUR_API_KEY&\
cx=YOUR_CX_ID&\
q=react+developer+paris+site:linkedin.com/jobs"
```

### **4. Importer workflow N8N (5 min)**

1. Ouvrir N8N
2. Import `linkedin-google-search.json`
3. Remplacer API Key + CX ID
4. Configurer Supabase credential
5. Tester manuellement

### **5. Activer Cron (1 min)**

```
Fréquence recommandée : Toutes les 4h
= 6 exécutions/jour
= 60 jobs/jour (10 résultats × 6)
= 1800 jobs/mois GRATUIT
```

---

## 📈 OPTIMISATIONS

### **Rotation des recherches**

```javascript
// Varier les recherches pour couvrir plus de jobs
const searches = [
  'react developer paris',
  'fullstack engineer france',
  'backend developer remote',
  'frontend developer lyon',
  'devops engineer paris'
];

const randomSearch = searches[Math.floor(Math.random() * searches.length)];
```

### **Pagination intelligente**

```javascript
// Récupérer 100 résultats (10 pages)
for (let start = 1; start <= 91; start += 10) {
  const results = await googleSearch({
    q: query,
    start: start
  });
  
  jobs.push(...results.items);
  
  // Delay entre requêtes
  await sleep(2000);
}
```

### **Déduplication**

```sql
-- Éviter doublons
INSERT INTO jobs (...)
ON CONFLICT (url) DO UPDATE SET
  updated_at = NOW(),
  quality_score = EXCLUDED.quality_score;
```

---

## 🔐 Sécurité

### **Protéger API Key**

```javascript
// Dans N8N, utiliser Credentials
// Ne JAMAIS hardcoder l'API Key dans le workflow
{
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "googleApi"
}
```

### **Rate Limiting**

```javascript
// Respecter quotas Google
const DAILY_LIMIT = 100;
const requestCount = await redis.get('google_search_count');

if (requestCount >= DAILY_LIMIT) {
  throw new Error('Daily quota exceeded');
}

await redis.incr('google_search_count');
await redis.expire('google_search_count', 86400); // 24h
```

---

## 📚 Ressources

### **Documentation**
- Google Custom Search : https://developers.google.com/custom-search
- ScrapingBee : https://www.scrapingbee.com/documentation
- LinkedIn Terms : https://www.linkedin.com/legal/user-agreement

### **Alternatives**
- **Bright Data** : $500/mois, scraping légal LinkedIn
- **Apify LinkedIn Scraper** : $49/mois, 1000 profiles
- **RapidAPI LinkedIn** : Divers providers

---

**Version** : 1.0  
**Date** : 03/10/2025  
**Auteur** : Cascade + Lionel  
**Projet** : JobNexAI - LinkedIn Scraping Strategy

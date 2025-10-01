# 🚀 GUIDE D'INSTALLATION - WORKFLOW JOB ENRICHMENT MAMMOUTH.AI

## 📋 Prérequis

### 1. N8N installé et fonctionnel
- ✅ N8N accessible sur http://38.242.238.205:5678
- ✅ Credentials : lionel / JobNexAI_Admin_2025!

### 2. Comptes API
- [ ] **Mammouth.ai** : Créer un compte sur https://mammouth.ai
- [ ] **Supabase** : Accès à la base JobNexAI

### 3. Dépendances Node.js
- [ ] **cheerio** : Pour parsing HTML (inclus dans N8N)

---

## 🔧 ÉTAPE 1 : Configuration des Credentials

### A) Mammouth.ai API Key

1. **Créer le credential dans N8N :**
   - Aller dans **Settings → Credentials**
   - Cliquer **Add Credential**
   - Choisir **HTTP Header Auth**
   
2. **Configuration :**
   ```
   Name: Mammouth.ai API Key
   Header Name: Authorization
   Header Value: Bearer YOUR_MAMMOUTH_API_KEY
   ```

3. **Tester la connexion :**
   ```bash
   curl -H "Authorization: Bearer YOUR_KEY" \
        https://api.mammouth.ai/v1/models
   ```

### B) Supabase API

1. **Créer le credential dans N8N :**
   - Aller dans **Settings → Credentials**
   - Cliquer **Add Credential**
   - Choisir **Supabase**
   
2. **Configuration :**
   ```
   Name: Supabase JobNexAI
   Host: YOUR_SUPABASE_URL (ex: https://xxx.supabase.co)
   Service Role Secret: YOUR_SUPABASE_SERVICE_KEY
   ```

3. **Tester la connexion :**
   ```bash
   curl -H "apikey: YOUR_KEY" \
        -H "Authorization: Bearer YOUR_KEY" \
        https://YOUR_URL.supabase.co/rest/v1/jobs?limit=1
   ```

---

## 📥 ÉTAPE 2 : Import du Workflow

### Méthode 1 : Via l'interface N8N

1. **Ouvrir N8N** : http://38.242.238.205:5678
2. **Aller dans Workflows**
3. **Cliquer sur "Import from File"**
4. **Sélectionner** : `job-enrichment-mammouth-complete.json`
5. **Cliquer "Import"**

### Méthode 2 : Via ligne de commande

```bash
# Copier le fichier sur le VPS
scp job-enrichment-mammouth-complete.json root@38.242.238.205:/opt/jobnexai-scraping/n8n-workflows/

# Se connecter au VPS
ssh root@38.242.238.205

# Le workflow sera visible dans N8N au prochain refresh
```

---

## ⚙️ ÉTAPE 3 : Configuration du Workflow

### A) Vérifier les Credentials

1. **Ouvrir le workflow** dans N8N
2. **Node "Mammouth.ai - Job Enrichment"** :
   - Cliquer sur le node
   - Vérifier que le credential "Mammouth.ai API Key" est sélectionné
   - Si rouge, reconfigurer le credential

3. **Node "Supabase - Insert Jobs"** :
   - Cliquer sur le node
   - Vérifier que le credential "Supabase JobNexAI" est sélectionné
   - Si rouge, reconfigurer le credential

### B) Adapter l'URL de Scraping (optionnel)

**Node "HTTP Request - Scraping Indeed" :**
```javascript
// URL actuelle
https://fr.indeed.com/jobs?q=react&l=paris

// Personnaliser selon vos besoins
https://fr.indeed.com/jobs?q=VOTRE_RECHERCHE&l=VOTRE_VILLE
```

### C) Ajuster la Fréquence du Cron (optionnel)

**Node "Cron - Toutes les 2h" :**
```
Actuel : Toutes les 2 heures
Options :
- Toutes les heures : interval = 1
- Toutes les 4 heures : interval = 4
- Une fois par jour : Changer pour "Every day at 3:00 AM"
```

---

## 🧪 ÉTAPE 4 : Test Manuel

### A) Exécution Test

1. **Ouvrir le workflow** dans N8N
2. **Cliquer sur "Execute Workflow"** (bouton play en haut à droite)
3. **Attendre l'exécution** (peut prendre 30-60 secondes)
4. **Vérifier les résultats** :
   - Chaque node doit être vert ✅
   - Cliquer sur chaque node pour voir les données

### B) Vérification des Données

**Dans Supabase :**
```sql
-- Vérifier les jobs insérés
SELECT * FROM jobs 
WHERE source = 'Indeed' 
ORDER BY created_at DESC 
LIMIT 10;

-- Vérifier l'enrichissement
SELECT 
  title,
  company,
  skills,
  experience_level,
  quality_score,
  enriched
FROM jobs
WHERE enriched = true
ORDER BY created_at DESC;
```

### C) Logs de Debugging

**Dans N8N :**
- Aller dans **Executions** (menu gauche)
- Cliquer sur la dernière exécution
- Vérifier les logs de chaque node

**Logs attendus :**
```
✅ [Parser] Jobs extraits: 15
⚠️ [Validation] Champs manquants: salary_estimate
✅ [Validation] JSON validé avec succès
```

---

## 🚀 ÉTAPE 5 : Activation en Production

### A) Activer le Workflow

1. **Ouvrir le workflow** dans N8N
2. **Cliquer sur le toggle "Active"** en haut à droite
3. **Le workflow est maintenant actif** et s'exécutera automatiquement

### B) Monitoring

**Vérifier les exécutions :**
- Aller dans **Executions**
- Filtrer par workflow "JobNexAI - Job Enrichment"
- Vérifier qu'il s'exécute toutes les 2h

**Métriques à surveiller :**
```sql
-- Jobs scrapés par jour
SELECT 
  DATE(created_at) as date,
  COUNT(*) as jobs_count,
  AVG(quality_score) as avg_quality
FROM jobs
WHERE source = 'Indeed'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Taux d'enrichissement
SELECT 
  COUNT(*) FILTER (WHERE enriched = true) * 100.0 / COUNT(*) as enrichment_rate
FROM jobs
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## 🔧 ÉTAPE 6 : Troubleshooting

### Problème 1 : "Credential not found"

**Solution :**
1. Recréer les credentials dans N8N
2. Réassigner les credentials aux nodes
3. Sauvegarder le workflow

### Problème 2 : "JSON parsing error"

**Solution :**
1. Vérifier les logs du node "Function - JSON Validator"
2. La réponse Mammouth.ai est peut-être mal formatée
3. Le fallback devrait gérer automatiquement

### Problème 3 : "Supabase insert failed"

**Solutions possibles :**
1. Vérifier que la table `jobs` existe
2. Vérifier les permissions Supabase
3. Vérifier que les colonnes correspondent

**Créer la table si nécessaire :**
```sql
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  skills JSONB DEFAULT '[]',
  experience_level TEXT,
  salary_estimate TEXT,
  remote_type TEXT,
  contract_type TEXT,
  technologies JSONB DEFAULT '[]',
  description TEXT,
  benefits JSONB DEFAULT '[]',
  quality_score INTEGER,
  url TEXT UNIQUE,
  source TEXT,
  scraped_at TIMESTAMP,
  enriched BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_jobs_source ON jobs(source);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_quality_score ON jobs(quality_score DESC);
```

### Problème 4 : "Cheerio not found"

**Solution :**
Cheerio est normalement inclus dans N8N. Si erreur :
```bash
# Sur le VPS
docker exec -it jobnexai-n8n npm install cheerio
docker restart jobnexai-n8n
```

---

## 📊 ÉTAPE 7 : Optimisations (Optionnel)

### A) Ajouter d'autres sources

**Dupliquer le workflow pour :**
- LinkedIn : `https://www.linkedin.com/jobs/search?keywords=react&location=Paris`
- Malt : `https://www.malt.fr/s?q=react`
- WTTJ : `https://www.welcometothejungle.com/fr/jobs?query=react`

### B) Améliorer le parsing

**Adapter les sélecteurs CSS selon le site :**
```javascript
// Indeed
$('a.tapItem').each(...)

// LinkedIn
$('.jobs-search__results-list li').each(...)

// Malt
$('.freelancer-card').each(...)
```

### C) Ajouter des filtres

**Filtrer par qualité avant insertion :**
```javascript
// Dans le Function Node avant Supabase
if ($json.quality_score < 5) {
  console.log('⚠️ Job ignoré - qualité trop faible');
  return null; // Ne pas insérer
}
```

---

## 🎯 Checklist Finale

- [ ] Credentials Mammouth.ai configurés
- [ ] Credentials Supabase configurés
- [ ] Workflow importé dans N8N
- [ ] Test manuel réussi
- [ ] Données visibles dans Supabase
- [ ] Workflow activé en production
- [ ] Monitoring configuré
- [ ] Documentation lue et comprise

---

## 📚 Ressources

### Documentation
- [N8N Docs](https://docs.n8n.io)
- [Mammouth.ai API](https://mammouth.ai/docs)
- [Supabase Docs](https://supabase.com/docs)

### Fichiers du projet
- `/n8n-workflows/job-enrichment-mammouth-complete.json` - Workflow complet
- `/n8n-workflows/function-nodes/json-validator-cleaner.js` - Code validation
- `/n8n-workflows/prompts/job-enrichment-system-prompt.md` - System prompt
- `/docs/n8n-patterns/README.md` - Patterns et best practices

### Support
- **N8N Community** : https://community.n8n.io
- **Documentation projet** : `/docs/n8n-patterns/`

---

**Version** : 1.0  
**Date** : 01/10/2025  
**Auteur** : Lionel + Cascade  
**Projet** : JobNexAI - Enrichissement automatique d'offres d'emploi

---

## 🎉 Félicitations !

Votre workflow d'enrichissement automatique est maintenant opérationnel !

**Prochaines étapes :**
1. Surveiller les premières exécutions
2. Ajuster les paramètres selon les résultats
3. Ajouter d'autres sources de jobs
4. Optimiser le quality score

**Bon scraping ! 🚀**

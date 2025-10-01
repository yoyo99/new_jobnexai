# 🔧 N8N TROUBLESHOOTING - ERREURS COURANTES

## 📋 Table des matières

1. [Erreurs Credentials](#erreurs-credentials)
2. [Erreurs Scraping](#erreurs-scraping)
3. [Erreurs Mammouth.ai](#erreurs-mammouthai)
4. [Erreurs JSON Validation](#erreurs-json-validation)
5. [Erreurs Supabase](#erreurs-supabase)
6. [Erreurs Performance](#erreurs-performance)
7. [Logs et Debugging](#logs-et-debugging)

---

## 1. ERREURS CREDENTIALS

### ❌ Erreur: "Credential not found"

**Cause:** Les credentials ne sont pas configurés ou mal assignés.

**Solution:**
```
1. Aller dans Settings → Credentials
2. Vérifier que les credentials existent:
   - Mammouth.ai API Key
   - Supabase JobNexAI
3. Dans le workflow, cliquer sur chaque node rouge
4. Réassigner le bon credential
5. Sauvegarder le workflow
```

### ❌ Erreur: "Authentication failed"

**Cause:** Clé API invalide ou expirée.

**Solution Mammouth.ai:**
```
1. Vérifier la clé: sk-arDMzaX2bdhamr9RxjgERQ
2. Tester avec curl:
   curl -H "Authorization: Bearer sk-arDMzaX2bdhamr9RxjgERQ" \
        https://api.mammouth.ai/v1/models
3. Si erreur, régénérer la clé sur mammouth.ai
```

**Solution Supabase:**
```
1. Vérifier la clé Service Role dans .env
2. Tester la connexion:
   curl -H "apikey: YOUR_KEY" \
        https://klwugophjvzctlautsqz.supabase.co/rest/v1/jobs?limit=1
```

---

## 2. ERREURS SCRAPING

### ❌ Erreur: "No jobs found" (0 résultats)

**Causes possibles:**
1. Sélecteurs CSS obsolètes (site a changé)
2. Blocage anti-bot
3. URL de recherche incorrecte

**Solution Indeed:**
```javascript
// Vérifier les sélecteurs dans Function Node
$('a.tapItem').each((i, el) => {
  // Si vide, le site a peut-être changé
  // Inspecter la page Indeed manuellement
  // Mettre à jour les sélecteurs
});

// Sélecteurs alternatifs Indeed:
$('.job_seen_beacon')  // Nouveau format
$('.resultContent')    // Ancien format
```

**Solution LinkedIn:**
```javascript
// Sélecteurs alternatifs:
$('.base-card')              // Format actuel
$('.job-search-card')        // Format alternatif
$('.jobs-search__results-list li')  // Liste complète
```

**Solution Malt:**
```javascript
// Sélecteurs alternatifs:
$('.freelancer-card')   // Cartes freelances
$('.mission-card')      // Cartes missions
$('.project-card')      // Cartes projets
```

### ❌ Erreur: "403 Forbidden" ou "429 Too Many Requests"

**Cause:** Détection anti-bot ou rate limiting.

**Solution:**
```javascript
// 1. Ajouter delays aléatoires
const delay = Math.floor(Math.random() * (2000 - 800 + 1)) + 800;
await new Promise(resolve => setTimeout(resolve, delay));

// 2. Rotation User-Agents
const userAgents = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
];
const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

// 3. Limiter le nombre de jobs par exécution
// Dans le workflow, ajouter un node "Limit"
// Max 20-40 jobs par run
```

### ❌ Erreur: "Captcha detected"

**Cause:** Site détecte un bot.

**Solutions:**
1. **Utiliser Bright Data API** (recommandé pour LinkedIn)
2. **Ajouter des proxies résidentiels**
3. **Réduire la fréquence** (6h au lieu de 2h)
4. **Cookies rotation** (LinkedIn uniquement)

---

## 3. ERREURS MAMMOUTH.AI

### ❌ Erreur: "Rate limit exceeded"

**Cause:** Trop de requêtes à Mammouth.ai.

**Solution:**
```javascript
// Ajouter un node "Split In Batches"
// Batch size: 5 jobs
// Wait between batches: 2 seconds

// Dans le workflow:
Scraping → Split (5) → Wait (2s) → Mammouth.ai → Loop
```

### ❌ Erreur: "Model not available"

**Cause:** Modèle Mistral indisponible.

**Solution:**
```json
// Changer le modèle dans HTTP Request node:
{
  "model": "mistral-7b-instruct",  // Si erreur
  "model": "mixtral-8x7b-instruct" // Alternative
}
```

### ❌ Erreur: "Timeout" (>30s)

**Cause:** Requête trop longue.

**Solution:**
```json
// Réduire max_tokens dans HTTP Request:
{
  "max_tokens": 1000,  // Au lieu de 2000
  "temperature": 0.3   // Plus déterministe = plus rapide
}
```

### ❌ Erreur: "Invalid JSON response"

**Cause:** Mammouth.ai retourne du texte au lieu de JSON.

**Solution:** Le Function Node "JSON Validator" devrait gérer automatiquement.

**Si ça persiste:**
```javascript
// Améliorer le system prompt:
"Tu dois TOUJOURS répondre en JSON valide.
Ne jamais ajouter de texte avant ou après le JSON.
Format strict: {\"skills\": [...], \"experience_level\": \"...\"}"
```

---

## 4. ERREURS JSON VALIDATION

### ❌ Erreur: "Champs manquants: skills, experience_level"

**Cause:** Mammouth.ai n'a pas retourné tous les champs.

**Solution:** Le fallback devrait s'activer automatiquement.

**Vérifier dans les logs:**
```javascript
console.log('⚠️ [Validation] Champs manquants:', missingFields.join(', '));
// Le job sera inséré avec des valeurs par défaut
```

### ❌ Erreur: "JSON.parse failed"

**Cause:** Réponse IA mal formatée.

**Solution automatique:** Le validator nettoie les balises markdown.

**Si ça persiste:**
```javascript
// Vérifier dans Function Node "JSON Validator":
cleanResponse = aiResponse
  .replace(/^```json\s*/i, '')  // Enlève ```json
  .replace(/^```\s*/i, '')      // Enlève ```
  .replace(/\s*```$/i, '')      // Enlève ``` final
  .trim();
```

---

## 5. ERREURS SUPABASE

### ❌ Erreur: "duplicate key value violates unique constraint"

**Cause:** Job avec même URL déjà existant.

**Solution:**
```sql
-- Option 1: Ignorer les doublons
INSERT INTO jobs (...) 
ON CONFLICT (url) DO NOTHING;

-- Option 2: Mettre à jour si existe
INSERT INTO jobs (...) 
ON CONFLICT (url) DO UPDATE SET
  updated_at = NOW(),
  quality_score = EXCLUDED.quality_score;
```

**Dans N8N:**
```
Modifier le node Supabase:
Operation: "Upsert" au lieu de "Insert"
Conflict Target: "url"
```

### ❌ Erreur: "column does not exist"

**Cause:** Migration SQL pas appliquée.

**Solution:**
```sql
-- Vérifier les colonnes existantes:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs';

-- Si colonnes manquantes, réexécuter:
-- /supabase/migrations/20251001_add_enrichment_columns.sql
```

### ❌ Erreur: "permission denied for table jobs"

**Cause:** RLS (Row Level Security) bloque l'insertion.

**Solution:**
```sql
-- Vérifier les policies:
SELECT * FROM pg_policies WHERE tablename = 'jobs';

-- Créer policy pour service_role:
CREATE POLICY "Service role can insert jobs"
  ON jobs
  FOR INSERT
  TO service_role
  USING (true);
```

### ❌ Erreur: "invalid input syntax for type json"

**Cause:** JSONB mal formaté.

**Solution:**
```javascript
// Dans le node Supabase, s'assurer:
"skills": "={{ JSON.stringify($json.skills) }}"
// Pas juste: "={{ $json.skills }}"
```

---

## 6. ERREURS PERFORMANCE

### ❌ Erreur: "Workflow execution timeout"

**Cause:** Workflow trop long (>5 minutes).

**Solution:**
```
1. Réduire le nombre de jobs scrapés (limit_per_input: 20)
2. Augmenter le timeout dans Settings:
   Workflow Settings → Execution Timeout → 10 minutes
3. Utiliser "Split In Batches" pour traiter par lots
```

### ❌ Erreur: "Memory limit exceeded"

**Cause:** Trop de données en mémoire.

**Solution:**
```
1. Activer "Save Manual Executions" = false
2. Utiliser "Split In Batches" avec batch size: 5
3. Nettoyer les données inutiles:
   
   // Dans Function Node:
   return {
     json: {
       // Seulement les champs nécessaires
       title: job.title,
       company: job.company
       // Pas: raw_html, full_response, etc.
     }
   };
```

---

## 7. LOGS ET DEBUGGING

### 📊 Activer les logs détaillés

**Dans chaque Function Node:**
```javascript
console.log('✅ [Node Name] Success:', data);
console.log('⚠️ [Node Name] Warning:', warning);
console.log('❌ [Node Name] Error:', error);
```

### 📋 Vérifier les exécutions

**Dans N8N:**
```
1. Aller dans "Executions" (menu gauche)
2. Filtrer par workflow
3. Cliquer sur une exécution
4. Voir les logs de chaque node
5. Vérifier les données en entrée/sortie
```

### 🔍 Debugging SQL

**Requêtes utiles:**
```sql
-- Voir les derniers jobs insérés
SELECT * FROM jobs 
ORDER BY created_at DESC 
LIMIT 10;

-- Voir les jobs avec erreurs
SELECT * FROM jobs 
WHERE enrichment_error IS NOT NULL 
ORDER BY created_at DESC;

-- Statistiques par source
SELECT 
  scraping_source,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE enriched = true) as enriched
FROM jobs
GROUP BY scraping_source;
```

### 🧪 Test manuel d'un node

**Dans N8N:**
```
1. Ouvrir le workflow
2. Cliquer sur un node
3. Cliquer sur "Execute Node" (bouton play)
4. Voir le résultat en temps réel
5. Ajuster le code si nécessaire
```

---

## 📞 SUPPORT

### Ressources utiles:
- **N8N Community**: https://community.n8n.io
- **N8N Docs**: https://docs.n8n.io
- **Mammouth.ai Docs**: https://mammouth.ai/docs
- **Supabase Docs**: https://supabase.com/docs

### Fichiers de référence:
- `/scripts/verify-n8n-scraping.sql` - Vérification données
- `/docs/n8n-patterns/README.md` - Patterns et best practices
- `/n8n-workflows/INSTALLATION_GUIDE.md` - Guide installation

---

**Version**: 1.0  
**Date**: 01/10/2025  
**Auteur**: Lionel + Cascade  
**Projet**: JobNexAI - N8N Scraping Infrastructure

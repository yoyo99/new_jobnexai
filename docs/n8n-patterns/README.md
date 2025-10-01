# N8N PATTERNS - JOBNEXAI

Documentation des patterns et bonnes pratiques N8N pour le projet JobNexAI.

## 📚 Table des matières

1. [JSON Validation Pattern](#json-validation-pattern)
2. [AI Agent Best Practices](#ai-agent-best-practices)
3. [Error Handling Strategies](#error-handling-strategies)
4. [Workflow Architecture](#workflow-architecture)

---

## 1. JSON Validation Pattern

### Problème
Les APIs IA (Mammouth.ai, OpenAI, Claude) retournent parfois du JSON mal formaté :
- Balises markdown (```json ... ```)
- Caractères d'échappement (\n, \", etc.)
- Champs manquants ou null
- Types de données incorrects

### Solution
Utiliser un Function Node de validation avec fallback intelligent.

### Implémentation
```javascript
// Voir : /n8n-workflows/function-nodes/json-validator-cleaner.js

const result = validateAndCleanJSON(
  aiResponse,           // Réponse brute de l'IA
  requiredFields,       // ['title', 'company', 'skills']
  defaultStructure      // Structure par défaut en cas d'erreur
);
```

### Avantages
- ✅ Évite les crashes du workflow
- ✅ Garantit une structure cohérente
- ✅ Logs détaillés pour debugging
- ✅ Fallback automatique

### Exemple d'utilisation dans un workflow
```
HTTP Request (Mammouth.ai)
    ↓
Function Node (JSON Validator)  ← Utilise json-validator-cleaner.js
    ↓
Supabase Insert
```

---

## 2. AI Agent Best Practices

### System Prompt Structure

**Composants essentiels :**
1. **Contexte** : Qui est l'agent, quel est son rôle
2. **Compétences** : Ce qu'il sait faire
3. **Instructions** : Ce qu'il doit faire
4. **Contraintes** : Ce qu'il doit éviter
5. **Format** : Structure de réponse attendue
6. **Exemples** : Cas d'usage concrets

### Template
```
Tu es un expert en [DOMAINE].

## Ton rôle :
- [Responsabilité 1]
- [Responsabilité 2]

## Tu dois TOUJOURS :
1. [Règle 1]
2. [Règle 2]

## Tu dois ÉVITER :
- [Anti-pattern 1]
- [Anti-pattern 2]

## Format de réponse OBLIGATOIRE :
{
  "field1": "value",
  "field2": ["array"]
}

Réponds UNIQUEMENT en JSON valide.
```

### Voir aussi
- `/n8n-workflows/prompts/job-enrichment-system-prompt.md`

---

## 3. Error Handling Strategies

### Stratégie 1 : Fallback avec structure par défaut

**Quand l'utiliser :**
- Enrichissement non-critique
- Données partielles acceptables
- Workflow doit continuer coûte que coûte

**Implémentation :**
```javascript
try {
  const enrichedData = await enrichWithAI(jobData);
  return enrichedData;
} catch (error) {
  console.error('Enrichissement échoué:', error);
  return {
    ...jobData,
    enriched: false,
    error_message: error.message
  };
}
```

### Stratégie 2 : Retry avec exponential backoff

**Quand l'utiliser :**
- Erreurs réseau temporaires
- Rate limiting API
- Services externes instables

**Implémentation :**
```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = 1000 * Math.pow(2, i); // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Stratégie 3 : Dead Letter Queue

**Quand l'utiliser :**
- Données critiques
- Nécessite intervention manuelle
- Audit et traçabilité

**Implémentation :**
```javascript
try {
  await processJob(jobData);
} catch (error) {
  // Envoyer dans une table d'erreurs pour traitement manuel
  await supabase.from('failed_jobs').insert({
    job_data: jobData,
    error: error.message,
    timestamp: new Date().toISOString(),
    retry_count: 0
  });
}
```

---

## 4. Workflow Architecture

### Pattern : Scraping → Enrichment → Storage

**Architecture recommandée :**
```
Cron Trigger (toutes les heures)
    ↓
HTTP Request (Scraping Indeed/LinkedIn)
    ↓
Function Node (Parser HTML → JSON)
    ↓
HTTP Request (Mammouth.ai Enrichment)
    ↓
Function Node (JSON Validator)
    ↓
Supabase Insert (Storage)
    ↓
Webhook (Notification optionnelle)
```

### Bonnes pratiques

#### 1. Séparation des responsabilités
- **1 node = 1 responsabilité**
- Éviter les Function Nodes trop complexes
- Facilite le debugging et la maintenance

#### 2. Nommage explicite
```
✅ "HTTP Request - Scraping Indeed"
✅ "Function - Parse HTML to JSON"
✅ "Mammouth.ai - Job Enrichment"

❌ "HTTP Request 1"
❌ "Function Node"
❌ "API Call"
```

#### 3. Gestion des erreurs à chaque étape
```javascript
// Dans chaque Function Node
try {
  // Logique principale
} catch (error) {
  console.error('Erreur dans [NOM_NODE]:', error);
  // Fallback ou throw selon criticité
}
```

#### 4. Logs structurés
```javascript
console.log('✅ [Scraping] Jobs trouvés:', jobs.length);
console.log('⚠️ [Validation] Champs manquants:', missingFields);
console.log('❌ [Enrichment] Échec:', error.message);
```

#### 5. Métriques et monitoring
```javascript
// Ajouter des métriques dans les données
return {
  json: {
    ...jobData,
    _metadata: {
      scraped_at: new Date().toISOString(),
      source: 'indeed',
      workflow_id: $workflow.id,
      execution_id: $execution.id
    }
  }
};
```

---

## 📦 Composants réutilisables

### Function Nodes
- `/n8n-workflows/function-nodes/json-validator-cleaner.js`
- `/n8n-workflows/function-nodes/html-parser-indeed.js` (à créer)
- `/n8n-workflows/function-nodes/deduplication-checker.js` (à créer)

### System Prompts
- `/n8n-workflows/prompts/job-enrichment-system-prompt.md`
- `/n8n-workflows/prompts/cv-analysis-system-prompt.md` (à créer)

### Workflows Templates
- `/n8n-workflows/templates/job-scraper-template.json` (à créer)
- `/n8n-workflows/templates/enrichment-pipeline-template.json` (à créer)

---

## 🔄 Workflow de mise à jour

1. **Développement** : Tester sur N8N local
2. **Validation** : Exécution manuelle sur VPS
3. **Production** : Activation du Cron Trigger
4. **Monitoring** : Vérifier logs et métriques
5. **Itération** : Ajuster selon les résultats

---

## 📚 Ressources

### Documentation officielle
- [N8N Docs](https://docs.n8n.io)
- [N8N Community](https://community.n8n.io)
- [N8N Templates](https://n8n.io/workflows)

### Inspirations
- Workflow Telegram-TikTok Viral Analyzer (validation JSON)
- Workflow Job Finder Automation Bright Data
- Workflow AI Agent avec Zep Memory

---

## 🤝 Contribution

Pour ajouter un nouveau pattern :
1. Créer un fichier markdown dans `/docs/n8n-patterns/`
2. Suivre la structure : Problème → Solution → Implémentation → Exemple
3. Ajouter un lien dans ce README

---

**Version** : 1.0  
**Date** : 01/10/2025  
**Auteur** : Lionel + Cascade  
**Projet** : JobNexAI

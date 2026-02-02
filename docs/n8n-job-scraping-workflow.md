# Workflow n8n - Scraping Multi-Source d'Emplois

## Vue d'ensemble

Ce workflow n8n permet de scraper automatiquement les offres d'emploi de 5 sites majeurs (Indeed, LinkedIn, Malt, Free-Work, Welcome to the Jungle) à chaque recherche lancée depuis le SaaS JobNexAI.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Frontend SaaS  │────>│   API Next.js   │────>│   N8N Webhook   │
│   (Recherche)   │     │ /api/jobs/search│     │  /job-search    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                          ┌──────────────┼──────────────┐
                                          │              │              │
                                    ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
                                    │  Indeed   │ │  LinkedIn │ │   Malt    │
                                    │  Scraper  │ │  Scraper  │ │  Scraper  │
                                    └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
                                          │              │              │
                                    ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
                                    │Free-Work  │ │   WTTJ    │ │  Merge &  │
                                    │  Scraper  │ │  Scraper  │ │ Deduplicate│
                                    └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
                                          │              │              │
                                          └──────────────┼──────────────┘
                                                         │
                                                  ┌──────▼──────┐
                                                  │  Supabase   │
                                                  │   Storage   │
                                                  └──────┬──────┘
                                                         │
                                                  ┌──────▼──────┐
                                                  │ HTML Results│
                                                  │    Page     │
                                                  └─────────────┘
```

## Sites Supportés

| Site | ID | Catégorie | Description |
|------|----|-----------|-------------|
| Indeed | `indeed` | CDI/CDD | Agrégateur d'offres d'emploi |
| LinkedIn | `linkedin` | CDI/CDD | Réseau professionnel mondial |
| Malt | `malt` | Freelance | Plateforme freelance française #2 |
| Free-Work | `free-work` | Freelance | Plateforme freelance française #1 |
| WTTJ | `wttj` | CDI/CDD | Startups et tech français |

## Utilisation

### 1. Via l'API Next.js

```typescript
// POST /api/jobs/search
const response = await fetch('/api/jobs/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Développeur React',
    location: 'Paris',
    contractType: 'cdi',          // 'all', 'cdi', 'cdd', 'freelance', 'stage', 'alternance'
    experienceLevel: 'confirme',   // 'all', 'junior', 'confirme', 'senior', 'lead'
    remote: true,
    salaryMin: 45000,
    salaryMax: 70000,
    maxResults: 30,
    selectedSites: ['indeed', 'linkedin', 'wttj'],
    returnFormat: 'html'          // 'html' ou 'json'
  })
});

// Réponse HTML directe ou JSON selon returnFormat
```

### 2. Via le service N8N

```typescript
import { N8NService, MultiSourceScrapingRequest } from '@/services/n8n-service';

const request: MultiSourceScrapingRequest = {
  query: 'Data Scientist',
  location: 'Lyon',
  contractType: 'all',
  maxResults: 50
};

const result = await N8NService.scrapeJobsMultiSource(request);
console.log(result.html);       // Page HTML avec les résultats
console.log(result.totalJobs);  // Nombre total d'offres
```

### 3. Appel direct au webhook n8n

```bash
curl -X POST https://n8n.jobnexai.com/webhook/job-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "DevOps Engineer",
    "location": "France",
    "selected_sites": ["indeed", "linkedin", "malt", "free-work", "wttj"],
    "max_results": 20
  }'
```

## Format de la Réponse

### Réponse HTML

Le workflow retourne une page HTML complète et stylisée avec :
- Header avec statistiques (total d'offres, répartition par source)
- Filtres interactifs (par type de contrat, par source)
- Cartes d'offres avec :
  - Badge de la source (Indeed, LinkedIn, etc.)
  - Titre cliquable vers l'offre originale
  - Entreprise et localisation
  - Type de contrat et télétravail
  - Salaire (si disponible)
  - Description courte
  - Bouton "Voir l'offre"
- Design responsive et moderne

### Réponse JSON (si returnFormat: 'json')

```json
{
  "success": true,
  "sessionId": "session_1706889600000_abc123",
  "totalJobs": 25,
  "jobsBySource": {
    "indeed": 8,
    "linkedin": 5,
    "malt": 4,
    "free-work": 4,
    "wttj": 4
  },
  "jobs": [
    {
      "id": "indeed_session_abc_0",
      "title": "Développeur React Senior",
      "company": "TechCorp",
      "location": "Paris",
      "salary": "55 000 - 70 000 EUR/an",
      "contract_type": "CDI",
      "experience_level": "Senior",
      "description": "...",
      "url": "https://fr.indeed.com/viewjob?jk=...",
      "posted_date": "2024-02-02T10:00:00Z",
      "source": "indeed",
      "remote": "Télétravail partiel"
    }
  ]
}
```

## Stockage des Données

Les résultats sont automatiquement stockés dans Supabase :

### Table `scraping_sessions`
- `id` : UUID de la session
- `user_id` : ID de l'utilisateur
- `criteria` : Critères de recherche (JSON)
- `selected_sites` : Sites scrapés
- `status` : pending → running → completed/failed
- `total_jobs` : Nombre d'offres trouvées
- `created_at`, `updated_at`

### Table `scraped_jobs`
- `id` : UUID de l'offre
- `session_id` : Lien vers la session
- `site_name` : Source (indeed, linkedin, etc.)
- `title`, `company`, `location`
- `salary`, `contract_type`, `experience_level`
- `description`, `url`
- `posted_date`, `scraped_at`

## Gestion des Erreurs

- Les erreurs sont logguées dans la table `workflow_errors`
- Retry automatique en cas d'échec réseau
- Résultats partiels retournés si certains scrapers échouent
- Timeout de 30 secondes par scraper

## Historique des Sessions

### Récupérer l'historique
```typescript
// GET /api/jobs/sessions?limit=10&offset=0
const response = await fetch('/api/jobs/sessions');
const { sessions, pagination } = await response.json();
```

### Récupérer les détails d'une session
```typescript
// GET /api/jobs/sessions/[sessionId]
const response = await fetch(`/api/jobs/sessions/${sessionId}`);
const { session, jobs, stats } = await response.json();
```

### Supprimer une session
```typescript
// DELETE /api/jobs/sessions/[sessionId]
await fetch(`/api/jobs/sessions/${sessionId}`, { method: 'DELETE' });
```

## Configuration

### Variables d'environnement

```env
# URL du serveur n8n
N8N_URL=https://n8n.jobnexai.com
VITE_N8N_URL=https://n8n.jobnexai.com

# Supabase (pour le stockage)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Déploiement du workflow

1. Importer `n8n-workflows/job-scraping-workflow.json` dans n8n
2. Configurer les credentials Supabase
3. Activer le workflow
4. Tester avec une requête POST sur `/webhook/job-search`

## Limitations

- Maximum 100 résultats par recherche
- Rate limiting sur LinkedIn (1 requête simultanée max)
- Cache des résultats :
  - Indeed : 30 minutes
  - LinkedIn : 2 heures
  - Autres : 1 heure

## Prochaines Évolutions

- [ ] Intégration de vrais scrapers (Puppeteer/Playwright)
- [ ] Enrichissement des offres avec IA (Mammouth.ai)
- [ ] Alertes email pour nouvelles offres
- [ ] Export CSV/PDF des résultats
- [ ] Matching automatique avec le profil utilisateur

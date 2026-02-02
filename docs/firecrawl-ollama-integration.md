# Intégration Firecrawl + Ollama pour JobNexAI

## Vue d'ensemble

Cette intégration utilise **Firecrawl** pour le scraping web et **Ollama** pour l'enrichissement IA des offres d'emploi, tous deux hébergés sur votre VPS via Coolify.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   N8N Workflow  │────>│   Firecrawl     │────>│    Ollama       │
│  (Orchestration)│     │   (Scraping)    │     │ (Enrichissement)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                       │
         └──────────────────────┼───────────────────────┘
                                │
                         ┌──────▼──────┐
                         │  Supabase   │
                         │  (Storage)  │
                         └─────────────┘
```

## Configuration

### Variables d'environnement

```env
# Firecrawl (sur votre VPS Coolify)
FIRECRAWL_API_URL=https://firecrawl.votre-vps.com
FIRECRAWL_API_KEY=fc-xxxxxxxxxxxx

# Ollama (sur votre VPS Coolify)
OLLAMA_API_URL=https://ollama.votre-vps.com
OLLAMA_MODEL=llama3.1:8b
# ou mistral:7b, mixtral:8x7b, etc.
```

## Firecrawl - Scraping Web

### Avantages par rapport au scraping direct

| Fonctionnalité | Scraping Direct | Firecrawl |
|----------------|-----------------|-----------|
| Anti-bot bypass | ❌ | ✅ |
| JavaScript rendering | ❌ | ✅ |
| Proxy automatique | ❌ | ✅ |
| Rate limiting | Manuel | Automatique |
| Format Markdown | ❌ | ✅ |
| LLM-ready output | ❌ | ✅ |

### Endpoints Firecrawl

```typescript
// 1. Scrape une page unique
POST /v1/scrape
{
  "url": "https://fr.indeed.com/viewjob?jk=abc123",
  "formats": ["markdown", "html"],
  "onlyMainContent": true,
  "waitFor": 2000
}

// 2. Crawl multiple pages (site entier)
POST /v1/crawl
{
  "url": "https://fr.indeed.com/emplois?q=react&l=paris",
  "limit": 20,
  "scrapeOptions": {
    "formats": ["markdown"]
  }
}

// 3. Map d'un site (découverte de liens)
POST /v1/map
{
  "url": "https://www.welcometothejungle.com/fr/jobs",
  "limit": 100
}
```

### Exemple d'utilisation dans n8n

```javascript
// Node HTTP Request dans n8n
const firecrawlResponse = await $http.request({
  method: 'POST',
  url: `${process.env.FIRECRAWL_API_URL}/v1/scrape`,
  headers: {
    'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: {
    url: 'https://fr.indeed.com/viewjob?jk=abc123',
    formats: ['markdown'],
    onlyMainContent: true
  }
});

// Résultat: contenu Markdown prêt pour l'IA
const jobContent = firecrawlResponse.data.markdown;
```

## Ollama - Enrichissement IA

### Modèles recommandés

| Modèle | RAM | Vitesse | Qualité | Usage |
|--------|-----|---------|---------|-------|
| `llama3.1:8b` | 8GB | Rapide | Bonne | Extraction de données |
| `mistral:7b` | 8GB | Très rapide | Bonne | Résumés, classification |
| `mixtral:8x7b` | 48GB | Moyen | Excellente | Analyse complexe |
| `qwen2.5:7b` | 8GB | Rapide | Très bonne | Multilingue (FR/EN) |

### Cas d'usage

#### 1. Extraction structurée d'une offre

```javascript
// Prompt pour extraire les données d'une offre
const extractionPrompt = `
Extrait les informations suivantes de cette offre d'emploi au format JSON:

{
  "title": "Titre du poste",
  "company": "Nom de l'entreprise",
  "location": "Ville, Pays",
  "salary": "Salaire (si mentionné)",
  "contract_type": "CDI/CDD/Freelance/Stage",
  "experience_required": "Junior/Confirmé/Senior",
  "remote_policy": "Sur site/Hybride/Full remote",
  "skills": ["skill1", "skill2"],
  "responsibilities": ["resp1", "resp2"],
  "benefits": ["benefit1", "benefit2"]
}

OFFRE:
${jobMarkdown}

Réponds UNIQUEMENT avec le JSON, sans commentaire.
`;

const ollamaResponse = await $http.request({
  method: 'POST',
  url: `${process.env.OLLAMA_API_URL}/api/generate`,
  body: {
    model: 'llama3.1:8b',
    prompt: extractionPrompt,
    stream: false,
    options: {
      temperature: 0.1,  // Faible pour extraction précise
      num_predict: 1000
    }
  }
});

const structuredJob = JSON.parse(ollamaResponse.response);
```

#### 2. Calcul du score de matching CV/Offre

```javascript
const matchingPrompt = `
Compare ce CV avec cette offre d'emploi et donne un score de matching de 0 à 100.

CV DU CANDIDAT:
${cvText}

OFFRE D'EMPLOI:
${jobMarkdown}

Réponds au format JSON:
{
  "score": 85,
  "strengths": ["Point fort 1", "Point fort 2"],
  "gaps": ["Manque 1", "Manque 2"],
  "recommendation": "Recommandation courte"
}
`;
```

#### 3. Détection de doublons sémantiques

```javascript
const deduplicationPrompt = `
Ces deux offres d'emploi sont-elles la même offre publiée sur différents sites ?

OFFRE 1:
${job1Markdown}

OFFRE 2:
${job2Markdown}

Réponds au format JSON:
{
  "is_duplicate": true/false,
  "confidence": 0.95,
  "reason": "Explication courte"
}
`;
```

## Architecture complète avec n8n

```
┌────────────────────────────────────────────────────────────────────┐
│                         N8N WORKFLOW                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    ┌─────────────┐    ┌──────────────┐               │
│  │ Webhook  │───>│ Prepare     │───>│ Split Sites  │               │
│  │ Trigger  │    │ Search      │    │ (Parallel)   │               │
│  └──────────┘    └─────────────┘    └──────┬───────┘               │
│                                            │                        │
│       ┌────────────────────────────────────┼────────────────┐      │
│       │                    │               │                │      │
│  ┌────▼────┐    ┌─────────▼───┐    ┌──────▼─────┐    ┌─────▼────┐ │
│  │ Indeed  │    │  LinkedIn   │    │   Malt     │    │  WTTJ    │ │
│  │ Scraper │    │  Scraper    │    │  Scraper   │    │ Scraper  │ │
│  └────┬────┘    └──────┬──────┘    └─────┬──────┘    └────┬─────┘ │
│       │                │                 │                │       │
│       └────────────────┼─────────────────┼────────────────┘       │
│                        │                 │                         │
│                   ┌────▼─────────────────▼────┐                   │
│                   │      FIRECRAWL            │  ◄── VPS Coolify  │
│                   │   (Scrape each URL)       │                   │
│                   └───────────┬───────────────┘                   │
│                               │                                    │
│                   ┌───────────▼───────────────┐                   │
│                   │        OLLAMA             │  ◄── VPS Coolify  │
│                   │  (Extract & Enrich)       │                   │
│                   └───────────┬───────────────┘                   │
│                               │                                    │
│                   ┌───────────▼───────────────┐                   │
│                   │     Deduplicate           │                   │
│                   │  (Hash + Semantic)        │                   │
│                   └───────────┬───────────────┘                   │
│                               │                                    │
│                   ┌───────────▼───────────────┐                   │
│                   │       Supabase            │                   │
│                   │    (Save Results)         │                   │
│                   └───────────┬───────────────┘                   │
│                               │                                    │
│                   ┌───────────▼───────────────┐                   │
│                   │   Generate HTML Page      │                   │
│                   │   (Results for user)      │                   │
│                   └───────────────────────────┘                   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Service TypeScript pour Firecrawl

```typescript
// src/services/firecrawl-service.ts

const FIRECRAWL_API_URL = process.env.FIRECRAWL_API_URL || 'https://firecrawl.votre-vps.com';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

export interface ScrapeResult {
  success: boolean;
  data?: {
    markdown: string;
    html?: string;
    metadata: {
      title: string;
      description: string;
      sourceURL: string;
    };
  };
  error?: string;
}

export class FirecrawlService {
  /**
   * Scrape une page unique et retourne le contenu en Markdown
   */
  static async scrapePage(url: string): Promise<ScrapeResult> {
    const response = await fetch(`${FIRECRAWL_API_URL}/v1/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000
      })
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    return await response.json();
  }

  /**
   * Scrape une liste de résultats de recherche
   */
  static async scrapeJobListings(searchUrl: string, limit = 20): Promise<ScrapeResult[]> {
    const response = await fetch(`${FIRECRAWL_API_URL}/v1/crawl`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: searchUrl,
        limit,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true
        }
      })
    });

    const data = await response.json();
    return data.data || [];
  }
}
```

## Service TypeScript pour Ollama

```typescript
// src/services/ollama-service.ts

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'https://ollama.votre-vps.com';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

export interface JobExtractionResult {
  title: string;
  company: string;
  location: string;
  salary?: string;
  contract_type: string;
  experience_required: string;
  remote_policy: string;
  skills: string[];
  responsibilities: string[];
  benefits: string[];
}

export class OllamaService {
  /**
   * Extrait les données structurées d'une offre en Markdown
   */
  static async extractJobData(jobMarkdown: string): Promise<JobExtractionResult> {
    const prompt = `Extrait les informations de cette offre d'emploi au format JSON strict:

{
  "title": "string",
  "company": "string",
  "location": "string",
  "salary": "string or null",
  "contract_type": "CDI|CDD|Freelance|Stage|Alternance",
  "experience_required": "Junior|Confirmé|Senior|Lead",
  "remote_policy": "Sur site|Hybride|Full remote",
  "skills": ["string"],
  "responsibilities": ["string"],
  "benefits": ["string"]
}

OFFRE:
${jobMarkdown.substring(0, 4000)}

JSON:`;

    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.1, num_predict: 1500 }
      })
    });

    const data = await response.json();

    // Parse le JSON de la réponse
    const jsonMatch = data.response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Failed to extract job data');
  }

  /**
   * Calcule le score de matching entre un CV et une offre
   */
  static async calculateMatchScore(
    cvText: string,
    jobMarkdown: string
  ): Promise<{ score: number; strengths: string[]; gaps: string[] }> {
    const prompt = `Compare ce CV avec cette offre. Score de 0 à 100.

CV:
${cvText.substring(0, 2000)}

OFFRE:
${jobMarkdown.substring(0, 2000)}

Réponds en JSON: {"score": number, "strengths": ["..."], "gaps": ["..."]}

JSON:`;

    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 500 }
      })
    });

    const data = await response.json();
    const jsonMatch = data.response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 0, strengths: [], gaps: [] };
  }
}
```

## Mise à jour du workflow n8n

Le workflow `job-scraping-workflow.json` peut être mis à jour pour utiliser Firecrawl et Ollama. Les nœuds de scraping simulés seront remplacés par des appels HTTP vers vos services.

## URLs de vos services Coolify

Remplacez ces URLs par les vraies URLs de vos services Coolify :

```env
# .env.local
FIRECRAWL_API_URL=https://firecrawl.votre-domaine.com
FIRECRAWL_API_KEY=votre-clé-api
OLLAMA_API_URL=https://ollama.votre-domaine.com
OLLAMA_MODEL=llama3.1:8b
```

## Prochaines étapes

1. [ ] Récupérer les URLs de Firecrawl et Ollama depuis Coolify
2. [ ] Configurer les variables d'environnement
3. [ ] Mettre à jour le workflow n8n avec les vrais scrapers
4. [ ] Tester l'extraction d'une offre Indeed avec Firecrawl + Ollama
5. [ ] Ajouter le calcul de matching CV/Offre

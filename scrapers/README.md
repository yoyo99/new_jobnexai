# JobNexAI-Matches Scraping System

## 🎯 Vue d'ensemble

Système de scraping multi-sources pour collecter des offres d'emploi depuis 38 sites différents.

## 🏗️ Architecture

```
scrapers/
├── free_work_scraper.py     # Template de base (OPÉRATIONNEL)
├── malt_scraper.py          # À créer
├── indeed_scraper.py        # À créer
└── [site]_scraper.py        # 35 autres à créer
```

## 📊 Sources configurées (38 total)

### Priorité 1 (10 sources) - Sites Premium
- Free-Work ✅ (Opérationnel)
- Malt, LinkedIn, Indeed, APEC
- France Travail, Welcome Jungle
- Pylote, Le Hibou, Talent.io

### Priorité 2 (13 sources) - Sites Spécialisés  
- Comet, Cherry Pick, WeLoveDevs, Codeur...

### Priorité 3 (15 sources) - Sites Volume
- Monster, Fiverr, Upwork, JobiJoba...

## 🔧 Installation

```bash
# Dépendances
pip install aiohttp beautifulsoup4 python-dotenv supabase

# Variables d'environnement
cp .env.example .env
# Configurer SUPABASE_SERVICE_ROLE_KEY
```

## 🚀 Utilisation

```bash
# Scraper Free-Work (exemple)
python3 scrapers/free_work_scraper.py

# Vérification données
# SQL: SELECT COUNT(*) FROM jobnexai_external_jobs;
```

## 🛡️ Sécurité

- Rate limiting : 2-3s entre requêtes
- Service Role pour bypass RLS Supabase
- Déduplication automatique des URLs
- Headers anti-détection

## 📈 Performance

- Scraping asynchrone (aiohttp)
- Batch insert optimisé 
- Index GIN sur arrays skills
- Gestion mémoire automatique

## 🔄 Comment fonctionne le matching

1. **Extraction** : Parsing HTML avec BeautifulSoup
2. **Standardisation** : Normalisation des données
3. **Sauvegarde** : Insert Supabase avec UUID foreign keys
4. **API** : Exposition via Edge Function REST

## 🧪 Tests

```bash
# Tests unitaires (à implémenter)
pytest scrapers/tests/
```

## 📝 Logs

Logs automatiques dans chaque scraper :
- INFO : Progression scraping
- ERROR : Échecs parsing/sauvegarde
- WARNING : Données manquantes

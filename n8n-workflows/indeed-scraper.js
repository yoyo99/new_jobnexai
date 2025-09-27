// N8N Workflow Code: Indeed Scraper
// Ce code va dans le nœud "Code" du workflow N8N

// Récupérer les paramètres de la requête
const query = $json.query || 'développeur';
const location = $json.location || 'Paris, France';
const maxResults = $json.max_results || 10;

// Log pour debug
console.log(`🔍 Indeed Search: "${query}" in "${location}"`);

// Construction de l'URL Indeed
const encodedQuery = encodeURIComponent(query);
const encodedLocation = encodeURIComponent(location);
const indeedUrl = `https://fr.indeed.com/jobs?q=${encodedQuery}&l=${encodedLocation}&radius=25&limit=${maxResults}`;

console.log(`📡 URL: ${indeedUrl}`);

// Simuler les résultats pour l'instant (en attendant le vrai scraping)
const mockResults = [
  {
    title: `${query} - Senior`,
    company: "TechCorp France",
    location: location,
    url: "https://fr.indeed.com/viewjob?jk=abc123",
    description: `Poste de ${query} senior avec 5+ ans d'expérience`,
    salary: "45k-65k EUR",
    source: "Indeed",
    scraped_at: new Date().toISOString()
  },
  {
    title: `${query} - Junior`,
    company: "StartupTech",
    location: location,
    url: "https://fr.indeed.com/viewjob?jk=def456",
    description: `Opportunité pour ${query} junior dynamique`,
    salary: "35k-45k EUR",
    source: "Indeed",
    scraped_at: new Date().toISOString()
  }
];

// Préparer la réponse
const response = {
  status: "completed",
  scraper: "Indeed",
  query: query,
  location: location,
  url_searched: indeedUrl,
  jobs_count: mockResults.length,
  jobs: mockResults,
  scraped_at: new Date().toISOString(),
  processing_time: "2.3s"
};

// Retourner les résultats
return response;

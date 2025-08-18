export interface ScrapingCriteria {
  countries: string[];
  cities: string[];
  jobTitles: string[];
  salaryRange: {
    min?: number;
    max?: number;
    currency: string;
  };
  experienceLevel: 'junior' | 'mid' | 'senior' | 'all';
  contractTypes: ('CDI' | 'CDD' | 'freelance' | 'stage' | 'alternance')[];
  remote: boolean | null; // null = tous, true = remote uniquement, false = présentiel
  keywords: string[];
}

export interface JobSite {
  id: string;
  name: string;
  baseUrl: string;
  type: 'job_board' | 'company_site' | 'freelance_platform';
  country: string;
  language: string;
  selectors: {
    jobList: string;
    jobTitle: string;
    company: string;
    location: string;
    salary?: string;
    description: string;
    link: string;
    date?: string;
  };
  searchUrl: string; // Template avec placeholders
  rateLimit: number; // Délai entre requêtes (ms)
  requiresProxy: boolean;
  active: boolean;
}

export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url: string;
  postedDate?: string;
  source: string;
  contractType?: string;
  remote?: boolean;
  scrapedAt: string;
}

export interface ScrapingSession {
  id: string;
  criteria: ScrapingCriteria;
  sites: string[]; // IDs des sites à scraper
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  totalJobs: number;
  errors: string[];
  userId: string;
}

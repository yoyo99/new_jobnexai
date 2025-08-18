import { JobSite } from '../types/scraping';

export const JOB_SITES: JobSite[] = [
  // Sites français
  {
    id: 'indeed_fr',
    name: 'Indeed France',
    baseUrl: 'https://fr.indeed.com',
    type: 'job_board',
    country: 'FR',
    language: 'fr',
    selectors: {
      jobList: '[data-jk]',
      jobTitle: 'h2.jobTitle a span',
      company: '.companyName',
      location: '.companyLocation',
      salary: '.salary-snippet',
      description: '.job-snippet',
      link: 'h2.jobTitle a',
      date: '.date'
    },
    searchUrl: 'https://fr.indeed.com/jobs?q={keywords}&l={location}&salary={salary}&fromage={days}',
    rateLimit: 2000,
    requiresProxy: true,
    active: true
  },
  {
    id: 'welcometothejungle_fr',
    name: 'Welcome to the Jungle',
    baseUrl: 'https://www.welcometothejungle.com',
    type: 'job_board',
    country: 'FR',
    language: 'fr',
    selectors: {
      jobList: '[data-testid="jobs-search-item"]',
      jobTitle: '[data-testid="job-title"]',
      company: '[data-testid="job-company-name"]',
      location: '[data-testid="job-location"]',
      salary: '[data-testid="job-salary"]',
      description: '[data-testid="job-description"]',
      link: 'a[data-testid="job-title"]'
    },
    searchUrl: 'https://www.welcometothejungle.com/fr/jobs?query={keywords}&refinementList%5Boffices.city%5D%5B0%5D={location}',
    rateLimit: 1500,
    requiresProxy: false,
    active: true
  },
  {
    id: 'apec_fr',
    name: 'APEC',
    baseUrl: 'https://www.apec.fr',
    type: 'job_board',
    country: 'FR',
    language: 'fr',
    selectors: {
      jobList: '.box-offer',
      jobTitle: '.title-offer a',
      company: '.company-offer',
      location: '.location-offer',
      salary: '.salary-offer',
      description: '.description-offer',
      link: '.title-offer a'
    },
    searchUrl: 'https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles={keywords}&lieux={location}',
    rateLimit: 3000,
    requiresProxy: true,
    active: true
  },
  
  // Sites freelance français
  {
    id: 'malt_fr',
    name: 'Malt',
    baseUrl: 'https://www.malt.fr',
    type: 'freelance_platform',
    country: 'FR',
    language: 'fr',
    selectors: {
      jobList: '.mission-card',
      jobTitle: '.mission-title',
      company: '.client-name',
      location: '.mission-location',
      salary: '.mission-budget',
      description: '.mission-description',
      link: '.mission-card a'
    },
    searchUrl: 'https://www.malt.fr/projects?q={keywords}&location={location}',
    rateLimit: 2000,
    requiresProxy: false,
    active: true
  },
  {
    id: 'freelancecom_fr',
    name: 'Freelance.com',
    baseUrl: 'https://www.freelance.com',
    type: 'freelance_platform',
    country: 'FR',
    language: 'fr',
    selectors: {
      jobList: '.project-item',
      jobTitle: '.project-title a',
      company: '.client-info',
      location: '.project-location',
      salary: '.project-budget',
      description: '.project-description',
      link: '.project-title a'
    },
    searchUrl: 'https://www.freelance.com/projects/search?keywords={keywords}&location={location}',
    rateLimit: 2500,
    requiresProxy: true,
    active: true
  },

  // Sites internationaux
  {
    id: 'linkedin_jobs',
    name: 'LinkedIn Jobs',
    baseUrl: 'https://www.linkedin.com',
    type: 'job_board',
    country: 'GLOBAL',
    language: 'en',
    selectors: {
      jobList: '.job-search-card',
      jobTitle: '.job-search-card__title',
      company: '.job-search-card__subtitle-primary-grouping',
      location: '.job-search-card__location',
      salary: '.job-search-card__salary-info',
      description: '.job-search-card__snippet',
      link: '.job-search-card__title a'
    },
    searchUrl: 'https://www.linkedin.com/jobs/search/?keywords={keywords}&location={location}',
    rateLimit: 5000,
    requiresProxy: true,
    active: true
  },
  {
    id: 'upwork',
    name: 'Upwork',
    baseUrl: 'https://www.upwork.com',
    type: 'freelance_platform',
    country: 'GLOBAL',
    language: 'en',
    selectors: {
      jobList: '[data-test="JobTile"]',
      jobTitle: '[data-test="JobTileTitle"] a',
      company: '[data-test="ClientInfo"]',
      location: '[data-test="LocationInfo"]',
      salary: '[data-test="BudgetInfo"]',
      description: '[data-test="JobDescription"]',
      link: '[data-test="JobTileTitle"] a'
    },
    searchUrl: 'https://www.upwork.com/nx/search/jobs/?q={keywords}&location_filter={location}',
    rateLimit: 3000,
    requiresProxy: true,
    active: true
  },

  // Sites spécialisés tech
  {
    id: 'stackoverflow_jobs',
    name: 'Stack Overflow Jobs',
    baseUrl: 'https://stackoverflow.com',
    type: 'job_board',
    country: 'GLOBAL',
    language: 'en',
    selectors: {
      jobList: '.js-job-link',
      jobTitle: '.job-link--title',
      company: '.job-link--company',
      location: '.job-link--location',
      salary: '.job-link--salary',
      description: '.job-link--description',
      link: '.js-job-link'
    },
    searchUrl: 'https://stackoverflow.com/jobs?q={keywords}&l={location}',
    rateLimit: 2000,
    requiresProxy: false,
    active: true
  }
];

export const getJobSitesByCountry = (country: string): JobSite[] => {
  return JOB_SITES.filter(site => 
    site.country === country || site.country === 'GLOBAL'
  ).filter(site => site.active);
};

export const getJobSitesByType = (type: JobSite['type']): JobSite[] => {
  return JOB_SITES.filter(site => site.type === type && site.active);
};

export const getJobSiteById = (id: string): JobSite | undefined => {
  return JOB_SITES.find(site => site.id === id);
};

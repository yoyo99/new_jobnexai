/**
 * SEO utilities and meta tag management for JobNexAI
 */

import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'

// SEO configuration
export const seoConfig = {
  defaultTitle: 'JobNexAI - AI-Powered Job Search Platform',
  titleTemplate: '%s | JobNexAI',
  defaultDescription: 'Find your dream job with AI-powered job search. Automated applications, CV optimization, and personalized job recommendations.',
  siteUrl: 'https://jobnexai.com',
  twitterHandle: '@jobnexai',
  socialPreviewImage: '/social-preview.jpg',
  themeColor: '#1f2937'
}

// Interface for page SEO data
interface PageSeoData {
  title?: string
  description?: string
  keywords?: string[]
  canonical?: string
  noindex?: boolean
}

// Page-specific SEO data
export const pageSeoData: Record<string, PageSeoData> = {
  '/': {
    title: 'AI-Powered Job Search Platform',
    description: 'Transform your job search with AI. Automated applications, intelligent matching, and career optimization tools.',
    keywords: ['job search', 'ai jobs', 'career', 'employment', 'automated applications']
  },
  '/jobs': {
    title: 'Browse Jobs',
    description: 'Discover thousands of job opportunities with our AI-powered search and filtering system.',
    keywords: ['job listings', 'job search', 'employment opportunities', 'career opportunities']
  },
  '/applications': {
    title: 'Job Applications',
    description: 'Track and manage your job applications with intelligent insights and status updates.',
    keywords: ['job applications', 'application tracking', 'job status', 'application management']
  },
  '/cv-builder': {
    title: 'AI CV Builder',
    description: 'Create professional CVs with AI-powered optimization and industry-specific templates.',
    keywords: ['cv builder', 'resume builder', 'ai cv', 'professional resume', 'cv optimization']
  },
  '/pricing': {
    title: 'Pricing Plans',
    description: 'Choose the perfect plan for your job search needs. Free trial available.',
    keywords: ['pricing', 'job search plans', 'subscription', 'premium features']
  },
  '/login': {
    title: 'Sign In',
    description: 'Access your JobNexAI account to continue your job search journey.',
    noindex: true
  },
  '/register': {
    title: 'Create Account',
    description: 'Join thousands of job seekers who found their dream jobs with JobNexAI.',
    keywords: ['sign up', 'create account', 'join', 'register']
  }
}

// Structured data schemas
export const generateJobListingSchema = (jobs: any[]) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  numberOfItems: jobs.length,
  itemListElement: jobs.map((job, index) => ({
    '@type': 'JobPosting',
    position: index + 1,
    title: job.title,
    description: job.description,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company
    },
    jobLocation: {
      '@type': 'Place',
      address: job.location
    },
    employmentType: job.jobType,
    datePosted: job.postedAt,
    url: `${seoConfig.siteUrl}/jobs/${job.id}`
  }))
})

export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'JobNexAI',
  url: seoConfig.siteUrl,
  logo: `${seoConfig.siteUrl}/logo.png`,
  description: seoConfig.defaultDescription,
  foundingDate: '2024',
  sameAs: [
    'https://twitter.com/jobnexai',
    'https://linkedin.com/company/jobnexai'
  ]
})

export const generateWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'JobNexAI',
  url: seoConfig.siteUrl,
  description: seoConfig.defaultDescription,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${seoConfig.siteUrl}/jobs?q={search_term_string}`
    },
    'query-input': 'required name=search_term_string'
  }
})

// SEO Component
interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  canonical?: string
  noindex?: boolean
  structuredData?: object | object[]
}

export function SEO({
  title,
  description,
  keywords = [],
  image,
  canonical,
  noindex = false,
  structuredData
}: SEOProps) {
  const location = useLocation()
  const currentPath = location.pathname
  
  // Get page-specific data
  const pageData = pageSeoData[currentPath] || {}
  
  // Build final meta data
  const finalTitle = title || pageData.title || seoConfig.defaultTitle
  const finalDescription = description || pageData.description || seoConfig.defaultDescription
  const finalKeywords = [...keywords, ...(pageData.keywords || [])]
  const finalCanonical = canonical || pageData.canonical || `${seoConfig.siteUrl}${currentPath}`
  const finalImage = image || seoConfig.socialPreviewImage
  const shouldNoIndex = noindex || Boolean(pageData.noindex) || false

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      {finalKeywords.length > 0 && (
        <meta name="keywords" content={finalKeywords.join(', ')} />
      )}
      <link rel="canonical" href={finalCanonical} />
      
      {/* Robots */}
      {shouldNoIndex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={`${seoConfig.siteUrl}${finalImage}`} />
      <meta property="og:url" content={finalCanonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="JobNexAI" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={seoConfig.twitterHandle} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={`${seoConfig.siteUrl}${finalImage}`} />
      
      {/* Additional Meta */}
      <meta name="theme-color" content={seoConfig.themeColor} />
      <meta name="author" content="JobNexAI Team" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(structuredData) ? structuredData : [structuredData])}
        </script>
      )}
      
      {/* Default Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify(generateOrganizationSchema())}
      </script>
      
      {/* Website Schema */}
      <script type="application/ld+json">
        {JSON.stringify(generateWebsiteSchema())}
      </script>
    </Helmet>
  )
}

// Sitemap generation utility
export const generateSitemap = () => {
  const staticPages = [
    { url: '/', priority: 1.0, changeFreq: 'daily' },
    { url: '/jobs', priority: 0.9, changeFreq: 'hourly' },
    { url: '/pricing', priority: 0.8, changeFreq: 'weekly' },
    { url: '/features', priority: 0.7, changeFreq: 'weekly' },
    { url: '/how-it-works', priority: 0.7, changeFreq: 'weekly' },
    { url: '/testimonials', priority: 0.6, changeFreq: 'monthly' },
    { url: '/privacy', priority: 0.5, changeFreq: 'monthly' },
    { url: '/register', priority: 0.8, changeFreq: 'weekly' }
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `
  <url>
    <loc>${seoConfig.siteUrl}${page.url}</loc>
    <changefreq>${page.changeFreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`).join('')}
</urlset>`

  return sitemap
}

// robots.txt generation
export const generateRobotsTxt = () => {
  return `User-agent: *
Allow: /
Disallow: /app/
Disallow: /admin/
Disallow: /api/
Disallow: /auth/

Sitemap: ${seoConfig.siteUrl}/sitemap.xml`
}

export default SEO
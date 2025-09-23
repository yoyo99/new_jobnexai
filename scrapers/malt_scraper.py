#!/usr/bin/env python3
"""
Malt Scraper for JobNexAI
==========================

Scraper professionnel pour extraire les offres de Malt.fr
Compatible avec l'architecture JobNexAI existante.

Author: JobNexAI Team  
Date: 2025-09-23
"""

import asyncio
import aiohttp
import logging
import re
import os
import sys
import traceback
from typing import List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    from supabase import create_client, Client
except ImportError:
    logging.error("Please install supabase: pip install supabase")
    sys.exit(1)

# Validation environment variables
required_env_vars = ["VITE_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    logging.error(f"Missing environment variables: {missing_vars}")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class JobOffer:
    """Structure d'une offre d'emploi Malt"""
    source_id: str  # UUID from database
    url: str
    title: str
    contract_type: List[str]
    required_skills: List[str]
    salary_range: Optional[str]
    is_remote: bool
    location: Optional[str]
    description: Optional[str]
    company_name: Optional[str]
    experience_level: Optional[str]
    last_scraped_at: str

class MaltScraper:
    """Scraper Malt optimisé pour JobNexAI"""
    
    def __init__(self):
        """Initialize scraper with Supabase connection"""
        self.base_url = "https://www.malt.fr"
        self.source_key = "malt"
        self.source_id = None  # Will be fetched from database
        
        # Supabase connection with SERVICE ROLE for scraping
        self.supabase: Client = create_client(
            os.getenv("VITE_SUPABASE_URL", ""),
            os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")  # Use service role for bypassing RLS
        )
        
        # Headers to avoid blocking - Malt specific (no brotli encoding)
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',  # Removed 'br' to avoid brotli issues
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        # Rate limiting - Malt is more sensitive
        self.delay_between_requests = 3.0  # seconds
        
    async def get_source_id(self) -> str:
        """Fetch source UUID from database using source_key"""
        try:
            response = self.supabase.table("job_sources").select("id").eq("source_key", self.source_key).single().execute()
            if response.data:
                return response.data["id"]
            else:
                raise Exception(f"Source {self.source_key} not found in database")
        except Exception as e:
            logger.error(f"Error fetching source_id: {str(e)}")
            raise
        
    async def scrape_job_list(self, session: aiohttp.ClientSession, page: int = 1) -> List[str]:
        """
        Extract job URLs from Malt listing page
        
        Args:
            session: aiohttp session
            page: Page number to scrape
            
        Returns:
            List of job URLs
        """
        # Malt jobs - try simpler URL first
        list_url = f"{self.base_url}/projects"
        
        try:
            logger.info(f"Scraping Malt job list page {page}: {list_url}")
            
            async with session.get(list_url, headers=self.headers) as response:
                if response.status != 200:
                    logger.error(f"Failed to fetch page {page}: HTTP {response.status}")
                    return []
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Extract job URLs - Malt specific structure
                job_links = []
                
                # Option 1: Malt project cards
                job_cards = soup.select('a[href*="/projects/"]')
                for card in job_cards:
                    href = card.get('href')
                    if href and '/projects/' in href and not '/search' in href:
                        full_url = href if href.startswith('http') else f"{self.base_url}{href}"
                        job_links.append(full_url)
                
                # Option 2: Alternative Malt patterns
                if not job_links:
                    alt_patterns = [
                        'a[href*="/project/"]',
                        'a[href*="/mission/"]',
                        '[data-project-id] a',
                        '.project-card a',
                        '.mission-item a'
                    ]
                    for pattern in alt_patterns:
                        alt_cards = soup.select(pattern)
                        for card in alt_cards:
                            href = card.get('href')
                            if href and ('project' in href or 'mission' in href):
                                full_url = href if href.startswith('http') else f"{self.base_url}{href}"
                                job_links.append(full_url)
                        if job_links:  # Stop at first successful pattern
                            break
                
                # Remove duplicates
                job_links = list(set(job_links))
                
                logger.info(f"Found {len(job_links)} job URLs on Malt page {page}")
                return job_links
                
        except Exception as e:
            logger.error(f"Error scraping Malt job list page {page}: {str(e)}")
            return []
    
    async def scrape_job_detail(self, session: aiohttp.ClientSession, job_url: str) -> Optional[JobOffer]:
        """
        Extract detailed information from a Malt project page
        
        Args:
            session: aiohttp session
            job_url: URL of the job offer
            
        Returns:
            JobOffer object or None if failed
        """
        try:
            logger.info(f"Scraping Malt job detail: {job_url}")
            
            # Rate limiting
            await asyncio.sleep(self.delay_between_requests)
            
            async with session.get(job_url, headers=self.headers) as response:
                if response.status != 200:
                    logger.error(f"Failed to fetch Malt job {job_url}: HTTP {response.status}")
                    return None
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Extract job information - Malt specific selectors
                
                # Title
                title = self._extract_title(soup)
                if not title:
                    logger.warning(f"No title found for Malt job {job_url}")
                    return None
                
                # Skills
                skills = self._extract_skills(soup)
                
                # Salary - Malt uses budget ranges
                salary = self._extract_salary(soup)
                
                # Location and remote
                location, is_remote = self._extract_location(soup)
                
                # Description
                description = self._extract_description(soup)
                
                # Company/Client
                company = self._extract_company(soup)
                
                # Experience level
                experience = self._extract_experience(soup)
                
                return JobOffer(
                    source_id=self.source_id,
                    url=job_url,
                    title=title,
                    contract_type=['freelance'],  # Malt is freelance platform
                    required_skills=skills,
                    salary_range=salary,
                    is_remote=is_remote,
                    location=location,
                    description=description,
                    company_name=company,
                    experience_level=experience,
                    last_scraped_at=datetime.now(timezone.utc).isoformat()
                )
                
        except Exception as e:
            logger.error(f"Error scraping Malt job detail {job_url}: {str(e)}")
            return None
    
    def _extract_title(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract job title from Malt soup"""
        selectors = [
            'h1.project-title',
            'h1[data-testid="project-title"]',
            '.project-header h1',
            'h1.mission-title',
            '.title h1',
            'h1'
        ]
        
        for selector in selectors:
            try:
                element = soup.select_one(selector)
                if element and element.get_text(strip=True):
                    return element.get_text(strip=True)
            except:
                continue
        
        return None
    
    def _extract_skills(self, soup: BeautifulSoup) -> List[str]:
        """Extract required skills from Malt soup"""
        skills = []
        
        # Malt specific skill selectors
        skill_selectors = [
            '.skills .skill',
            '.competences .competence',
            '.tags .tag',
            '.skill-tag',
            '[data-testid="skill"]',
            '.badge-skill',
            '.technology'
        ]
        
        for selector in skill_selectors:
            try:
                elements = soup.select(selector)
                for elem in elements:
                    skill = elem.get_text(strip=True)
                    if skill and len(skill) < 50:  # Filter out long descriptions
                        skills.append(skill)
            except:
                continue
        
        # Also extract from text content for common tech skills
        text_skills = self.extract_skills_from_text(soup.get_text())
        skills.extend(text_skills)
        
        # Clean and deduplicate
        skills = [s for s in set(skills) if s and len(s) > 1]
        return skills[:20]  # Limit to 20 skills max
    
    def extract_skills_from_text(self, text: str) -> List[str]:
        """Extract common tech skills from text content"""
        common_skills = [
            'Python', 'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js',
            'PHP', 'Laravel', 'Symfony', 'Django', 'Flask', 'Java', 'Spring', 'Kotlin',
            'Swift', 'Flutter', 'React Native', 'iOS', 'Android', 'Unity', 'C#', 'C++',
            'Go', 'Rust', 'Ruby', 'Rails', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
            'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Jenkins', 'GitLab', 'GitHub',
            'Figma', 'Adobe', 'Photoshop', 'Illustrator', 'InDesign', 'Sketch', 'XD',
            'WordPress', 'Shopify', 'Magento', 'PrestaShop', 'Drupal', 'Joomla',
            'SEO', 'SEM', 'Google Analytics', 'Google Ads', 'Facebook Ads', 'LinkedIn Ads'
        ]
        
        found_skills = []
        text_lower = text.lower()
        
        for skill in common_skills:
            if skill.lower() in text_lower:
                found_skills.append(skill)
        
        return found_skills
    
    def _extract_salary(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract budget/price range from Malt soup"""
        salary_selectors = [
            '.budget',
            '.price-range',
            '.project-budget',
            '.mission-budget',
            '[data-testid="budget"]',
            '.tarif'
        ]
        
        for selector in salary_selectors:
            try:
                element = soup.select_one(selector)
                if element:
                    salary_text = element.get_text(strip=True)
                    # Look for patterns like "1000-5000€" or "500€/jour"
                    if re.search(r'\d+.*€', salary_text):
                        return salary_text
            except:
                continue
        
        # Also search in text content for budget patterns
        text = soup.get_text()
        budget_patterns = [
            r'budget.*?(\d{3,5}[-\s]*\d{3,5}\s*€)',
            r'tarif.*?(\d{2,3}\s*€[/\s]*(?:jour|day|j))',
            r'(\d{3,5}\s*€[/\s]*(?:projet|project))'
        ]
        
        for pattern in budget_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return None
    
    def _extract_location(self, soup: BeautifulSoup) -> tuple[Optional[str], bool]:
        """Extract location and determine if remote for Malt"""
        location_selectors = [
            '.location',
            '.city',
            '.localisation',
            '[data-testid="location"]',
            '.place',
            '.lieu'
        ]
        
        location = None
        is_remote = False
        
        # Extract location
        for selector in location_selectors:
            try:
                element = soup.select_one(selector)
                if element:
                    location = element.get_text(strip=True)
                    break
            except:
                continue
        
        # Check for remote indicators (French specific)
        text_content = soup.get_text().lower()
        remote_keywords = [
            'télétravail', 'remote', 'à distance', 'home office', 
            'full remote', 'distanciel', 'en ligne', 'partout en france'
        ]
        is_remote = any(keyword in text_content for keyword in remote_keywords)
        
        return location, is_remote
    
    def _extract_description(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract project description from Malt"""
        desc_selectors = [
            '.project-description',
            '.mission-description', 
            '.description',
            '.content',
            '[data-testid="description"]',
            '.project-content',
            '.details'
        ]
        
        for selector in desc_selectors:
            try:
                element = soup.select_one(selector)
                if element:
                    desc = element.get_text(strip=True)
                    if len(desc) > 100:  # Ensure it's a substantial description
                        return desc[:2000]  # Limit length
            except:
                continue
        
        return None
    
    def _extract_company(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract client/company name from Malt"""
        company_selectors = [
            '.client-name',
            '.company-name',
            '.entreprise',
            '[data-testid="company"]',
            '.employer',
            '.client'
        ]
        
        for selector in company_selectors:
            try:
                element = soup.select_one(selector)
                if element:
                    return element.get_text(strip=True)
            except:
                continue
        
        return None
    
    def _extract_experience(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract experience level for Malt"""
        text = soup.get_text().lower()
        
        # French specific experience keywords
        if any(word in text for word in ['senior', 'expert', 'lead', '5+ ans', 'expérimenté', 'confirmé']):
            return 'Senior'
        elif any(word in text for word in ['junior', 'débutant', '1-2 ans', 'première expérience', 'novice']):
            return 'Junior'
        elif any(word in text for word in ['intermédiaire', '3-5 ans', 'confirmé']):
            return 'Confirmé'
        
        return None
    
    async def save_to_supabase(self, jobs: List[JobOffer]) -> None:
        """Save job offers to Supabase"""
        if not jobs:
            logger.info("No Malt jobs to save")
            return
        
        try:
            # Convert jobs to dict format for Supabase
            job_data = []
            for job in jobs:
                job_data.append({
                    "source_id": job.source_id,
                    "url": job.url,
                    "title": job.title,
                    "contract_type": job.contract_type,
                    "required_skills": job.required_skills,
                    "salary_range": job.salary_range,
                    "is_remote": job.is_remote,
                    "location": job.location,
                    "description": job.description,
                    "company_name": job.company_name,
                    "experience_level": job.experience_level,
                    "last_scraped_at": job.last_scraped_at
                })
            
            # Batch insert with upsert (on conflict update)
            response = self.supabase.table("jobnexai_external_jobs").upsert(
                job_data,
                on_conflict="url"
            ).execute()
            
            if response.data:
                logger.info(f"Successfully saved {len(response.data)} Malt jobs to Supabase")
            else:
                logger.error(f"Failed to save Malt jobs: {response}")
                
        except Exception as e:
            logger.error(f"Error saving Malt jobs to Supabase: {str(e)}")
    
    async def run_scraping(self, max_pages: int = 3) -> None:
        """
        Main scraping method for Malt
        
        Args:
            max_pages: Maximum number of pages to scrape
        """
        logger.info(f"Starting Malt scraping (max {max_pages} pages)")
        
        # Fetch source_id from database first
        if not self.source_id:
            self.source_id = await self.get_source_id()
            logger.info(f"Using Malt source_id: {self.source_id}")
        
        async with aiohttp.ClientSession() as session:
            all_jobs = []
            
            # Scrape job list pages
            for page in range(1, max_pages + 1):
                job_urls = await self.scrape_job_list(session, page)
                
                if not job_urls:
                    logger.info(f"No more Malt jobs found on page {page}, stopping")
                    break
                
                # Scrape individual job details
                for url in job_urls:
                    job = await self.scrape_job_detail(session, url)
                    if job:
                        all_jobs.append(job)
                
                logger.info(f"Malt page {page} completed: {len(job_urls)} URLs processed")
            
            # Remove duplicates by URL before saving
            if all_jobs:
                # Deduplicate by URL
                unique_jobs = []
                seen_urls = set()
                for job in all_jobs:
                    if job.url not in seen_urls:
                        unique_jobs.append(job)
                        seen_urls.add(job.url)
                
                logger.info(f"Saving {len(unique_jobs)} unique Malt jobs to Supabase (removed {len(all_jobs) - len(unique_jobs)} duplicates)")
                await self.save_to_supabase(unique_jobs)
                logger.info(f"Malt scraping completed: {len(all_jobs)} jobs total")
            else:
                logger.warning("No Malt jobs were successfully scraped")

# Main execution
async def main():
    """Main execution function for Malt scraper"""
    scraper = MaltScraper()
    await scraper.run_scraping(max_pages=2)  # Start with 2 pages for testing

if __name__ == "__main__":
    asyncio.run(main())

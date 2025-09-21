#!/usr/bin/env python3
"""
Free-Work Scraper for JobNexAI
================================

Scraper professionnel pour extraire les offres de Free-Work.com
Compatible avec l'architecture JobNexAI existante.

Author: JobNexAI Team
Date: 2025-09-21
"""

import asyncio
import aiohttp
import re
from datetime import datetime, timezone
from typing import List, Dict, Optional
from dataclasses import dataclass
from bs4 import BeautifulSoup
import logging
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class JobOffer:
    """Structure d'une offre d'emploi Free-Work"""
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

class FreeWorkScraper:
    """Scraper Free-Work optimisé pour JobNexAI"""
    
    def __init__(self):
        """Initialize scraper with Supabase connection"""
        self.base_url = "https://www.free-work.com"
        self.source_key = "free-work"
        self.source_id = None  # Will be fetched from database
        
        # Supabase connection
        self.supabase: Client = create_client(
            os.getenv("VITE_SUPABASE_URL", ""),
            os.getenv("VITE_SUPABASE_ANON_KEY", "")
        )
        
        # Headers to avoid blocking
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        # Rate limiting
        self.delay_between_requests = 2.0  # seconds
        
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
        Extract job URLs from Free-Work listing page
        
        Args:
            session: aiohttp session
            page: Page number to scrape
            
        Returns:
            List of job URLs
        """
        # Free-Work jobs are in the /jobs section
        list_url = f"{self.base_url}/fr/tech-it/jobs?page={page}"
        
        try:
            logger.info(f"Scraping job list page {page}: {list_url}")
            
            async with session.get(list_url, headers=self.headers) as response:
                if response.status != 200:
                    logger.error(f"Failed to fetch page {page}: HTTP {response.status}")
                    return []
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Extract job URLs - Free-Work modern structure
                job_links = []
                
                # Option 1: Modern Free-Work job links
                job_cards = soup.select('a[href*="/fr/tech-it/jobs/"]')
                for card in job_cards:
                    href = card.get('href')
                    if href and '/jobs/' in href:
                        full_url = href if href.startswith('http') else f"{self.base_url}{href}"
                        job_links.append(full_url)
                
                # Option 2: Alternative patterns for Free-Work
                if not job_links:
                    alt_patterns = [
                        'a[href*="/job/"]',
                        'a[href*="/mission/"]',
                        '[data-job-id] a',
                        '.job-item a',
                        '.mission-card a'
                    ]
                    for pattern in alt_patterns:
                        alt_cards = soup.select(pattern)
                        for card in alt_cards:
                            href = card.get('href')
                            if href and ('job' in href or 'mission' in href):
                                full_url = href if href.startswith('http') else f"{self.base_url}{href}"
                                job_links.append(full_url)
                        if job_links:  # Stop at first successful pattern
                            break
                
                # Remove duplicates
                job_links = list(set(job_links))
                
                logger.info(f"Found {len(job_links)} job URLs on page {page}")
                return job_links
                
        except Exception as e:
            logger.error(f"Error scraping job list page {page}: {str(e)}")
            return []
    
    async def scrape_job_detail(self, session: aiohttp.ClientSession, job_url: str) -> Optional[JobOffer]:
        """
        Extract detailed information from a job offer page
        
        Args:
            session: aiohttp session
            job_url: URL of the job offer
            
        Returns:
            JobOffer object or None if failed
        """
        try:
            logger.info(f"Scraping job detail: {job_url}")
            
            # Rate limiting
            await asyncio.sleep(self.delay_between_requests)
            
            async with session.get(job_url, headers=self.headers) as response:
                if response.status != 200:
                    logger.error(f"Failed to fetch job {job_url}: HTTP {response.status}")
                    return None
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Extract job information - adapt selectors based on actual HTML
                
                # Title
                title = self._extract_title(soup)
                if not title:
                    logger.warning(f"No title found for {job_url}")
                    return None
                
                # Skills
                skills = self._extract_skills(soup)
                
                # Salary
                salary = self._extract_salary(soup)
                
                # Location and remote
                location, is_remote = self._extract_location(soup)
                
                # Description
                description = self._extract_description(soup)
                
                # Company
                company = self._extract_company(soup)
                
                # Experience level
                experience = self._extract_experience(soup)
                
                return JobOffer(
                    source_id=self.source_id,
                    url=job_url,
                    title=title,
                    contract_type=['mission'],  # Free-Work is primarily freelance missions
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
            logger.error(f"Error scraping job detail {job_url}: {str(e)}")
            return None
    
    def _extract_title(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract job title from soup"""
        selectors = [
            'h1.job-title',
            'h1[data-testid="job-title"]',
            '.offer-title h1',
            'h1:contains("Développeur")',
            'h1:contains("Consultant")',
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
        """Extract required skills from soup"""
        skills = []
        
        # Common selectors for skills
        skill_selectors = [
            '.skills .tag',
            '.technologies span',
            '.skill-tag',
            '[data-testid="skill"]',
            '.tags span',
            '.badge'
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
        
        # Clean and deduplicate
        skills = [s for s in set(skills) if s and len(s) > 1]
        return skills[:20]  # Limit to 20 skills max
    
    def _extract_salary(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract salary range from soup"""
        salary_selectors = [
            '.salary',
            '.price',
            '.remuneration',
            '[data-testid="salary"]'
        ]
        
        for selector in salary_selectors:
            try:
                element = soup.select_one(selector)
                if element:
                    salary_text = element.get_text(strip=True)
                    # Look for patterns like "400-600€/jour" or "45-55K€"
                    if re.search(r'\d+.*€', salary_text):
                        return salary_text
            except:
                continue
        
        # Also search in text content for salary patterns
        text = soup.get_text()
        salary_pattern = re.search(r'(\d{2,3}[-\s]*\d{2,3}\s*€[/\s]*(?:jour|day|j))', text, re.IGNORECASE)
        if salary_pattern:
            return salary_pattern.group(1).strip()
        
        return None
    
    def _extract_location(self, soup: BeautifulSoup) -> tuple[Optional[str], bool]:
        """Extract location and determine if remote"""
        location_selectors = [
            '.location',
            '.city',
            '[data-testid="location"]',
            '.place'
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
        
        # Check for remote indicators
        text_content = soup.get_text().lower()
        remote_keywords = ['télétravail', 'remote', 'à distance', 'home office', 'full remote']
        is_remote = any(keyword in text_content for keyword in remote_keywords)
        
        return location, is_remote
    
    def _extract_description(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract job description"""
        desc_selectors = [
            '.job-description',
            '.description',
            '.content',
            '[data-testid="description"]',
            '.offer-content'
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
        """Extract company name"""
        company_selectors = [
            '.company-name',
            '.client',
            '[data-testid="company"]',
            '.employer'
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
        """Extract experience level"""
        text = soup.get_text().lower()
        
        if any(word in text for word in ['senior', 'expert', 'lead', '5+ ans', 'expérimenté']):
            return 'Senior'
        elif any(word in text for word in ['junior', 'débutant', '1-2 ans', 'première expérience']):
            return 'Junior'
        elif any(word in text for word in ['confirmé', '3-5 ans', 'intermédiaire']):
            return 'Confirmé'
        
        return None
    
    async def save_to_supabase(self, jobs: List[JobOffer]) -> None:
        """Save job offers to Supabase"""
        if not jobs:
            logger.info("No jobs to save")
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
                logger.info(f"Successfully saved {len(response.data)} jobs to Supabase")
            else:
                logger.error(f"Failed to save jobs: {response}")
                
        except Exception as e:
            logger.error(f"Error saving to Supabase: {str(e)}")
    
    async def run_scraping(self, max_pages: int = 5) -> None:
        """
        Main scraping method
        
        Args:
            max_pages: Maximum number of pages to scrape
        """
        logger.info(f"Starting Free-Work scraping (max {max_pages} pages)")
        
        # Fetch source_id from database first
        if not self.source_id:
            self.source_id = await self.get_source_id()
            logger.info(f"Using source_id: {self.source_id}")
        
        async with aiohttp.ClientSession() as session:
            all_jobs = []
            
            # Scrape job list pages
            for page in range(1, max_pages + 1):
                job_urls = await self.scrape_job_list(session, page)
                
                if not job_urls:
                    logger.info(f"No more jobs found on page {page}, stopping")
                    break
                
                # Scrape individual job details
                for url in job_urls:
                    job = await self.scrape_job_detail(session, url)
                    if job:
                        all_jobs.append(job)
                
                logger.info(f"Page {page} completed: {len(job_urls)} URLs processed")
            
            # Save all jobs to Supabase
            if all_jobs:
                await self.save_to_supabase(all_jobs)
                logger.info(f"Scraping completed: {len(all_jobs)} jobs total")
            else:
                logger.warning("No jobs were successfully scraped")

# Main execution
async def main():
    """Main execution function"""
    scraper = FreeWorkScraper()
    await scraper.run_scraping(max_pages=3)  # Start with 3 pages for testing

if __name__ == "__main__":
    asyncio.run(main())

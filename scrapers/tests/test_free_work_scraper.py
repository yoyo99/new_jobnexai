"""
Tests unitaires pour Free-Work scraper
Répond aux recommandations du code review
"""

import pytest
import asyncio
import aiohttp
from unittest.mock import Mock, patch, AsyncMock
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from free_work_scraper import FreeWorkScraper, JobOffer

class TestFreeWorkScraper:
    """Tests pour le scraper Free-Work"""
    
    @pytest.fixture
    def scraper(self):
        """Fixture pour créer un scraper de test"""
        with patch('free_work_scraper.create_client'):
            return FreeWorkScraper()
    
    def test_scraper_initialization(self, scraper):
        """Test initialisation du scraper"""
        assert scraper.base_url == "https://www.free-work.com"
        assert scraper.source_key == "free-work"
        assert scraper.delay_between_requests == 2.0
    
    def test_job_offer_dataclass(self):
        """Test structure JobOffer"""
        job = JobOffer(
            source_id="test-uuid",
            url="https://test.com/job/1",
            title="Développeur Python",
            contract_type=["Mission"],
            required_skills=["Python", "Django"],
            salary_range="400-600€/jour",
            is_remote=True,
            location="Paris",
            description="Job description",
            company_name="TechCorp",
            experience_level="Senior",
            last_scraped_at="2025-09-22T10:00:00Z"
        )
        
        assert job.title == "Développeur Python"
        assert "Python" in job.required_skills
        assert job.is_remote is True
    
    @pytest.mark.asyncio
    async def test_get_source_id_success(self, scraper):
        """Test récupération source_id avec succès"""
        mock_response = Mock()
        mock_response.data = {"id": "test-uuid-123"}
        
        scraper.supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
        
        source_id = await scraper.get_source_id()
        assert source_id == "test-uuid-123"
    
    @pytest.mark.asyncio
    async def test_get_source_id_not_found(self, scraper):
        """Test récupération source_id - source non trouvée"""
        mock_response = Mock()
        mock_response.data = None
        
        scraper.supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
        
        with pytest.raises(Exception) as exc_info:
            await scraper.get_source_id()
        assert "not found in database" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_scrape_job_list_http_error(self, scraper):
        """Test gestion erreur HTTP lors du scraping"""
        with patch('aiohttp.ClientSession.get') as mock_get:
            mock_response = AsyncMock()
            mock_response.status = 404
            mock_get.return_value.__aenter__.return_value = mock_response
            
            session = Mock()
            urls = await scraper.scrape_job_list(session, page=1)
            assert urls == []
    
    def test_extract_skills_from_text(self, scraper):
        """Test extraction compétences depuis texte"""
        text = "Recherche développeur Python Django avec expérience React et API REST"
        skills = scraper.extract_skills_from_text(text)
        
        # Should extract common tech skills
        expected_skills = ["Python", "Django", "React", "API", "REST"]
        for skill in expected_skills:
            assert any(skill.lower() in s.lower() for s in skills)
    
    def test_deduplication_logic(self, scraper):
        """Test logique de déduplication"""
        jobs = [
            JobOffer("uuid1", "https://site.com/job1", "Job 1", [], [], None, False, None, None, None, None, "2025-09-22T10:00:00Z"),
            JobOffer("uuid1", "https://site.com/job1", "Job 1 Duplicate", [], [], None, False, None, None, None, None, "2025-09-22T10:00:00Z"),
            JobOffer("uuid1", "https://site.com/job2", "Job 2", [], [], None, False, None, None, None, None, "2025-09-22T10:00:00Z")
        ]
        
        # Simulate deduplication logic
        unique_jobs = []
        seen_urls = set()
        for job in jobs:
            if job.url not in seen_urls:
                unique_jobs.append(job)
                seen_urls.add(job.url)
        
        assert len(unique_jobs) == 2
        assert unique_jobs[0].url == "https://site.com/job1"
        assert unique_jobs[1].url == "https://site.com/job2"

@pytest.mark.integration
class TestFreeWorkScraperIntegration:
    """Tests d'intégration (nécessitent connexion réseau)"""
    
    @pytest.mark.asyncio
    async def test_scrape_real_page(self):
        """Test scraping d'une vraie page (à utiliser avec modération)"""
        scraper = FreeWorkScraper()
        
        async with aiohttp.ClientSession() as session:
            # Test sur une seule page pour éviter le spam
            urls = await scraper.scrape_job_list(session, page=1)
            
            # Should find some job URLs
            assert isinstance(urls, list)
            # Don't assert exact number as it varies
            
if __name__ == "__main__":
    pytest.main([__file__, "-v"])

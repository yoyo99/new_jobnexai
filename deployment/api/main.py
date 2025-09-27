from fastapi import FastAPI, BackgroundTasks, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import redis
import json
import httpx
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, List
import hashlib

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="JobNexAI Scraping API", 
    version="1.0.0",
    description="API de scraping intelligent pour JobNexAI avec cache Redis et files d'attente"
)

# CORS pour ton frontend Netlify
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://jobnexai-windsurf.netlify.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis connection avec retry
def get_redis_connection():
    try:
        return redis.Redis(
            host="redis", 
            port=6379, 
            password="JobNexAI_Redis_2025!",
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True
        )
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        return None

redis_conn = get_redis_connection()

# Configuration des 5 scrapers prioritaires
PRIORITY_SCRAPERS = {
    "free-work": {
        "name": "Free-Work",
        "description": "Plateforme freelance française #1",
        "cache_ttl": 3600,  # 1h
        "max_concurrent": 2,
        "webhook": "scrape-freework",
        "difficulty": "medium"
    },
    "malt": {
        "name": "Malt", 
        "description": "Plateforme freelance française #2",
        "cache_ttl": 3600,  # 1h
        "max_concurrent": 2,
        "webhook": "scrape-malt",
        "difficulty": "medium"
    },
    "linkedin": {
        "name": "LinkedIn Jobs",
        "description": "Réseau professionnel mondial",
        "cache_ttl": 7200,  # 2h (plus stable)
        "max_concurrent": 1,  # Rate limit strict
        "webhook": "scrape-linkedin",
        "difficulty": "hard"
    },
    "indeed": {
        "name": "Indeed",
        "description": "Agrégateur d'offres d'emploi",
        "cache_ttl": 1800,  # 30min (très dynamique)
        "max_concurrent": 3,
        "webhook": "scrape-indeed",
        "difficulty": "easy"
    },
    "wttj": {
        "name": "Welcome to the Jungle",
        "description": "Startup et tech français",
        "cache_ttl": 3600,  # 1h
        "max_concurrent": 2,
        "webhook": "scrape-wttj",
        "difficulty": "medium"
    }
}

# Models Pydantic
class ScrapeRequest(BaseModel):
    query: str
    location: str = "France"
    user_email: Optional[str] = None
    max_results: int = 50

class ScrapeResponse(BaseModel):
    status: str
    job_id: Optional[str] = None
    scraper: str
    message: str
    estimated_time: Optional[str] = None
    jobs_count: int = 0

@app.get("/")
async def root():
    redis_status = "connected" if redis_conn and redis_conn.ping() else "disconnected"
    
    return {
        "service": "JobNexAI Scraping API",
        "version": "1.0.0",
        "scrapers_available": len(PRIORITY_SCRAPERS),
        "redis_status": redis_status,
        "status": "ready",
        "endpoints": {
            "scrape": "POST /scrape/{scraper_id}",
            "status": "GET /status/{job_id}",
            "scrapers": "GET /scrapers",
            "websocket": "WS /ws/{job_id}"
        }
    }

@app.get("/scrapers")
async def list_scrapers():
    """Liste tous les scrapers disponibles avec leurs caractéristiques"""
    return {
        "scrapers": PRIORITY_SCRAPERS,
        "total": len(PRIORITY_SCRAPERS),
        "categories": {
            "freelance": ["free-work", "malt"],
            "cdi_cdd": ["linkedin", "indeed", "wttj"],
            "difficulty": {
                "easy": [k for k, v in PRIORITY_SCRAPERS.items() if v["difficulty"] == "easy"],
                "medium": [k for k, v in PRIORITY_SCRAPERS.items() if v["difficulty"] == "medium"], 
                "hard": [k for k, v in PRIORITY_SCRAPERS.items() if v["difficulty"] == "hard"]
            }
        }
    }

@app.post("/scrape/{scraper_id}")
async def trigger_scraping(scraper_id: str, request: ScrapeRequest):
    """Déclenche le scraping pour un site donné avec cache intelligent"""
    
    if scraper_id not in PRIORITY_SCRAPERS:
        raise HTTPException(
            status_code=404, 
            detail=f"Scraper '{scraper_id}' not available. Available: {list(PRIORITY_SCRAPERS.keys())}"
        )
    
    scraper = PRIORITY_SCRAPERS[scraper_id]
    
    # Génération clé cache
    cache_key = f"scrape:{scraper_id}:{hashlib.md5(f'{request.query}_{request.location}'.encode()).hexdigest()}"
    
    # Vérifier cache Redis
    if redis_conn:
        try:
            cached_result = redis_conn.get(cache_key)
            if cached_result:
                data = json.loads(cached_result)
                logger.info(f"Cache hit for {scraper_id}: {request.query}")
                return ScrapeResponse(
                    status="cached",
                    scraper=scraper["name"],
                    message=f"Résultats en cache (mis à jour: {data.get('cached_at', 'unknown')})",
                    jobs_count=len(data.get("jobs", [])),
                    **data
                )
        except Exception as e:
            logger.error(f"Cache check failed: {e}")
    
    # Vérifier file d'attente
    queue_key = f"queue:{scraper_id}"
    active_jobs = 0
    
    if redis_conn:
        try:
            active_jobs = redis_conn.llen(queue_key)
        except Exception as e:
            logger.error(f"Queue check failed: {e}")
    
    if active_jobs >= scraper["max_concurrent"]:
        return ScrapeResponse(
            status="queue_full",
            scraper=scraper["name"],
            message=f"Maximum {scraper['max_concurrent']} jobs actifs pour {scraper['name']}. Position en attente: {active_jobs + 1}",
            estimated_time=f"{(active_jobs + 1) * 30} secondes"
        )
    
    # Générer job ID unique
    job_id = f"job_{scraper_id}_{int(datetime.now().timestamp())}"
    
    # Déclencher N8N webhook
    try:
        timeout_config = httpx.Timeout(10.0, connect=5.0)
        async with httpx.AsyncClient(timeout=timeout_config) as client:
            n8n_response = await client.post(
                f"http://n8n:5678/webhook/{scraper['webhook']}",
                json={
                    "job_id": job_id,
                    "query": request.query,
                    "location": request.location,
                    "max_results": request.max_results,
                    "cache_key": cache_key,
                    "cache_ttl": scraper["cache_ttl"],
                    "user_email": request.user_email,
                    "callback_url": f"http://scraping-api:8000/webhook/job-complete",
                    "timestamp": datetime.now().isoformat()
                }
            )
        
        # Ajouter à la file d'attente Redis
        if redis_conn:
            try:
                redis_conn.lpush(queue_key, job_id)
                redis_conn.expire(queue_key, 600)  # 10min TTL
                
                # Stocker metadata du job
                job_data = {
                    "scraper_id": scraper_id,
                    "query": request.query,
                    "location": request.location,
                    "status": "started",
                    "created_at": datetime.now().isoformat()
                }
                redis_conn.setex(f"job:{job_id}", 3600, json.dumps(job_data))
                
            except Exception as e:
                logger.error(f"Queue update failed: {e}")
        
        logger.info(f"Started scraping job {job_id} for {scraper_id}")
        
        return ScrapeResponse(
            status="started",
            job_id=job_id,
            scraper=scraper["name"],
            message=f"Scraping démarré pour {scraper['name']}",
            estimated_time="30-60 secondes"
        )
        
    except httpx.TimeoutException:
        logger.error(f"N8N webhook timeout for {scraper_id}")
        raise HTTPException(status_code=503, detail="Service temporairement indisponible")
        
    except Exception as e:
        logger.error(f"Scraping trigger failed: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")

@app.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """Récupère le statut d'un job de scraping"""
    
    if not redis_conn:
        raise HTTPException(status_code=503, detail="Cache service unavailable")
    
    try:
        # Vérifier si job terminé
        result_key = f"result:{job_id}"
        result = redis_conn.get(result_key)
        
        if result:
            return json.loads(result)
        
        # Vérifier métadonnées du job
        job_data = redis_conn.get(f"job:{job_id}")
        if job_data:
            job_info = json.loads(job_data)
            
            # Vérifier position dans queue
            scraper_id = job_info.get("scraper_id")
            if scraper_id:
                queue_key = f"queue:{scraper_id}"
                try:
                    position = redis_conn.lpos(queue_key, job_id)
                    if position is not None:
                        return {
                            "status": "queued",
                            "job_id": job_id,
                            "position": position + 1,
                            "estimated_wait": f"{position * 30} secondes",
                            **job_info
                        }
                except:
                    pass
            
            return {
                "status": "processing",
                "job_id": job_id,
                "message": "Scraping en cours...",
                **job_info
            }
        
        return {
            "status": "not_found",
            "job_id": job_id,
            "message": "Job non trouvé ou expiré"
        }
        
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la vérification du statut")

@app.post("/webhook/job-complete")
async def job_complete_webhook(data: dict):
    """Webhook appelé par N8N quand un job est terminé"""
    
    job_id = data.get("job_id")
    status = data.get("status", "completed")
    jobs_data = data.get("jobs", [])
    
    if not job_id:
        raise HTTPException(status_code=400, detail="job_id requis")
    
    if redis_conn:
        try:
            # Stocker le résultat
            result = {
                "status": status,
                "job_id": job_id,
                "completed_at": datetime.now().isoformat(),
                "jobs_count": len(jobs_data),
                "jobs": jobs_data
            }
            
            # Stocker résultat (TTL 1h)
            redis_conn.setex(f"result:{job_id}", 3600, json.dumps(result))
            
            # Supprimer de la queue
            job_data = redis_conn.get(f"job:{job_id}")
            if job_data:
                job_info = json.loads(job_data)
                scraper_id = job_info.get("scraper_id")
                if scraper_id:
                    redis_conn.lrem(f"queue:{scraper_id}", 1, job_id)
            
            # Cacher les résultats si demandé
            cache_key = data.get("cache_key")
            if cache_key and len(jobs_data) > 0:
                cache_data = {
                    "jobs": jobs_data,
                    "cached_at": datetime.now().isoformat(),
                    "jobs_count": len(jobs_data)
                }
                cache_ttl = data.get("cache_ttl", 3600)
                redis_conn.setex(cache_key, cache_ttl, json.dumps(cache_data))
            
            logger.info(f"Job {job_id} completed with {len(jobs_data)} results")
            
        except Exception as e:
            logger.error(f"Job completion handling failed: {e}")
    
    return {"status": "acknowledged"}

# WebSocket pour updates temps réel
@app.websocket("/ws/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    """WebSocket pour suivre l'évolution d'un job en temps réel"""
    await websocket.accept()
    
    try:
        # Polling du status toutes les 2s
        while True:
            try:
                status_response = await get_job_status(job_id)
                await websocket.send_text(json.dumps(status_response))
                
                if status_response.get("status") in ["completed", "failed", "not_found"]:
                    break
                    
                await asyncio.sleep(2)
                
            except Exception as e:
                await websocket.send_text(json.dumps({
                    "status": "error", 
                    "message": str(e),
                    "job_id": job_id
                }))
                break
                
    except Exception as e:
        logger.error(f"WebSocket error for job {job_id}: {e}")
    finally:
        try:
            await websocket.close()
        except:
            pass

@app.get("/health")
async def health_check():
    """Health check pour monitoring"""
    redis_status = False
    if redis_conn:
        try:
            redis_status = redis_conn.ping()
        except:
            pass
    
    return {
        "status": "healthy" if redis_status else "degraded",
        "redis": "ok" if redis_status else "error",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

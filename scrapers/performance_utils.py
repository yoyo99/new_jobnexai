"""
Utilitaires de performance pour les scrapers
Répond aux recommandations du code review
"""

import functools
import time
import logging
from typing import Any, Callable, Dict, Optional
import hashlib
import json

logger = logging.getLogger(__name__)

class SimpleCache:
    """Cache simple en mémoire avec expiration"""
    
    def __init__(self, default_ttl: int = 3600):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl
    
    def _generate_key(self, func_name: str, *args, **kwargs) -> str:
        """Génère clé de cache basée sur fonction et paramètres"""
        key_data = {
            'func': func_name,
            'args': args,
            'kwargs': sorted(kwargs.items())
        }
        key_str = json.dumps(key_data, sort_keys=True, default=str)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Any]:
        """Récupère valeur du cache si non expirée"""
        if key in self.cache:
            entry = self.cache[key]
            if time.time() < entry['expires']:
                logger.debug(f"Cache HIT: {key}")
                return entry['value']
            else:
                del self.cache[key]
                logger.debug(f"Cache EXPIRED: {key}")
        
        logger.debug(f"Cache MISS: {key}")
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Stocke valeur dans le cache"""
        ttl = ttl or self.default_ttl
        self.cache[key] = {
            'value': value,
            'expires': time.time() + ttl
        }
        logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
    
    def clear(self) -> None:
        """Vide le cache"""
        self.cache.clear()
        logger.info("Cache cleared")

# Instance globale de cache
scraper_cache = SimpleCache(default_ttl=1800)  # 30 minutes

def cached(ttl: int = 1800):
    """Décorateur pour mettre en cache les résultats de fonctions"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Génère clé de cache
            cache_key = scraper_cache._generate_key(func.__name__, *args, **kwargs)
            
            # Cherche en cache
            cached_result = scraper_cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Exécute fonction et cache le résultat
            result = func(*args, **kwargs)
            scraper_cache.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator

def timed(func: Callable) -> Callable:
    """Décorateur pour mesurer le temps d'exécution"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        execution_time = time.time() - start_time
        
        logger.info(f"{func.__name__} executed in {execution_time:.2f}s")
        return result
    return wrapper

async def timed_async(func: Callable) -> Callable:
    """Décorateur pour mesurer le temps d'exécution des fonctions async"""
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        result = await func(*args, **kwargs)
        execution_time = time.time() - start_time
        
        logger.info(f"{func.__name__} executed in {execution_time:.2f}s")
        return result
    return wrapper

class BatchProcessor:
    """Processeur de batch pour optimiser les insertions DB"""
    
    def __init__(self, batch_size: int = 50):
        self.batch_size = batch_size
        self.batch = []
    
    def add(self, item: Any) -> None:
        """Ajoute item au batch"""
        self.batch.append(item)
        
        if len(self.batch) >= self.batch_size:
            self.flush()
    
    def flush(self) -> list:
        """Force le traitement du batch actuel"""
        if not self.batch:
            return []
        
        current_batch = self.batch.copy()
        self.batch.clear()
        
        logger.info(f"Processing batch of {len(current_batch)} items")
        return current_batch
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.flush()

def retry_on_failure(max_retries: int = 3, delay: float = 1.0):
    """Décorateur pour retry automatique en cas d'échec"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries:
                        logger.warning(f"{func.__name__} failed (attempt {attempt + 1}/{max_retries + 1}): {e}")
                        await asyncio.sleep(delay * (2 ** attempt))  # Exponential backoff
                    else:
                        logger.error(f"{func.__name__} failed after {max_retries + 1} attempts")
            
            raise last_exception
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries:
                        logger.warning(f"{func.__name__} failed (attempt {attempt + 1}/{max_retries + 1}): {e}")
                        time.sleep(delay * (2 ** attempt))
                    else:
                        logger.error(f"{func.__name__} failed after {max_retries + 1} attempts")
            
            raise last_exception
        
        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

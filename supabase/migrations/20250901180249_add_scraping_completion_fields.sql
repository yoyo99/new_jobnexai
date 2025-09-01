ALTER TABLE public.scraped_jobs
ADD COLUMN freshness_score numeric;

ALTER TABLE public.scraping_sessions
ADD COLUMN completed_at timestamp with time zone;

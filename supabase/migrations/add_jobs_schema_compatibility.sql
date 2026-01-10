-- Add missing fields to jobs table for scraping system compatibility
-- and add traceability between job_raw and jobs

-- Add experience_level field for taxonomy support
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_level TEXT 
CHECK (experience_level IN ('junior', 'mid', 'senior', 'not_specified'));

-- Add source tracking for scraped jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source_job_id TEXT; -- Original ID from source platform
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMP WITH TIME ZONE; -- When this job was scraped

-- Add deduplication tracking
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deduplication_hash TEXT; -- Hash for duplicate detection
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT false;

-- Add traceability to raw data
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_raw_id UUID REFERENCES job_raw(id); -- Link to original raw data

-- Create indexes for deduplication performance
CREATE INDEX IF NOT EXISTS idx_jobs_deduplication_hash ON jobs(deduplication_hash);
CREATE INDEX IF NOT EXISTS idx_jobs_title_company_location ON jobs(title, company, location);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at);
CREATE INDEX IF NOT EXISTS idx_jobs_scraped_at ON jobs(scraped_at);

-- Create composite index for common search patterns
CREATE INDEX IF NOT EXISTS idx_jobs_search_composite ON jobs(experience_level, job_type, posted_at DESC);

-- Function to generate deduplication hash for jobs table
CREATE OR REPLACE FUNCTION generate_jobs_deduplication_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deduplication_hash = generate_deduplication_hash(
        NEW.title,
        NEW.company,
        NEW.location
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate deduplication hash for new/updated jobs
CREATE TRIGGER set_jobs_deduplication_hash 
    BEFORE INSERT OR UPDATE ON jobs 
    FOR EACH ROW EXECUTE FUNCTION generate_jobs_deduplication_hash();

-- Update existing jobs to have deduplication hashes
UPDATE jobs SET deduplication_hash = generate_deduplication_hash(title, company, location) 
WHERE deduplication_hash IS NULL;

-- Add traceability column to job_raw table
ALTER TABLE job_raw ADD COLUMN IF NOT EXISTS merged_to_job_id UUID REFERENCES jobs(id);

-- Create index for job_raw to jobs traceability
CREATE INDEX IF NOT EXISTS idx_job_raw_merged_to_job_id ON job_raw(merged_to_job_id);

-- Function to link job_raw to jobs after deduplication
CREATE OR REPLACE FUNCTION link_raw_to_job(
    p_raw_id UUID,
    p_job_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE job_raw 
    SET merged_to_job_id = p_job_id,
        processing_status = 'merged',
        processed_at = NOW()
    WHERE id = p_raw_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- View for scraping audit trail
CREATE OR REPLACE VIEW scraping_audit_trail AS
SELECT 
    jr.id as raw_id,
    jr.scraping_session_id,
    jr.source_job_id as raw_source_id,
    jr.title_normalized,
    jr.company_normalized,
    jr.location_normalized,
    jr.deduplication_hash as raw_hash,
    jr.processing_status,
    j.id as job_id,
    j.source_job_id as final_source_id,
    j.title,
    j.company,
    j.location,
    j.deduplication_hash as job_hash,
    j.experience_level,
    j.posted_at,
    j.scraped_at,
    ss.user_id,
    ss.started_at as session_started_at
FROM job_raw jr
LEFT JOIN jobs j ON jr.merged_to_job_id = j.id
LEFT JOIN scraping_sessions ss ON jr.scraping_session_id = ss.id
ORDER BY jr.scraped_at DESC;

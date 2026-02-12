/*
  # Extend existing scraping system for advanced n8n integration
  
  This migration extends the existing job_sources and jobs tables
  and adds new tables for session tracking, raw data handling, and metrics.
  
  Changes:
  - Extend jobs table with experience_level, deduplication fields, and traceability
  - Add scraping_sessions table for session tracking
  - Add job_raw table for temporary raw data storage
  - Add scraping_metrics table for performance tracking
  - Add indexes and functions for deduplication
*/

-- Extend existing jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_level TEXT 
CHECK (experience_level IN ('junior', 'mid', 'senior', 'not_specified'));

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source_job_id TEXT; -- Original ID from source platform
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMP WITH TIME ZONE; -- When this job was scraped
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deduplication_hash TEXT; -- Hash for duplicate detection
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_raw_id UUID; -- Will reference job_raw when implemented

-- Create indexes for jobs table extensions
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_deduplication_hash ON jobs(deduplication_hash);
CREATE INDEX IF NOT EXISTS idx_jobs_scraped_at ON jobs(scraped_at);
CREATE INDEX IF NOT EXISTS idx_jobs_title_company_location ON jobs(title, company, location);

-- Create scraping sessions table
CREATE TABLE IF NOT EXISTS scraping_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    search_criteria JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_sources INTEGER DEFAULT 0,
    successful_sources INTEGER DEFAULT 0,
    failed_sources INTEGER DEFAULT 0,
    jobs_found INTEGER DEFAULT 0,
    jobs_deduplicated INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    trigger_to_webhook_ms INTEGER,
    webhook_to_completion_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for scraping_sessions
CREATE INDEX IF NOT EXISTS idx_scraping_sessions_user_id ON scraping_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_scraping_sessions_status ON scraping_sessions(status);
CREATE INDEX IF NOT EXISTS idx_scraping_sessions_started_at ON scraping_sessions(started_at);

-- Create job_raw table for temporary data storage
CREATE TABLE IF NOT EXISTS job_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scraping_session_id UUID REFERENCES scraping_sessions(id) ON DELETE CASCADE,
    source_id UUID REFERENCES job_sources(id),
    
    -- Raw data from source
    raw_data JSONB NOT NULL,
    source_job_id TEXT,
    source_url TEXT,
    
    -- Extracted/normalized fields
    title_normalized TEXT,
    company_normalized TEXT,
    location_normalized TEXT,
    description_hash TEXT,
    
    -- Deduplication fields
    deduplication_hash TEXT NOT NULL,
    similarity_group_id UUID,
    is_duplicate BOOLEAN DEFAULT false,
    duplicate_of_id UUID REFERENCES job_raw(id),
    
    -- Processing status
    processing_status TEXT DEFAULT 'raw' CHECK (processing_status IN ('raw', 'processed', 'deduplicated', 'merged', 'rejected')),
    processing_errors JSONB DEFAULT '[]'::jsonb,
    
    -- Traceability
    merged_to_job_id UUID REFERENCES jobs(id),
    
    -- Timestamps
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for job_raw
CREATE INDEX IF NOT EXISTS idx_job_raw_session_id ON job_raw(scraping_session_id);
CREATE INDEX IF NOT EXISTS idx_job_raw_source_id ON job_raw(source_id);
CREATE INDEX IF NOT EXISTS idx_job_raw_deduplication_hash ON job_raw(deduplication_hash);
CREATE INDEX IF NOT EXISTS idx_job_raw_merged_to_job_id ON job_raw(merged_to_job_id);

-- Create scraping metrics table
CREATE TABLE IF NOT EXISTS scraping_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scraping_session_id UUID REFERENCES scraping_sessions(id) ON DELETE CASCADE,
    source_id UUID REFERENCES job_sources(id),
    
    -- Timing metrics
    source_trigger_ms INTEGER,
    source_response_ms INTEGER,
    source_complete_ms INTEGER,
    
    -- Data metrics
    jobs_found INTEGER DEFAULT 0,
    jobs_processed INTEGER DEFAULT 0,
    jobs_deduplicated INTEGER DEFAULT 0,
    jobs_rejected INTEGER DEFAULT 0,
    
    -- Error metrics
    retry_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error_type TEXT,
    last_error_message TEXT,
    
    -- Resource usage
    requests_made INTEGER DEFAULT 0,
    bytes_received INTEGER DEFAULT 0,
    proxy_used BOOLEAN DEFAULT false,
    
    -- Quality metrics
    data_quality_score DECIMAL(5,2),
    duplicate_rate DECIMAL(5,2),
    
    -- Status
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for scraping_metrics
CREATE INDEX IF NOT EXISTS idx_scraping_metrics_session_id ON scraping_metrics(scraping_session_id);
CREATE INDEX IF NOT EXISTS idx_scraping_metrics_source_id ON scraping_metrics(source_id);
CREATE INDEX IF NOT EXISTS idx_scraping_metrics_status ON scraping_metrics(status);

-- Enable RLS on new tables
ALTER TABLE scraping_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for scraping_sessions
CREATE POLICY "Users can view own scraping sessions" ON scraping_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scraping sessions" ON scraping_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scraping sessions" ON scraping_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for job_raw
CREATE POLICY "Users can view raw data from own sessions" ON job_raw
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scraping_sessions 
            WHERE scraping_sessions.id = job_raw.scraping_session_id 
            AND scraping_sessions.user_id = auth.uid()
        )
    );

-- RLS policies for scraping_metrics
CREATE POLICY "Users can view metrics from own sessions" ON scraping_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scraping_sessions 
            WHERE scraping_sessions.id = scraping_metrics.scraping_session_id 
            AND scraping_sessions.user_id = auth.uid()
        )
    );

-- Service role policies for system management
CREATE POLICY "Service role can manage scraping tables" ON scraping_sessions
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage job_raw" ON job_raw
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage scraping_metrics" ON scraping_metrics
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Add foreign key constraint for job_raw_id in jobs table (deferred for circular reference)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_job_raw_id'
    ) THEN
        ALTER TABLE jobs ADD CONSTRAINT fk_job_raw_id 
            FOREIGN KEY (job_raw_id) REFERENCES job_raw(id) DEFERRABLE INITIALLY DEFERRED;
    END IF;
END $$;

-- Create deduplication helper function
CREATE OR REPLACE FUNCTION generate_deduplication_hash(
    p_title TEXT,
    p_company TEXT, 
    p_location TEXT
)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(sha256(
        trim(lower(coalesce(p_title, ''))) || '|' ||
        trim(lower(coalesce(p_company, ''))) || '|' ||
        trim(lower(coalesce(p_location, '')))
    ), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate deduplication hash for jobs
CREATE OR REPLACE FUNCTION set_jobs_deduplication_hash()
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

-- Create trigger for jobs table
DROP TRIGGER IF EXISTS set_jobs_deduplication_hash_trigger ON jobs;
CREATE TRIGGER set_jobs_deduplication_hash_trigger 
    BEFORE INSERT OR UPDATE ON jobs 
    FOR EACH ROW EXECUTE FUNCTION set_jobs_deduplication_hash();

-- Update existing jobs to have deduplication hashes
UPDATE jobs SET deduplication_hash = generate_deduplication_hash(title, company, location) 
WHERE deduplication_hash IS NULL;

-- Create trigger for job_raw table
CREATE OR REPLACE FUNCTION set_job_raw_deduplication_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deduplication_hash = generate_deduplication_hash(
        NEW.title_normalized,
        NEW.company_normalized,
        NEW.location_normalized
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_job_raw_deduplication_hash_trigger ON job_raw;
CREATE TRIGGER set_job_raw_deduplication_hash_trigger 
    BEFORE INSERT OR UPDATE ON job_raw 
    FOR EACH ROW EXECUTE FUNCTION set_job_raw_deduplication_hash();

-- Updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION IF NOT EXISTS update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers for new tables
CREATE TRIGGER update_scraping_sessions_updated_at 
    BEFORE UPDATE ON scraping_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_raw_updated_at 
    BEFORE UPDATE ON job_raw 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scraping_metrics_updated_at 
    BEFORE UPDATE ON scraping_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit view for scraping system
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
    ss.started_at as session_started_at,
    ss.status as session_status
FROM job_raw jr
LEFT JOIN jobs j ON jr.merged_to_job_id = j.id
LEFT JOIN scraping_sessions ss ON jr.scraping_session_id = ss.id
ORDER BY jr.scraped_at DESC;

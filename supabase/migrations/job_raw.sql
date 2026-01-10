-- Job Raw Table
-- Temporary storage for raw scraped data before deduplication
CREATE TABLE IF NOT EXISTS job_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scraping_session_id UUID REFERENCES scraping_sessions(id) ON DELETE CASCADE,
    source_id UUID REFERENCES scraping_sources(id),
    
    -- Raw data from source
    raw_data JSONB NOT NULL, -- Complete raw response from source
    source_job_id TEXT, -- Original job ID from source platform
    source_url TEXT, -- Original job posting URL
    
    -- Extracted/normalized fields (for deduplication)
    title_normalized TEXT,
    company_normalized TEXT,
    location_normalized TEXT,
    description_hash TEXT, -- SHA-256 of normalized description
    
    -- Deduplication fields
    deduplication_hash TEXT NOT NULL, -- SHA-256 of (title+company+location)
    similarity_group_id UUID, -- Groups similar jobs together
    is_duplicate BOOLEAN DEFAULT false,
    duplicate_of_id UUID REFERENCES job_raw(id),
    
    -- Processing status
    processing_status TEXT DEFAULT 'raw' CHECK (processing_status IN ('raw', 'processed', 'deduplicated', 'merged', 'rejected')),
    processing_errors JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance and deduplication
CREATE INDEX idx_job_raw_session_id ON job_raw(scraping_session_id);
CREATE INDEX idx_job_raw_source_id ON job_raw(source_id);
CREATE INDEX idx_job_raw_deduplication_hash ON job_raw(deduplication_hash);
CREATE INDEX idx_job_raw_processing_status ON job_raw(processing_status);
CREATE INDEX idx_job_raw_is_duplicate ON job_raw(is_duplicate);
CREATE INDEX idx_job_raw_similarity_group ON job_raw(similarity_group_id);

-- Composite index for deduplication queries
CREATE INDEX idx_job_raw_dedup_lookup ON job_raw(deduplication_hash, processing_status, is_duplicate);

-- RLS - Users can access raw data from their own sessions
ALTER TABLE job_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view raw data from own sessions" ON job_raw
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scraping_sessions 
            WHERE scraping_sessions.id = job_raw.scraping_session_id 
            AND scraping_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage all raw job data" ON job_raw
    FOR ALL USING (
        auth.jwt()->>'role' = 'service_role' 
        OR auth.jwt()->>'role' = 'admin'
    );

-- Updated_at trigger
CREATE TRIGGER update_job_raw_updated_at 
    BEFORE UPDATE ON job_raw 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate deduplication hash
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

-- Trigger to auto-generate deduplication hash
CREATE OR REPLACE FUNCTION set_deduplication_hash()
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

CREATE TRIGGER set_job_raw_deduplication_hash 
    BEFORE INSERT OR UPDATE ON job_raw 
    FOR EACH ROW EXECUTE FUNCTION set_deduplication_hash();

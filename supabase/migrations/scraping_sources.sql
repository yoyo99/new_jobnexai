-- Scraping Sources Table
-- Configuration for different job sources (Indeed, LinkedIn, etc.)
CREATE TABLE IF NOT EXISTS scraping_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 'indeed', 'linkedin', 'glassdoor', etc.
    display_name TEXT NOT NULL, -- 'Indeed', 'LinkedIn Jobs', etc.
    base_url TEXT NOT NULL,
    api_endpoint TEXT,
    auth_type TEXT CHECK (auth_type IN ('api_key', 'oauth', 'basic', 'none')),
    auth_config JSONB DEFAULT '{}'::jsonb, -- Encrypted credentials storage
    
    -- Rate limiting configuration
    rate_limit_requests_per_minute INTEGER DEFAULT 60,
    rate_limit_burst_size INTEGER DEFAULT 10,
    
    -- Retry configuration
    max_retries INTEGER DEFAULT 3,
    retry_backoff_ms INTEGER DEFAULT 1000, -- Base backoff in milliseconds
    
    -- Proxy configuration
    requires_proxy BOOLEAN DEFAULT false,
    proxy_rotation_enabled BOOLEAN DEFAULT false,
    
    -- Source-specific settings
    search_params JSONB DEFAULT '{}'::jsonb, -- Source-specific search parameters
    response_format JSONB DEFAULT '{}'::jsonb, -- Expected response format schema
    
    -- Status and health
    is_active BOOLEAN DEFAULT true,
    last_success_at TIMESTAMP WITH TIME ZONE,
    last_error_at TIMESTAMP WITH TIME ZONE,
    last_error_message TEXT,
    success_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage of successful scrapes
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_scraping_sources_name ON scraping_sources(name);
CREATE INDEX idx_scraping_sources_is_active ON scraping_sources(is_active);
CREATE INDEX idx_scraping_sources_success_rate ON scraping_sources(success_rate);

-- RLS - Only system/admin can modify sources, users can read active ones
ALTER TABLE scraping_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active scraping sources" ON scraping_sources
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage scraping sources" ON scraping_sources
    FOR ALL USING (
        auth.jwt()->>'role' = 'service_role' 
        OR auth.jwt()->>'role' = 'admin'
    );

-- Updated_at trigger
CREATE TRIGGER update_scraping_sources_updated_at 
    BEFORE UPDATE ON scraping_sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default sources
INSERT INTO scraping_sources (name, display_name, base_url, api_endpoint, auth_type, requires_proxy) VALUES
('indeed', 'Indeed', 'https://api.indeed.com/ads/apisearch', 'https://api.indeed.com/ads/apisearch', 'api_key', true),
('linkedin', 'LinkedIn Jobs', 'https://www.linkedin.com/jobs/search', NULL, 'none', true),
('glassdoor', 'Glassdoor', 'https://www.glassdoor.com/Job/jobs.htm', NULL, 'none', true)
ON CONFLICT (name) DO NOTHING;

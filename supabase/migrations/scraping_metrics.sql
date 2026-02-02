-- Scraping Metrics Table
-- Performance and operational metrics for scraping sessions
CREATE TABLE IF NOT EXISTS scraping_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scraping_session_id UUID REFERENCES scraping_sessions(id) ON DELETE CASCADE,
    source_id UUID REFERENCES scraping_sources(id),
    
    -- Timing metrics (in milliseconds)
    source_trigger_ms INTEGER, -- Time to trigger source scraping
    source_response_ms INTEGER, -- Time to get first response from source
    source_complete_ms INTEGER, -- Total time for source completion
    
    -- Data metrics
    jobs_found INTEGER DEFAULT 0,
    jobs_processed INTEGER DEFAULT 0,
    jobs_deduplicated INTEGER DEFAULT 0,
    jobs_rejected INTEGER DEFAULT 0, -- Invalid/incomplete job data
    
    -- Error metrics
    retry_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error_type TEXT, -- 'timeout', '403', 'rate_limit', 'parse_error', etc.
    last_error_message TEXT,
    
    -- Resource usage
    requests_made INTEGER DEFAULT 0,
    bytes_received INTEGER DEFAULT 0,
    proxy_used BOOLEAN DEFAULT false,
    
    -- Quality metrics
    data_quality_score DECIMAL(5,2), -- 0-100 score based on completeness
    duplicate_rate DECIMAL(5,2), -- Percentage of duplicates found
    
    -- Status
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance analytics
CREATE INDEX idx_scraping_metrics_session_id ON scraping_metrics(scraping_session_id);
CREATE INDEX idx_scraping_metrics_source_id ON scraping_metrics(source_id);
CREATE INDEX idx_scraping_metrics_status ON scraping_metrics(status);
CREATE INDEX idx_scraping_metrics_started_at ON scraping_metrics(started_at);
CREATE INDEX idx_scraping_metrics_error_type ON scraping_metrics(last_error_type);

-- Composite indexes for common analytics queries
CREATE INDEX idx_scraping_metrics_session_source ON scraping_metrics(scraping_session_id, source_id);
CREATE INDEX idx_scraping_metrics_performance ON scraping_metrics(source_complete_ms, jobs_found);

-- RLS - Users can view metrics from their own sessions
ALTER TABLE scraping_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metrics from own sessions" ON scraping_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scraping_sessions 
            WHERE scraping_sessions.id = scraping_metrics.scraping_session_id 
            AND scraping_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage all scraping metrics" ON scraping_metrics
    FOR ALL USING (
        auth.jwt()->>'role' = 'service_role' 
        OR auth.jwt()->>'role' = 'admin'
    );

-- Updated_at trigger
CREATE TRIGGER update_scraping_metrics_updated_at 
    BEFORE UPDATE ON scraping_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Analytics helper functions
CREATE OR REPLACE FUNCTION get_scraping_performance_summary(
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    source_name TEXT,
    total_sessions BIGINT,
    avg_completion_time_ms DECIMAL,
    success_rate DECIMAL,
    avg_jobs_per_session DECIMAL,
    error_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.name as source_name,
        COUNT(DISTINCT sm.scraping_session_id) as total_sessions,
        AVG(sm.source_complete_ms) as avg_completion_time_ms,
        (COUNT(CASE WHEN sm.status = 'completed' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100) as success_rate,
        AVG(sm.jobs_found) as avg_jobs_per_session,
        (COUNT(CASE WHEN sm.status = 'failed' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100) as error_rate
    FROM scraping_metrics sm
    JOIN scraping_sources s ON sm.source_id = s.id
    WHERE sm.started_at >= NOW() - INTERVAL '1 day' * p_days
    GROUP BY s.name
    ORDER BY success_rate DESC, avg_completion_time_ms ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate data quality score
CREATE OR REPLACE FUNCTION calculate_data_quality_score(
    p_jobs_found INTEGER,
    p_jobs_processed INTEGER,
    p_jobs_deduplicated INTEGER,
    p_error_count INTEGER
)
RETURNS DECIMAL AS $$
BEGIN
    -- Quality score based on processing success and error rate
    -- Formula: (processed/found * 70) + (deduplication_rate * 20) + (error_penalty * 10)
    DECLARE
        processing_rate DECIMAL;
        deduplication_rate DECIMAL;
        error_penalty DECIMAL;
    BEGIN
        IF p_jobs_found = 0 THEN
            RETURN 0;
        END IF;
        
        processing_rate := (p_jobs_processed::DECIMAL / p_jobs_found::DECIMAL) * 70;
        deduplication_rate := (p_jobs_deduplicated::DECIMAL / GREATEST(p_jobs_processed, 1)::DECIMAL) * 20;
        error_penalty := GREATEST(0, 10 - (p_error_count::DECIMAL / p_jobs_found::DECIMAL * 10));
        
        RETURN GREATEST(0, LEAST(100, processing_rate + deduplication_rate + error_penalty));
    END;
END;
$$ LANGUAGE plpgsql;

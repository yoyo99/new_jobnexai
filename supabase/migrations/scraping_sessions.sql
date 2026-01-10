-- Scraping Sessions Table
-- Tracks each scraping session initiated by users
CREATE TABLE IF NOT EXISTS scraping_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    search_criteria JSONB NOT NULL, -- {search: string, location: string, jobType: string, etc.}
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_sources INTEGER DEFAULT 0,
    successful_sources INTEGER DEFAULT 0,
    failed_sources INTEGER DEFAULT 0,
    jobs_found INTEGER DEFAULT 0,
    jobs_deduplicated INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional session data
    
    -- Performance tracking
    trigger_to_webhook_ms INTEGER, -- Time from user click to webhook confirmation
    webhook_to_completion_ms INTEGER, -- Total scraping time
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_scraping_sessions_user_id ON scraping_sessions(user_id);
CREATE INDEX idx_scraping_sessions_status ON scraping_sessions(status);
CREATE INDEX idx_scraping_sessions_started_at ON scraping_sessions(started_at);
CREATE INDEX idx_scraping_sessions_user_status ON scraping_sessions(user_id, status);

-- RLS (Row Level Security)
ALTER TABLE scraping_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sessions
CREATE POLICY "Users can view own scraping sessions" ON scraping_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scraping sessions" ON scraping_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scraping sessions" ON scraping_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scraping_sessions_updated_at 
    BEFORE UPDATE ON scraping_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

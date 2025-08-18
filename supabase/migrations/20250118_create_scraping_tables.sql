-- Création des tables pour le système de scraping web

-- Table pour les sessions de scraping
CREATE TABLE IF NOT EXISTS scraping_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    criteria JSONB NOT NULL,
    selected_sites TEXT[] NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    total_jobs INTEGER DEFAULT 0,
    scraped_jobs INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les offres scrapées
CREATE TABLE IF NOT EXISTS scraped_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES scraping_sessions(id) ON DELETE CASCADE,
    site_name TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    salary TEXT,
    contract_type TEXT,
    experience_level TEXT,
    description TEXT,
    url TEXT,
    posted_date TIMESTAMP WITH TIME ZONE,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_scraping_sessions_user_id ON scraping_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_scraping_sessions_status ON scraping_sessions(status);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_session_id ON scraped_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_site_name ON scraped_jobs(site_name);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_created_at ON scraped_jobs(created_at);

-- Politiques RLS (Row Level Security)
ALTER TABLE scraping_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_jobs ENABLE ROW LEVEL SECURITY;

-- Politique pour scraping_sessions : les utilisateurs ne peuvent voir que leurs propres sessions
CREATE POLICY "Users can view own scraping sessions" ON scraping_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scraping sessions" ON scraping_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scraping sessions" ON scraping_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique pour scraped_jobs : les utilisateurs ne peuvent voir que les offres de leurs sessions
CREATE POLICY "Users can view scraped jobs from own sessions" ON scraped_jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scraping_sessions 
            WHERE scraping_sessions.id = scraped_jobs.session_id 
            AND scraping_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert scraped jobs" ON scraped_jobs
    FOR INSERT WITH CHECK (true);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at sur scraping_sessions
CREATE TRIGGER update_scraping_sessions_updated_at 
    BEFORE UPDATE ON scraping_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

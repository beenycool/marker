-- Migration for anonymous features and GDPR-compliant email collection
-- Run these in your Supabase SQL editor

-- Table for anonymous rate limiting
CREATE TABLE IF NOT EXISTS anonymous_counters (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_anonymous_counters_key ON anonymous_counters(key);

-- Function to increment counter atomically
CREATE OR REPLACE FUNCTION increment_anonymous_counter(
    counter_key TEXT,
    increment INT DEFAULT 1,
    max_value INT DEFAULT 200
)
RETURNS TABLE(count INT) AS $$
DECLARE
    current_count INT;
BEGIN
    -- Insert or update the counter
    INSERT INTO anonymous_counters (key, count)
    VALUES (counter_key, increment)
    ON CONFLICT (key) 
    DO UPDATE SET 
        count = anonymous_counters.count + increment,
        updated_at = NOW()
    RETURNING anonymous_counters.count INTO current_count;
    
    RETURN QUERY SELECT current_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get current counter value
CREATE OR REPLACE FUNCTION get_anonymous_counter(counter_key TEXT)
RETURNS TABLE(count INT) AS $$
BEGIN
    RETURN QUERY 
    SELECT COALESCE(anonymous_counters.count, 0)::INT
    FROM anonymous_counters 
    WHERE key = counter_key;
END;
$$ LANGUAGE plpgsql;

-- Table for GDPR-compliant summer email reminders
CREATE TABLE IF NOT EXISTS summer_email_reminders (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    consent_date TIMESTAMP WITH TIME ZONE NOT NULL,
    purpose VARCHAR(100) NOT NULL DEFAULT 'school_year_pricing_reminder',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    unsubscribed BOOLEAN DEFAULT FALSE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_summer_email_reminders_email ON summer_email_reminders(email);
CREATE INDEX IF NOT EXISTS idx_summer_email_reminders_sent ON summer_email_reminders(sent) WHERE sent = FALSE;

-- Table for shareable results (no personal data)
CREATE TABLE IF NOT EXISTS shared_results (
    id SERIAL PRIMARY KEY,
    share_id VARCHAR(50) UNIQUE NOT NULL,
    score INTEGER NOT NULL,
    total_marks INTEGER,
    subject VARCHAR(100),
    grade_estimate VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    view_count INTEGER DEFAULT 0
);

-- Index for share ID lookups and cleanup
CREATE INDEX IF NOT EXISTS idx_shared_results_share_id ON shared_results(share_id);
CREATE INDEX IF NOT EXISTS idx_shared_results_expires ON shared_results(expires_at);

-- Cleanup function for expired shares (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM shared_results WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup function for old anonymous counters (run daily)
CREATE OR REPLACE FUNCTION cleanup_old_counters()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete counters older than 2 days
    DELETE FROM anonymous_counters WHERE created_at < NOW() - INTERVAL '2 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS) for privacy
ALTER TABLE summer_email_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_counters ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read shared results
CREATE POLICY "Allow public read on shared_results" ON shared_results
    FOR SELECT USING (expires_at > NOW());

-- Policy: Anyone can insert shared results  
CREATE POLICY "Allow public insert on shared_results" ON shared_results
    FOR INSERT WITH CHECK (true);

-- Policy: Anonymous counters are public for rate limiting
CREATE POLICY "Allow public access on anonymous_counters" ON anonymous_counters
    FOR ALL USING (true);

-- Policy: Email reminders are insert-only for privacy
CREATE POLICY "Allow public insert on summer_email_reminders" ON summer_email_reminders
    FOR INSERT WITH CHECK (true);

COMMENT ON TABLE summer_email_reminders IS 'GDPR-compliant email collection for one-time school year pricing reminder';
COMMENT ON TABLE shared_results IS 'Anonymous shareable marking results with automatic expiry';
COMMENT ON TABLE anonymous_counters IS 'IP-based daily rate limiting without storing personal data';
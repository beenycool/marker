-- Create table for anonymous AI failure reports
-- This table follows Zero GDPR Risk approach - no personal data is stored
CREATE TABLE ai_failure_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    prompt_version TEXT,
    model_used TEXT,
    failed_response_text TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'
);

-- Create index for efficient querying by date and model
CREATE INDEX idx_ai_failure_log_reported_at ON ai_failure_log (reported_at);
CREATE INDEX idx_ai_failure_log_model ON ai_failure_log (model_used);
CREATE INDEX idx_ai_failure_log_prompt_version ON ai_failure_log (prompt_version);
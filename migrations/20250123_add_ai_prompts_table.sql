-- Create table for AI prompt management and A/B testing
CREATE TABLE ai_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    subject VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique active prompt per name/subject combination
    UNIQUE(name, subject) WHERE is_active = true
);

-- Create index for efficient prompt selection
CREATE INDEX idx_ai_prompts_active ON ai_prompts (name, subject, is_active) WHERE is_active = true;
CREATE INDEX idx_ai_prompts_rollout ON ai_prompts (rollout_percentage) WHERE rollout_percentage > 0;

-- Create table for tracking prompt performance in real-time (anonymous)
CREATE TABLE prompt_performance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_id UUID REFERENCES ai_prompts(id) ON DELETE CASCADE,
    anonymous_request_id UUID, -- Anonymous request identifier, not linked to users
    score INTEGER,
    user_rating INTEGER,
    response_time_ms INTEGER,
    cost_usd DECIMAL(10, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strictly anonymous: no user/account foreign keys or PII columns
-- Indexes for performance analytics
CREATE INDEX idx_prompt_performance_prompt_id ON prompt_performance_logs (prompt_id);
CREATE INDEX idx_prompt_performance_created_at ON prompt_performance_logs (created_at);
CREATE INDEX idx_prompt_performance_score ON prompt_performance_logs (score);

-- Create table for golden dataset (test cases for prompt evaluation)
CREATE TABLE golden_dataset (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    expected_score INTEGER NOT NULL,
    expected_grade VARCHAR(10) NOT NULL,
    subject VARCHAR(100),
    exam_board VARCHAR(100),
    mark_scheme TEXT,
    marks_total INTEGER DEFAULT 20,
    difficulty_level VARCHAR(20) DEFAULT 'medium',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for golden dataset queries
CREATE INDEX idx_golden_dataset_subject ON golden_dataset (subject);
CREATE INDEX idx_golden_dataset_active ON golden_dataset (is_active) WHERE is_active = true;

-- Create table for golden dataset test results
CREATE TABLE golden_dataset_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    golden_item_id UUID REFERENCES golden_dataset(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES ai_prompts(id) ON DELETE CASCADE,
    actual_score INTEGER NOT NULL,
    actual_grade VARCHAR(10) NOT NULL,
    score_diff INTEGER NOT NULL, -- actual_score - expected_score
    response_text TEXT,
    test_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    test_metadata JSONB DEFAULT '{}'
);

-- Index for test results analytics
CREATE INDEX idx_golden_results_prompt ON golden_dataset_results (prompt_id);
CREATE INDEX idx_golden_results_date ON golden_dataset_results (test_date);

-- Note: This migration assumes an anonymous feedback system
-- No modifications to user-linked tables needed for anonymous architecture

-- Anonymous performance logging function (purely anonymous, no user links)
CREATE OR REPLACE FUNCTION log_anonymous_prompt_performance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO prompt_performance_logs (
        prompt_id,
        anonymous_request_id,
        score,
        user_rating,
        response_time_ms,
        cost_usd
    ) VALUES (
        NEW.prompt_id,
        NEW.anonymous_request_id,
        NEW.score,
        NEW.user_rating,
        NEW.response_time_ms,
        NEW.cost_usd
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: No triggers created on user tables; only attach to anonymous feedback tables if present.

-- Anonymous metrics function
CREATE OR REPLACE FUNCTION get_anonymous_metrics()
RETURNS TABLE (
    total_requests_today BIGINT,
    total_requests_week BIGINT,
    avg_score NUMERIC,
    total_cost NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as total_requests_today,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as total_requests_week,
        AVG(score::NUMERIC) as avg_score,
        SUM(cost_usd) as total_cost
    FROM prompt_performance_logs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for prompt performance analytics
CREATE OR REPLACE FUNCTION get_prompt_performance(prompt_id_param UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    total_uses BIGINT,
    avg_score NUMERIC,
    avg_user_rating NUMERIC,
    avg_response_time NUMERIC,
    total_cost NUMERIC,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_uses,
        AVG(score::NUMERIC) as avg_score,
        AVG(user_rating::NUMERIC) as avg_user_rating,
        AVG(response_time_ms::NUMERIC) as avg_response_time,
        SUM(cost_usd) as total_cost,
        (COUNT(*) FILTER (WHERE score IS NOT NULL)::NUMERIC / COUNT(*)::NUMERIC * 100) as success_rate
    FROM prompt_performance_logs
    WHERE prompt_id = prompt_id_param
    AND created_at > NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
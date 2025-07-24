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

-- Create table for tracking prompt performance in real-time
CREATE TABLE prompt_performance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_id UUID REFERENCES ai_prompts(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
    score INTEGER,
    user_rating INTEGER,
    response_time_ms INTEGER,
    cost_usd DECIMAL(10, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Add cost tracking to feedback table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='feedback' AND column_name='cost_usd') THEN
        ALTER TABLE feedback ADD COLUMN cost_usd DECIMAL(10, 6) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='feedback' AND column_name='response_time_ms') THEN
        ALTER TABLE feedback ADD COLUMN response_time_ms INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='feedback' AND column_name='prompt_version') THEN
        ALTER TABLE feedback ADD COLUMN prompt_version VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='feedback' AND column_name='error_message') THEN
        ALTER TABLE feedback ADD COLUMN error_message TEXT;
    END IF;
END $$;

-- Create function to update performance metrics automatically
CREATE OR REPLACE FUNCTION update_prompt_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the performance data
    INSERT INTO prompt_performance_logs (
        prompt_id, 
        submission_id, 
        user_id, 
        feedback_id, 
        score, 
        user_rating, 
        response_time_ms, 
        cost_usd
    ) VALUES (
        (SELECT id FROM ai_prompts WHERE name = 'default' AND is_active = true LIMIT 1), -- This should be dynamic
        NEW.submission_id,
        (SELECT user_id FROM submissions WHERE id = NEW.submission_id),
        NEW.id,
        NEW.score,
        NEW.user_rating,
        NEW.response_time_ms,
        NEW.cost_usd
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to log performance metrics
DROP TRIGGER IF EXISTS trigger_update_prompt_performance ON feedback;
CREATE TRIGGER trigger_update_prompt_performance
    AFTER INSERT OR UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_prompt_performance_metrics();

-- Create function for admin metrics
CREATE OR REPLACE FUNCTION get_user_metrics()
RETURNS TABLE (
    total_users BIGINT,
    active_users BIGINT,
    new_users_today BIGINT,
    pro_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE last_sign_in_at > NOW() - INTERVAL '7 days') as active_users,
        COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as new_users_today,
        COUNT(*) FILTER (WHERE subscription_tier = 'PRO') as pro_users
    FROM auth.users;
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
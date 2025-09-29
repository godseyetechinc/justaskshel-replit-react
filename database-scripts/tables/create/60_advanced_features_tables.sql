-- =============================================
-- Advanced Features Tables Creation Script
-- =============================================
-- Description: Create seasonal campaigns, AI recommendations, and advanced redemption tables
-- Dependencies: 50_social_features_tables.sql
-- Execution Order: 60
-- Idempotent: Yes

BEGIN;

-- =============================================
-- Seasonal Campaigns
-- =============================================
CREATE TABLE IF NOT EXISTS seasonal_campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    campaign_type VARCHAR NOT NULL CHECK (campaign_type IN ('Holiday', 'Special Event', 'Milestone', 'Seasonal', 'Anniversary')),
    points_multiplier DECIMAL(3,2) DEFAULT 1.00,
    bonus_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    auto_start BOOLEAN DEFAULT FALSE,
    auto_end BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    target_user_tiers VARCHAR[],
    target_categories VARCHAR[],
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    conditions JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seasonal_campaigns_is_active ON seasonal_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_seasonal_campaigns_start_date ON seasonal_campaigns(start_date);
CREATE INDEX IF NOT EXISTS idx_seasonal_campaigns_end_date ON seasonal_campaigns(end_date);
CREATE INDEX IF NOT EXISTS idx_seasonal_campaigns_type ON seasonal_campaigns(campaign_type);

-- =============================================
-- Campaign Participations
-- =============================================
CREATE TABLE IF NOT EXISTS campaign_participations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    campaign_id INTEGER NOT NULL REFERENCES seasonal_campaigns(id),
    enrollment_date TIMESTAMP DEFAULT NOW(),
    points_earned INTEGER DEFAULT 0,
    activities_completed INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_participations_user_id ON campaign_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participations_campaign_id ON campaign_participations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participations_is_active ON campaign_participations(is_active);

-- =============================================
-- Seasonal Achievements
-- =============================================
CREATE TABLE IF NOT EXISTS seasonal_achievements (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES seasonal_campaigns(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    category VARCHAR NOT NULL CHECK (category IN ('Holiday', 'Seasonal', 'Special Event', 'Challenge', 'Milestone')),
    points_reward INTEGER DEFAULT 0,
    requirements JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    max_awards INTEGER,
    current_awards INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seasonal_achievements_campaign_id ON seasonal_achievements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_achievements_category ON seasonal_achievements(category);
CREATE INDEX IF NOT EXISTS idx_seasonal_achievements_is_active ON seasonal_achievements(is_active);

-- =============================================
-- User Seasonal Achievements
-- =============================================
CREATE TABLE IF NOT EXISTS user_seasonal_achievements (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    achievement_id INTEGER NOT NULL REFERENCES seasonal_achievements(id),
    campaign_id INTEGER NOT NULL REFERENCES seasonal_campaigns(id),
    unlocked_at TIMESTAMP DEFAULT NOW(),
    points_awarded INTEGER DEFAULT 0,
    progress JSONB,
    notification_sent BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_seasonal_achievements_user_id ON user_seasonal_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_seasonal_achievements_achievement_id ON user_seasonal_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_seasonal_achievements_campaign_id ON user_seasonal_achievements(campaign_id);

-- =============================================
-- Reward Wishlists
-- =============================================
CREATE TABLE IF NOT EXISTS reward_wishlists (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    reward_id INTEGER NOT NULL REFERENCES rewards(id),
    priority_level INTEGER DEFAULT 1 CHECK (priority_level BETWEEN 1 AND 5),
    target_date TIMESTAMP,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    notification_enabled BOOLEAN DEFAULT TRUE,
    notification_threshold INTEGER DEFAULT 80,
    added_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, reward_id)
);

CREATE INDEX IF NOT EXISTS idx_reward_wishlists_user_id ON reward_wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_wishlists_reward_id ON reward_wishlists(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_wishlists_priority ON reward_wishlists(priority_level);

-- =============================================
-- Reward Pricing History
-- =============================================
CREATE TABLE IF NOT EXISTS reward_pricing_history (
    id SERIAL PRIMARY KEY,
    reward_id INTEGER NOT NULL REFERENCES rewards(id),
    points_cost INTEGER NOT NULL,
    effective_date TIMESTAMP DEFAULT NOW(),
    reason VARCHAR(100),
    demand_factor DECIMAL(4,2),
    inventory_level INTEGER,
    created_by VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_pricing_history_reward_id ON reward_pricing_history(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_pricing_history_effective_date ON reward_pricing_history(effective_date);

-- =============================================
-- Partial Redemptions
-- =============================================
CREATE TABLE IF NOT EXISTS partial_redemptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    reward_id INTEGER NOT NULL REFERENCES rewards(id),
    total_points_required INTEGER NOT NULL,
    points_contributed INTEGER DEFAULT 0,
    percentage_complete DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled', 'Expired')),
    target_completion_date TIMESTAMP,
    expires_at TIMESTAMP,
    completion_reward_id INTEGER REFERENCES reward_redemptions(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partial_redemptions_user_id ON partial_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_partial_redemptions_reward_id ON partial_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_partial_redemptions_status ON partial_redemptions(status);

-- =============================================
-- Reward Recommendations
-- =============================================
CREATE TABLE IF NOT EXISTS reward_recommendations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    reward_id INTEGER NOT NULL REFERENCES rewards(id),
    recommendation_type VARCHAR NOT NULL CHECK (recommendation_type IN ('AI', 'Trending', 'Similar Users', 'Seasonal', 'Personal History')),
    confidence_score DECIMAL(4,3),
    reasoning TEXT,
    model_version VARCHAR(50),
    factors JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMP,
    converted BOOLEAN DEFAULT FALSE,
    converted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_recommendations_user_id ON reward_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_recommendations_reward_id ON reward_recommendations(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_recommendations_type ON reward_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_reward_recommendations_is_active ON reward_recommendations(is_active);

-- =============================================
-- Reward Inventory
-- =============================================
CREATE TABLE IF NOT EXISTS reward_inventory (
    id SERIAL PRIMARY KEY,
    reward_id INTEGER UNIQUE NOT NULL REFERENCES rewards(id),
    current_stock INTEGER DEFAULT 0,
    reserved_stock INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    max_stock INTEGER,
    auto_reorder BOOLEAN DEFAULT FALSE,
    supplier_info JSONB,
    last_restocked_at TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_inventory_reward_id ON reward_inventory(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_inventory_current_stock ON reward_inventory(current_stock);

-- =============================================
-- Recommendation Models
-- =============================================
CREATE TABLE IF NOT EXISTS recommendation_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    model_type VARCHAR CHECK (model_type IN ('Collaborative', 'Content-Based', 'Hybrid', 'Deep Learning')),
    description TEXT,
    parameters JSONB,
    performance_metrics JSONB,
    is_active BOOLEAN DEFAULT FALSE,
    training_data_size INTEGER,
    accuracy_score DECIMAL(4,3),
    created_at TIMESTAMP DEFAULT NOW(),
    deployed_at TIMESTAMP,
    UNIQUE(name, version)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_models_is_active ON recommendation_models(is_active);
CREATE INDEX IF NOT EXISTS idx_recommendation_models_accuracy ON recommendation_models(accuracy_score);

-- =============================================
-- Reward Interactions
-- =============================================
CREATE TABLE IF NOT EXISTS reward_interactions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    reward_id INTEGER NOT NULL REFERENCES rewards(id),
    interaction_type VARCHAR NOT NULL CHECK (interaction_type IN ('View', 'Like', 'Share', 'Wishlist', 'Compare', 'Click')),
    interaction_context VARCHAR CHECK (interaction_context IN ('Browse', 'Search', 'Recommendation', 'Wishlist', 'Social')),
    session_id VARCHAR,
    device_type VARCHAR,
    user_agent TEXT,
    referrer VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_interactions_user_id ON reward_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_interactions_reward_id ON reward_interactions(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_interactions_type ON reward_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_reward_interactions_created_at ON reward_interactions(created_at);

-- =============================================
-- Reward Notifications
-- =============================================
CREATE TABLE IF NOT EXISTS reward_notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    reward_id INTEGER REFERENCES rewards(id),
    notification_type VARCHAR NOT NULL CHECK (notification_type IN ('Wishlist Alert', 'Price Drop', 'Stock Alert', 'Recommendation', 'Goal Achievement')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    delivery_method VARCHAR DEFAULT 'In-App' CHECK (delivery_method IN ('In-App', 'Email', 'SMS', 'Push')),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_notifications_user_id ON reward_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_notifications_reward_id ON reward_notifications(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_notifications_type ON reward_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_reward_notifications_is_sent ON reward_notifications(is_sent);

COMMIT;
-- =============================================
-- Social Features Tables Creation Script
-- =============================================
-- Description: Create social features and engagement tables
-- Dependencies: 40_points_rewards_tables.sql
-- Execution Order: 50
-- Idempotent: Yes

BEGIN;

-- =============================================
-- Leaderboard Settings
-- =============================================
CREATE TABLE IF NOT EXISTS leaderboard_settings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    is_visible BOOLEAN DEFAULT TRUE,
    show_full_name BOOLEAN DEFAULT FALSE,
    show_points BOOLEAN DEFAULT TRUE,
    show_achievements BOOLEAN DEFAULT TRUE,
    show_tier BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_settings_user_id ON leaderboard_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_settings_is_visible ON leaderboard_settings(is_visible);

-- =============================================
-- Achievement Shares
-- =============================================
CREATE TABLE IF NOT EXISTS achievement_shares (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    achievement_id INTEGER NOT NULL REFERENCES achievements(id),
    platform VARCHAR NOT NULL CHECK (platform IN ('Facebook', 'Twitter', 'LinkedIn', 'Instagram', 'Email', 'Copy Link')),
    shared_at TIMESTAMP DEFAULT NOW(),
    engagement_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_achievement_shares_user_id ON achievement_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_shares_achievement_id ON achievement_shares(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievement_shares_platform ON achievement_shares(platform);

-- =============================================
-- Social Media Integrations
-- =============================================
CREATE TABLE IF NOT EXISTS social_media_integrations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    platform VARCHAR NOT NULL CHECK (platform IN ('Facebook', 'Twitter', 'LinkedIn', 'Instagram')),
    platform_user_id VARCHAR,
    platform_username VARCHAR,
    access_token_encrypted VARCHAR,
    refresh_token_encrypted VARCHAR,
    token_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    auto_share_achievements BOOLEAN DEFAULT FALSE,
    auto_share_tier_upgrades BOOLEAN DEFAULT FALSE,
    privacy_level VARCHAR DEFAULT 'Public' CHECK (privacy_level IN ('Public', 'Friends', 'Private')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_media_integrations_user_id ON social_media_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_social_media_integrations_platform ON social_media_integrations(platform);

-- =============================================
-- Friendships
-- =============================================
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    requester_id VARCHAR NOT NULL REFERENCES users(id),
    addressee_id VARCHAR NOT NULL REFERENCES users(id),
    status VARCHAR DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Blocked', 'Cancelled')),
    requested_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CHECK (requester_id != addressee_id),
    UNIQUE(requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester_id ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee_id ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- =============================================
-- Social Referrals (Enhanced referral tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS social_referrals (
    id SERIAL PRIMARY KEY,
    referrer_id VARCHAR NOT NULL REFERENCES users(id),
    referee_id VARCHAR NOT NULL REFERENCES users(id),
    referral_method VARCHAR NOT NULL CHECK (referral_method IN ('Direct Link', 'Social Media', 'Email', 'SMS', 'In-App')),
    referral_platform VARCHAR CHECK (referral_platform IN ('Facebook', 'Twitter', 'LinkedIn', 'Instagram', 'WhatsApp', 'Email', 'SMS')),
    bonus_points_awarded BOOLEAN DEFAULT FALSE,
    social_bonus_points INTEGER DEFAULT 0,
    conversion_completed BOOLEAN DEFAULT FALSE,
    conversion_date TIMESTAMP,
    tracking_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_referrals_referrer_id ON social_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_social_referrals_referee_id ON social_referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_social_referrals_method ON social_referrals(referral_method);

-- =============================================
-- Leaderboard Rankings (Materialized view data)
-- =============================================
CREATE TABLE IF NOT EXISTS leaderboard_rankings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    ranking_type VARCHAR NOT NULL CHECK (ranking_type IN ('Points', 'Achievements', 'Referrals', 'Tier Progress', 'Monthly', 'Weekly')),
    rank_position INTEGER NOT NULL,
    score INTEGER NOT NULL,
    tier_level VARCHAR,
    achievement_count INTEGER DEFAULT 0,
    referral_count INTEGER DEFAULT 0,
    period_start DATE,
    period_end DATE,
    calculated_at TIMESTAMP DEFAULT NOW(),
    is_current BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_user_id ON leaderboard_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_type ON leaderboard_rankings(ranking_type);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_rank ON leaderboard_rankings(rank_position);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_is_current ON leaderboard_rankings(is_current);

-- =============================================
-- Social Activities (Activity feed)
-- =============================================
CREATE TABLE IF NOT EXISTS social_activities (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    activity_type VARCHAR NOT NULL CHECK (activity_type IN ('Achievement Unlocked', 'Tier Upgrade', 'Points Earned', 'Reward Redeemed', 'Referral Success', 'Friendship', 'Milestone')),
    activity_title VARCHAR(200) NOT NULL,
    activity_description TEXT,
    activity_data JSONB,
    points_involved INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_activities_user_id ON social_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_social_activities_type ON social_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_social_activities_is_public ON social_activities(is_public);
CREATE INDEX IF NOT EXISTS idx_social_activities_created_at ON social_activities(created_at);

-- =============================================
-- Activity Likes
-- =============================================
CREATE TABLE IF NOT EXISTS activity_likes (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES social_activities(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(activity_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_likes_activity_id ON activity_likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_likes_user_id ON activity_likes(user_id);

-- =============================================
-- Activity Comments
-- =============================================
CREATE TABLE IF NOT EXISTS activity_comments (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES social_activities(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    comment TEXT NOT NULL,
    parent_comment_id INTEGER REFERENCES activity_comments(id),
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user_id ON activity_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_parent_id ON activity_comments(parent_comment_id);

COMMIT;
-- =============================================
-- JustAskShel Database - DROP ALL TABLES Script
-- =============================================
-- Description: Safely drops all tables in correct dependency order
-- WARNING: This script will DELETE ALL DATA
-- Use with extreme caution - preferably only in development
-- Generated: October 2, 2025

-- Disable foreign key checks temporarily for clean drop
BEGIN;

-- Drop tables in reverse dependency order to avoid foreign key conflicts

-- Social Features & Advanced Features
DROP TABLE IF EXISTS achievement_shares CASCADE;
DROP TABLE IF EXISTS activity_comments CASCADE;
DROP TABLE IF EXISTS activity_likes CASCADE;
DROP TABLE IF EXISTS social_activities CASCADE;
DROP TABLE IF EXISTS social_referrals CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS social_media_integrations CASCADE;

-- User Achievements & Campaigns
DROP TABLE IF EXISTS user_seasonal_achievements CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS seasonal_achievements CASCADE;
DROP TABLE IF EXISTS campaign_participations CASCADE;
DROP TABLE IF EXISTS seasonal_campaigns CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;

-- Rewards System
DROP TABLE IF EXISTS reward_notifications CASCADE;
DROP TABLE IF EXISTS reward_interactions CASCADE;
DROP TABLE IF EXISTS reward_recommendations CASCADE;
DROP TABLE IF EXISTS recommendation_models CASCADE;
DROP TABLE IF EXISTS reward_inventory CASCADE;
DROP TABLE IF EXISTS reward_pricing_history CASCADE;
DROP TABLE IF EXISTS reward_wishlists CASCADE;
DROP TABLE IF EXISTS partial_redemptions CASCADE;
DROP TABLE IF EXISTS reward_redemptions CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;

-- Points System
DROP TABLE IF EXISTS points_transactions CASCADE;
DROP TABLE IF EXISTS points_summary CASCADE;
DROP TABLE IF EXISTS points_rules CASCADE;

-- Leaderboards
DROP TABLE IF EXISTS leaderboard_rankings CASCADE;
DROP TABLE IF EXISTS leaderboard_settings CASCADE;

-- Agent & Organization Analytics
DROP TABLE IF EXISTS agent_commissions CASCADE;
DROP TABLE IF EXISTS policy_transfers CASCADE;
DROP TABLE IF EXISTS client_activities CASCADE;
DROP TABLE IF EXISTS client_assignments CASCADE;
DROP TABLE IF EXISTS agent_performance CASCADE;
DROP TABLE IF EXISTS agent_collaborations CASCADE;
DROP TABLE IF EXISTS organization_knowledge_base CASCADE;
DROP TABLE IF EXISTS organization_analytics CASCADE;
DROP TABLE IF EXISTS agent_profiles CASCADE;

-- Referrals
DROP TABLE IF EXISTS referral_signups CASCADE;
DROP TABLE IF EXISTS referral_codes CASCADE;

-- Notifications
DROP TABLE IF EXISTS notifications CASCADE;

-- Policy & Claims Related
DROP TABLE IF EXISTS claim_workflow_steps CASCADE;
DROP TABLE IF EXISTS claim_communications CASCADE;
DROP TABLE IF EXISTS claim_documents CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS premium_payments CASCADE;
DROP TABLE IF EXISTS policy_amendments CASCADE;
DROP TABLE IF EXISTS policy_documents CASCADE;
DROP TABLE IF EXISTS policies CASCADE;

-- Quotes & Insurance
DROP TABLE IF EXISTS selected_quotes CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS external_quote_requests CASCADE;
DROP TABLE IF EXISTS insurance_quotes CASCADE;
DROP TABLE IF EXISTS insurance_providers CASCADE;
DROP TABLE IF EXISTS insurance_types CASCADE;

-- Person Associations
DROP TABLE IF EXISTS person_contacts CASCADE;
DROP TABLE IF EXISTS person_members CASCADE;
DROP TABLE IF EXISTS person_users CASCADE;

-- Contacts & Members
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS dependents CASCADE;

-- Organization Invitations
DROP TABLE IF EXISTS organization_invitations CASCADE;

-- Users & Authentication
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Core Identity & Organization
DROP TABLE IF EXISTS persons CASCADE;
DROP TABLE IF EXISTS agent_organizations CASCADE;

-- Session Management
DROP TABLE IF EXISTS sessions CASCADE;

COMMIT;

-- Verification
SELECT 
    'All tables dropped successfully' as status,
    COUNT(*) as remaining_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';

-- Note: If remaining_tables is 0, all application tables have been dropped

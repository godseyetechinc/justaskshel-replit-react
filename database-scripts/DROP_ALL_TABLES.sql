-- =============================================
-- JustAskShel Database - DROP ALL TABLES Script
-- =============================================
-- Description: Safely drops all tables in correct dependency order
-- WARNING: This script will DELETE ALL DATA
-- Use with extreme caution - preferably only in development
-- Last Updated: October 02, 2025
-- Total Tables: 75
-- =============================================

BEGIN;

-- Drop tables in reverse dependency order to avoid foreign key conflicts

-- ========================================
-- SECTION 1: SOCIAL FEATURES & GAMIFICATION
-- ========================================

DROP TABLE IF EXISTS achievement_shares CASCADE;
DROP TABLE IF EXISTS activity_comments CASCADE;
DROP TABLE IF EXISTS activity_likes CASCADE;
DROP TABLE IF EXISTS social_activities CASCADE;
DROP TABLE IF EXISTS social_referrals CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS social_media_integrations CASCADE;
DROP TABLE IF EXISTS leaderboard_rankings CASCADE;
DROP TABLE IF EXISTS leaderboard_settings CASCADE;

-- ========================================
-- SECTION 2: SEASONAL CAMPAIGNS & ACHIEVEMENTS
-- ========================================

DROP TABLE IF EXISTS user_seasonal_achievements CASCADE;
DROP TABLE IF EXISTS seasonal_achievements CASCADE;
DROP TABLE IF EXISTS campaign_participations CASCADE;
DROP TABLE IF EXISTS seasonal_campaigns CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;

-- ========================================
-- SECTION 3: ADVANCED REDEMPTION & RECOMMENDATIONS
-- ========================================

DROP TABLE IF EXISTS reward_notifications CASCADE;
DROP TABLE IF EXISTS reward_interactions CASCADE;
DROP TABLE IF EXISTS reward_recommendations CASCADE;
DROP TABLE IF EXISTS recommendation_models CASCADE;
DROP TABLE IF EXISTS reward_inventory CASCADE;
DROP TABLE IF EXISTS reward_pricing_history CASCADE;
DROP TABLE IF EXISTS reward_wishlists CASCADE;
DROP TABLE IF EXISTS partial_redemptions CASCADE;

-- ========================================
-- SECTION 4: REWARDS & POINTS SYSTEM
-- ========================================

DROP TABLE IF EXISTS reward_reviews CASCADE;
DROP TABLE IF EXISTS reward_redemptions CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS admin_point_adjustments CASCADE;
DROP TABLE IF EXISTS scheduled_points_tasks CASCADE;
DROP TABLE IF EXISTS bulk_points_operations CASCADE;
DROP TABLE IF EXISTS tier_benefits CASCADE;
DROP TABLE IF EXISTS tier_progression_history CASCADE;
DROP TABLE IF EXISTS points_tiers CASCADE;
DROP TABLE IF EXISTS referral_tracking CASCADE;
DROP TABLE IF EXISTS referral_codes CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS user_notifications CASCADE;
DROP TABLE IF EXISTS points_rules CASCADE;
DROP TABLE IF EXISTS points_transactions CASCADE;
DROP TABLE IF EXISTS points_summary CASCADE;

-- ========================================
-- SECTION 5: AGENT-POLICY RELATIONSHIP MANAGEMENT
-- ========================================

DROP TABLE IF EXISTS organization_knowledge_base CASCADE;
DROP TABLE IF EXISTS agent_collaborations CASCADE;
DROP TABLE IF EXISTS organization_analytics CASCADE;
DROP TABLE IF EXISTS client_activities CASCADE;
DROP TABLE IF EXISTS agent_performance CASCADE;
DROP TABLE IF EXISTS agent_commissions CASCADE;
DROP TABLE IF EXISTS policy_transfers CASCADE;
DROP TABLE IF EXISTS client_assignments CASCADE;
DROP TABLE IF EXISTS agent_profiles CASCADE;

-- ========================================
-- SECTION 6: POLICY & CLAIMS MANAGEMENT
-- ========================================

DROP TABLE IF EXISTS policy_amendments CASCADE;
DROP TABLE IF EXISTS premium_payments CASCADE;
DROP TABLE IF EXISTS policy_documents CASCADE;
DROP TABLE IF EXISTS claim_workflow_steps CASCADE;
DROP TABLE IF EXISTS claim_communications CASCADE;
DROP TABLE IF EXISTS claim_documents CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS dependents CASCADE;
DROP TABLE IF EXISTS policies CASCADE;

-- ========================================
-- SECTION 7: INSURANCE DOMAIN
-- ========================================

DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS selected_quotes CASCADE;
DROP TABLE IF EXISTS external_quote_requests CASCADE;
DROP TABLE IF EXISTS insurance_quotes CASCADE;
DROP TABLE IF EXISTS insurance_providers CASCADE;
DROP TABLE IF EXISTS insurance_types CASCADE;

-- ========================================
-- SECTION 8: MEMBER & ORGANIZATION MANAGEMENT
-- ========================================

DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS organization_access_requests CASCADE;
DROP TABLE IF EXISTS organization_invitations CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- ========================================
-- SECTION 9: PERSON RELATIONSHIP TABLES
-- ========================================

DROP TABLE IF EXISTS person_contacts CASCADE;
DROP TABLE IF EXISTS person_members CASCADE;
DROP TABLE IF EXISTS person_users CASCADE;

-- ========================================
-- SECTION 10: CORE AUTHENTICATION & USERS
-- ========================================

DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS persons CASCADE;
DROP TABLE IF EXISTS agent_organizations CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

COMMIT;

-- =============================================
-- END OF DROP SCRIPT
-- =============================================
-- All 75 tables have been dropped
-- Database is now in a clean state

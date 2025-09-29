-- =============================================
-- Drop All Tables Script
-- =============================================
-- Description: Safely drop all database objects in correct dependency order
-- Dependencies: None
-- Execution Order: 99 (Last)
-- WARNING: This will destroy all data permanently!

-- Confirm intention (uncomment the following line to enable dropping)
-- SET client_min_messages = warning;

BEGIN;

-- Drop tables in reverse dependency order to respect foreign key constraints

-- Advanced Features Tables
DROP TABLE IF EXISTS reward_notifications CASCADE;
DROP TABLE IF EXISTS reward_interactions CASCADE;
DROP TABLE IF EXISTS recommendation_models CASCADE;
DROP TABLE IF EXISTS reward_inventory CASCADE;
DROP TABLE IF EXISTS reward_recommendations CASCADE;
DROP TABLE IF EXISTS partial_redemptions CASCADE;
DROP TABLE IF EXISTS reward_pricing_history CASCADE;
DROP TABLE IF EXISTS reward_wishlists CASCADE;
DROP TABLE IF EXISTS user_seasonal_achievements CASCADE;
DROP TABLE IF EXISTS seasonal_achievements CASCADE;
DROP TABLE IF EXISTS campaign_participations CASCADE;
DROP TABLE IF EXISTS seasonal_campaigns CASCADE;

-- Social Features Tables
DROP TABLE IF EXISTS activity_comments CASCADE;
DROP TABLE IF EXISTS activity_likes CASCADE;
DROP TABLE IF EXISTS social_activities CASCADE;
DROP TABLE IF EXISTS leaderboard_rankings CASCADE;
DROP TABLE IF EXISTS social_referrals CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS social_media_integrations CASCADE;
DROP TABLE IF EXISTS achievement_shares CASCADE;
DROP TABLE IF EXISTS leaderboard_settings CASCADE;

-- Points and Rewards Tables
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS referral_signups CASCADE;
DROP TABLE IF EXISTS referral_codes CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS points_rules CASCADE;
DROP TABLE IF EXISTS reward_redemptions CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS points_summary CASCADE;
DROP TABLE IF EXISTS points_transactions CASCADE;

-- Association Tables
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS dependents CASCADE;
DROP TABLE IF EXISTS person_contacts CASCADE;
DROP TABLE IF EXISTS person_members CASCADE;
DROP TABLE IF EXISTS person_users CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- Claims and Workflow Tables
DROP TABLE IF EXISTS claim_workflow_steps CASCADE;
DROP TABLE IF EXISTS claim_communications CASCADE;
DROP TABLE IF EXISTS claim_documents CASCADE;
DROP TABLE IF EXISTS claims CASCADE;

-- Policy Tables
DROP TABLE IF EXISTS policy_amendments CASCADE;
DROP TABLE IF EXISTS premium_payments CASCADE;
DROP TABLE IF EXISTS policy_documents CASCADE;
DROP TABLE IF EXISTS policies CASCADE;

-- Insurance Tables
DROP TABLE IF EXISTS external_quote_requests CASCADE;
DROP TABLE IF EXISTS insurance_quotes CASCADE;
DROP TABLE IF EXISTS insurance_providers CASCADE;
DROP TABLE IF EXISTS insurance_types CASCADE;

-- Core Tables
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS persons CASCADE;
DROP TABLE IF EXISTS agent_organizations CASCADE;

-- Session Table
DROP TABLE IF EXISTS sessions CASCADE;

-- Drop any remaining sequences
DROP SEQUENCE IF EXISTS agent_organizations_id_seq CASCADE;
DROP SEQUENCE IF EXISTS persons_id_seq CASCADE;
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS roles_id_seq CASCADE;
DROP SEQUENCE IF EXISTS insurance_types_id_seq CASCADE;
DROP SEQUENCE IF EXISTS insurance_providers_id_seq CASCADE;
DROP SEQUENCE IF EXISTS insurance_quotes_id_seq CASCADE;
DROP SEQUENCE IF EXISTS external_quote_requests_id_seq CASCADE;
DROP SEQUENCE IF EXISTS policies_id_seq CASCADE;
DROP SEQUENCE IF EXISTS policy_documents_id_seq CASCADE;
DROP SEQUENCE IF EXISTS premium_payments_id_seq CASCADE;
DROP SEQUENCE IF EXISTS policy_amendments_id_seq CASCADE;
DROP SEQUENCE IF EXISTS claims_id_seq CASCADE;
DROP SEQUENCE IF EXISTS claim_documents_id_seq CASCADE;
DROP SEQUENCE IF EXISTS claim_communications_id_seq CASCADE;
DROP SEQUENCE IF EXISTS claim_workflow_steps_id_seq CASCADE;
DROP SEQUENCE IF EXISTS members_id_seq CASCADE;
DROP SEQUENCE IF EXISTS contacts_id_seq CASCADE;
DROP SEQUENCE IF EXISTS person_users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS person_members_id_seq CASCADE;
DROP SEQUENCE IF EXISTS person_contacts_id_seq CASCADE;
DROP SEQUENCE IF EXISTS dependents_id_seq CASCADE;
DROP SEQUENCE IF EXISTS applications_id_seq CASCADE;
DROP SEQUENCE IF EXISTS points_transactions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS points_summary_id_seq CASCADE;
DROP SEQUENCE IF EXISTS rewards_id_seq CASCADE;
DROP SEQUENCE IF EXISTS reward_redemptions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS points_rules_id_seq CASCADE;
DROP SEQUENCE IF EXISTS achievements_id_seq CASCADE;
DROP SEQUENCE IF EXISTS user_achievements_id_seq CASCADE;
DROP SEQUENCE IF EXISTS referral_codes_id_seq CASCADE;
DROP SEQUENCE IF EXISTS referral_signups_id_seq CASCADE;
DROP SEQUENCE IF EXISTS notifications_id_seq CASCADE;

-- Drop extensions (only if you want to completely reset the database)
-- DROP EXTENSION IF EXISTS "pgcrypto";
-- DROP EXTENSION IF EXISTS "uuid-ossp";

COMMIT;

-- Output confirmation
SELECT 'All tables have been dropped successfully. Database is now empty.' as status;
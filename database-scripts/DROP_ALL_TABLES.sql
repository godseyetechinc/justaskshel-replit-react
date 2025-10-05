-- ============================================================================
-- DROP ALL TABLES SCRIPT FOR JUSTASKSHEL
-- ============================================================================
-- Description: Drops all tables in correct dependency order (child -> parent)
-- Warning: This will delete ALL data in the database!
-- Use with caution - only for development/testing
-- ============================================================================

-- Drop tables in reverse dependency order to avoid foreign key constraint violations

-- Phase 1: Drop child tables with no dependents

DROP TABLE IF EXISTS public.campaign_participations CASCADE;
DROP TABLE IF EXISTS public.seasonal_campaigns CASCADE;
DROP TABLE IF EXISTS public.referral_signups CASCADE;
DROP TABLE IF EXISTS public.referral_codes CASCADE;
DROP TABLE IF EXISTS public.reward_wishlists CASCADE;
DROP TABLE IF EXISTS public.reward_redemptions CASCADE;
DROP TABLE IF EXISTS public.rewards CASCADE;
DROP TABLE IF EXISTS public.points CASCADE;
DROP TABLE IF EXISTS public.points_summary CASCADE;
DROP TABLE IF EXISTS public.points_transactions CASCADE;
DROP TABLE IF EXISTS public.points_rules CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.leaderboard_settings CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.claim_workflow_steps CASCADE;
DROP TABLE IF EXISTS public.claim_communications CASCADE;
DROP TABLE IF EXISTS public.claim_documents CASCADE;
DROP TABLE IF EXISTS public.claims CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.policy_amendments CASCADE;
DROP TABLE IF EXISTS public.policy_documents CASCADE;
DROP TABLE IF EXISTS public.agent_commissions CASCADE;
DROP TABLE IF EXISTS public.policy_transfers CASCADE;
DROP TABLE IF EXISTS public.policies CASCADE;
DROP TABLE IF EXISTS public.wishlist CASCADE;
DROP TABLE IF EXISTS public.selected_quotes CASCADE;
DROP TABLE IF EXISTS public.external_quote_requests CASCADE;
DROP TABLE IF EXISTS public.insurance_quotes CASCADE;
DROP TABLE IF EXISTS public.insurance_providers CASCADE;
DROP TABLE IF EXISTS public.insurance_types CASCADE;
DROP TABLE IF EXISTS public.dependents CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.client_assignments CASCADE;
DROP TABLE IF EXISTS public.agent_profiles CASCADE;

-- Phase 2: Drop association/junction tables
DROP TABLE IF EXISTS public.person_contacts CASCADE;
DROP TABLE IF EXISTS public.person_members CASCADE;
DROP TABLE IF EXISTS public.person_users CASCADE;

-- Phase 3: Drop authentication tables (Phase 2 enhancements)
DROP TABLE IF EXISTS public.login_history CASCADE;
DROP TABLE IF EXISTS public.mfa_verification_attempts CASCADE;
DROP TABLE IF EXISTS public.mfa_settings CASCADE;
DROP TABLE IF EXISTS public.mfa_config CASCADE;
DROP TABLE IF EXISTS public.password_reset_tokens CASCADE;
DROP TABLE IF EXISTS public.account_lockouts CASCADE;
DROP TABLE IF EXISTS public.organization_access_requests CASCADE;

-- Phase 4: Drop user-related tables
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.persons CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- Phase 5: Drop organization tables
DROP TABLE IF EXISTS public.agent_organizations CASCADE;

-- Phase 6: Drop session tables
DROP TABLE IF EXISTS public.sessions CASCADE;

-- Phase 7: Drop Drizzle migration tracking
DROP TABLE IF EXISTS drizzle.__drizzle_migrations CASCADE;
DROP SCHEMA IF EXISTS drizzle CASCADE;

-- ============================================================================
-- DROP ALL SEQUENCES
-- ============================================================================

DROP SEQUENCE IF EXISTS public.campaign_participations_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.seasonal_campaigns_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.referral_signups_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.referral_codes_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.reward_wishlists_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.reward_redemptions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.rewards_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.points_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.points_summary_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.points_transactions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.points_rules_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.user_achievements_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.achievements_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.leaderboard_settings_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.notifications_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.claim_workflow_steps_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.claim_communications_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.claim_documents_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.claims_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.applications_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.policy_amendments_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.policy_documents_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.agent_commissions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.policy_transfers_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.policies_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.wishlist_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.selected_quotes_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.external_quote_requests_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.insurance_quotes_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.insurance_providers_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.insurance_types_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.dependents_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.members_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.contacts_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.client_assignments_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.agent_profiles_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.login_history_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.mfa_verification_attempts_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.mfa_settings_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.mfa_config_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.password_reset_tokens_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.account_lockouts_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.organization_access_requests_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.roles_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.persons_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.agent_organizations_id_seq CASCADE;
DROP SEQUENCE IF EXISTS drizzle.__drizzle_migrations_id_seq CASCADE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Display remaining tables (should be empty)
SELECT 'Remaining tables in public schema:' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

SELECT 'Remaining sequences in public schema:' as status;
SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public';

-- ============================================================================
-- END OF DROP SCRIPT
-- ============================================================================


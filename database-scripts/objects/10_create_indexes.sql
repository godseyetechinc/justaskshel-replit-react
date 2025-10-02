-- =============================================
-- Database Indexes Creation Script
-- =============================================
-- Description: Create performance indexes for frequently queried columns
-- Dependencies: All table creation scripts
-- Execution Order: 10
-- Idempotent: Yes
-- Last Updated: October 02, 2025
-- =============================================

BEGIN;

-- =============================================
-- SECTION 1: CORE AUTHENTICATION & SESSION MANAGEMENT
-- =============================================

-- Session management
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Users and authentication
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_privilege_level ON users(privilege_level);
CREATE INDEX IF NOT EXISTS idx_users_org_privilege ON users(organization_id, privilege_level);

-- =============================================
-- SECTION 2: INSURANCE DOMAIN
-- =============================================

-- Insurance quotes
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_user_id ON insurance_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_type_id ON insurance_quotes(type_id);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_provider_id ON insurance_quotes(provider_id);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_expires_at ON insurance_quotes(expires_at);

-- External quote requests
CREATE INDEX IF NOT EXISTS idx_external_quote_requests_user_id ON external_quote_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_external_quote_requests_status ON external_quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_external_quote_requests_request_id ON external_quote_requests(request_id);

-- Selected quotes and wishlist
CREATE INDEX IF NOT EXISTS idx_selected_quotes_user_id ON selected_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_selected_quotes_quote_id ON selected_quotes(quote_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_quote_id ON wishlist(quote_id);

-- =============================================
-- SECTION 3: POLICY & CLAIMS MANAGEMENT
-- =============================================

-- Policies
CREATE INDEX IF NOT EXISTS idx_policies_user_id ON policies(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_selling_agent ON policies(selling_agent_id);
CREATE INDEX IF NOT EXISTS idx_policies_servicing_agent ON policies(servicing_agent_id);
CREATE INDEX IF NOT EXISTS idx_policies_organization ON policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_dates ON policies(start_date, end_date);

-- Claims
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_policy_id ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_assigned_agent ON claims(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_claims_incident_date ON claims(incident_date);

-- Claim documents
CREATE INDEX IF NOT EXISTS idx_claim_documents_claim_id ON claim_documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_documents_type ON claim_documents(document_type);

-- Claim communications
CREATE INDEX IF NOT EXISTS idx_claim_communications_claim_id ON claim_communications(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_communications_user_id ON claim_communications(user_id);

-- Claim workflow steps
CREATE INDEX IF NOT EXISTS idx_claim_workflow_steps_claim_id ON claim_workflow_steps(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_workflow_steps_assigned_to ON claim_workflow_steps(assigned_to);
CREATE INDEX IF NOT EXISTS idx_claim_workflow_steps_status ON claim_workflow_steps(status);

-- Policy documents
CREATE INDEX IF NOT EXISTS idx_policy_documents_policy_id ON policy_documents(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_documents_type ON policy_documents(document_type);

-- Premium payments
CREATE INDEX IF NOT EXISTS idx_premium_payments_policy_id ON premium_payments(policy_id);
CREATE INDEX IF NOT EXISTS idx_premium_payments_status ON premium_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_premium_payments_due_date ON premium_payments(due_date);

-- Policy amendments
CREATE INDEX IF NOT EXISTS idx_policy_amendments_policy_id ON policy_amendments(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_amendments_status ON policy_amendments(status);

-- Dependents
CREATE INDEX IF NOT EXISTS idx_dependents_user_id ON dependents(user_id);

-- =============================================
-- SECTION 4: MEMBER & ORGANIZATION MANAGEMENT
-- =============================================

-- Agent organizations
CREATE INDEX IF NOT EXISTS idx_agent_organizations_status ON agent_organizations(status);

-- Members
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_organization_id ON members(organization_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(membership_status);

-- Organization invitations
CREATE INDEX IF NOT EXISTS idx_organization_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_email ON organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_token ON organization_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_status ON organization_invitations(status);

-- Organization access requests
CREATE INDEX IF NOT EXISTS idx_access_requests_user ON organization_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_org ON organization_access_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON organization_access_requests(status);

-- Contacts
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_agent ON contacts(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

-- =============================================
-- SECTION 5: POINTS & REWARDS SYSTEM
-- =============================================

-- Points transactions
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at);

-- Points summary
CREATE INDEX IF NOT EXISTS idx_points_summary_user_id ON points_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_points_summary_tier_level ON points_summary(tier_level);

-- Points tiers
CREATE INDEX IF NOT EXISTS idx_points_tiers_tier_name ON points_tiers(tier_name);
CREATE INDEX IF NOT EXISTS idx_points_tiers_tier_level ON points_tiers(tier_level);

-- Tier progression history
CREATE INDEX IF NOT EXISTS idx_tier_progression_user_id ON tier_progression_history(user_id);
CREATE INDEX IF NOT EXISTS idx_tier_progression_date ON tier_progression_history(progressed_at);

-- Rewards
CREATE INDEX IF NOT EXISTS idx_rewards_category ON rewards(category);
CREATE INDEX IF NOT EXISTS idx_rewards_active ON rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_rewards_featured ON rewards(is_featured);
CREATE INDEX IF NOT EXISTS idx_rewards_points ON rewards(points_required);

-- Reward redemptions
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward_id ON reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);

-- Reward reviews
CREATE INDEX IF NOT EXISTS idx_reward_reviews_reward_id ON reward_reviews(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_reviews_user_id ON reward_reviews(user_id);

-- Points rules
CREATE INDEX IF NOT EXISTS idx_points_rules_active ON points_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_points_rules_trigger ON points_rules(trigger_event);

-- Achievements
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active);

-- User achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Referral codes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON referral_codes(is_active);

-- Referral tracking
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer ON referral_tracking(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referred ON referral_tracking(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_code ON referral_tracking(referral_code);

-- User notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(notification_type);

-- Notification preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Bulk points operations
CREATE INDEX IF NOT EXISTS idx_bulk_points_operations_initiated_by ON bulk_points_operations(initiated_by);
CREATE INDEX IF NOT EXISTS idx_bulk_points_operations_status ON bulk_points_operations(status);

-- Scheduled points tasks
CREATE INDEX IF NOT EXISTS idx_scheduled_points_tasks_active ON scheduled_points_tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_points_tasks_next_run ON scheduled_points_tasks(next_run_at);

-- Admin point adjustments
CREATE INDEX IF NOT EXISTS idx_admin_point_adjustments_user_id ON admin_point_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_point_adjustments_admin_id ON admin_point_adjustments(admin_id);

-- =============================================
-- SECTION 6: SOCIAL FEATURES & GAMIFICATION
-- =============================================

-- Seasonal campaigns
CREATE INDEX IF NOT EXISTS idx_seasonal_campaigns_active ON seasonal_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_seasonal_campaigns_dates ON seasonal_campaigns(start_date, end_date);

-- Campaign participations
CREATE INDEX IF NOT EXISTS idx_campaign_participations_campaign_id ON campaign_participations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participations_user_id ON campaign_participations(user_id);

-- Seasonal achievements
CREATE INDEX IF NOT EXISTS idx_seasonal_achievements_campaign_id ON seasonal_achievements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_achievements_active ON seasonal_achievements(is_active);

-- User seasonal achievements
CREATE INDEX IF NOT EXISTS idx_user_seasonal_achievements_user_id ON user_seasonal_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_seasonal_achievements_achievement_id ON user_seasonal_achievements(achievement_id);

-- Leaderboard settings
CREATE INDEX IF NOT EXISTS idx_leaderboard_settings_user_id ON leaderboard_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_settings_opted_in ON leaderboard_settings(is_opted_in);

-- Achievement shares
CREATE INDEX IF NOT EXISTS idx_achievement_shares_user_id ON achievement_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_shares_achievement_id ON achievement_shares(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievement_shares_type ON achievement_shares(share_type);

-- Social media integrations
CREATE INDEX IF NOT EXISTS idx_social_media_integrations_user_id ON social_media_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_social_media_integrations_platform ON social_media_integrations(platform);

-- Friendships
CREATE INDEX IF NOT EXISTS idx_friendships_requester_id ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee_id ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Social referrals
CREATE INDEX IF NOT EXISTS idx_social_referrals_referrer_id ON social_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_social_referrals_referred_user_id ON social_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_social_referrals_code ON social_referrals(referral_code);

-- Leaderboard rankings
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_user_id ON leaderboard_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_period ON leaderboard_rankings(period);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_category ON leaderboard_rankings(category);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_rank ON leaderboard_rankings(rank);

-- Social activities
CREATE INDEX IF NOT EXISTS idx_social_activities_user_id ON social_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_social_activities_type ON social_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_social_activities_public ON social_activities(is_public);

-- Activity likes
CREATE INDEX IF NOT EXISTS idx_activity_likes_activity_id ON activity_likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_likes_user_id ON activity_likes(user_id);

-- Activity comments
CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user_id ON activity_comments(user_id);

-- =============================================
-- SECTION 7: ADVANCED REDEMPTION OPTIONS
-- =============================================

-- Reward wishlists
CREATE INDEX IF NOT EXISTS idx_reward_wishlists_user_id ON reward_wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_wishlists_reward_id ON reward_wishlists(reward_id);

-- Reward pricing history
CREATE INDEX IF NOT EXISTS idx_reward_pricing_history_reward_id ON reward_pricing_history(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_pricing_history_valid_dates ON reward_pricing_history(valid_from, valid_until);

-- Partial redemptions
CREATE INDEX IF NOT EXISTS idx_partial_redemptions_user_id ON partial_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_partial_redemptions_reward_id ON partial_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_partial_redemptions_status ON partial_redemptions(status);

-- Reward recommendations
CREATE INDEX IF NOT EXISTS idx_reward_recommendations_user_id ON reward_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_recommendations_reward_id ON reward_recommendations(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_recommendations_type ON reward_recommendations(recommendation_type);

-- Reward inventory
CREATE INDEX IF NOT EXISTS idx_reward_inventory_reward_id ON reward_inventory(reward_id);

-- Recommendation models
CREATE INDEX IF NOT EXISTS idx_recommendation_models_active ON recommendation_models(is_active);
CREATE INDEX IF NOT EXISTS idx_recommendation_models_type ON recommendation_models(model_type);

-- Reward interactions
CREATE INDEX IF NOT EXISTS idx_reward_interactions_user_id ON reward_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_interactions_reward_id ON reward_interactions(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_interactions_type ON reward_interactions(interaction_type);

-- Reward notifications
CREATE INDEX IF NOT EXISTS idx_reward_notifications_user_id ON reward_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_notifications_reward_id ON reward_notifications(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_notifications_type ON reward_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_reward_notifications_read ON reward_notifications(is_read);

-- =============================================
-- SECTION 8: AGENT-POLICY RELATIONSHIP MANAGEMENT
-- =============================================

-- Agent profiles
CREATE INDEX IF NOT EXISTS idx_agent_profiles_user_id ON agent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_organization_id ON agent_profiles(organization_id);

-- Client assignments
CREATE INDEX IF NOT EXISTS idx_client_assignments_client_id ON client_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_agent_id ON client_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_organization_id ON client_assignments(organization_id);

-- Policy transfers
CREATE INDEX IF NOT EXISTS idx_policy_transfers_policy ON policy_transfers(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_transfers_from_agent ON policy_transfers(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_policy_transfers_to_agent ON policy_transfers(to_agent_id);

-- Agent commissions
CREATE INDEX IF NOT EXISTS idx_agent_commissions_agent ON agent_commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_policy ON agent_commissions(policy_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_status ON agent_commissions(payment_status);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_date ON agent_commissions(payment_date);

-- Agent performance
CREATE INDEX IF NOT EXISTS idx_agent_performance_agent_id ON agent_performance(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_organization_id ON agent_performance(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_period ON agent_performance(period_start, period_end);

-- Client activities
CREATE INDEX IF NOT EXISTS idx_client_activities_client_id ON client_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_agent_id ON client_activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_organization_id ON client_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_created_at ON client_activities(created_at);

-- Organization analytics
CREATE INDEX IF NOT EXISTS idx_organization_analytics_org_id ON organization_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_analytics_period ON organization_analytics(period_start, period_end);

-- Agent collaborations
CREATE INDEX IF NOT EXISTS idx_agent_collaborations_organization_id ON agent_collaborations(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_collaborations_initiator_id ON agent_collaborations(initiator_id);
CREATE INDEX IF NOT EXISTS idx_agent_collaborations_collaborator_id ON agent_collaborations(collaborator_id);

-- Organization knowledge base
CREATE INDEX IF NOT EXISTS idx_org_knowledge_base_organization_id ON organization_knowledge_base(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_knowledge_base_author_id ON organization_knowledge_base(author_id);
CREATE INDEX IF NOT EXISTS idx_org_knowledge_base_category ON organization_knowledge_base(category);

COMMIT;

-- =============================================
-- Verification
-- =============================================
SELECT 'Database indexes created successfully.' as status,
       COUNT(*) as total_indexes
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname NOT LIKE 'pg_%';

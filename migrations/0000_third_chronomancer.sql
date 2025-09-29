CREATE TABLE "achievement_shares" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"achievement_id" integer,
	"seasonal_achievement_id" integer,
	"share_type" varchar NOT NULL,
	"message" text,
	"image_url" varchar(500),
	"hashtags" varchar[],
	"is_public" boolean DEFAULT true,
	"likes_count" integer DEFAULT 0,
	"comments_count" integer DEFAULT 0,
	"shares_count" integer DEFAULT 0,
	"shared_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"category" varchar NOT NULL,
	"icon" varchar(50),
	"points_reward" integer DEFAULT 0,
	"requirements" jsonb,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"comment" text NOT NULL,
	"is_reply" boolean DEFAULT false,
	"parent_comment_id" integer,
	"likes_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"reaction_type" varchar DEFAULT 'Like',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_collaborations" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"initiator_id" varchar NOT NULL,
	"collaborator_id" varchar NOT NULL,
	"collaboration_type" varchar NOT NULL,
	"subject" varchar(200) NOT NULL,
	"description" text,
	"status" varchar DEFAULT 'Pending',
	"priority" varchar DEFAULT 'Medium',
	"scheduled_date" timestamp,
	"completed_date" timestamp,
	"outcome" text,
	"rating" integer,
	"is_public" boolean DEFAULT false,
	"tags" jsonb,
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"website" varchar(255),
	"phone" varchar(20),
	"email" varchar(100),
	"address" text,
	"city" varchar(50),
	"state" varchar(50),
	"zip_code" varchar(10),
	"logo_url" varchar(255),
	"primary_color" varchar(7) DEFAULT '#0EA5E9',
	"secondary_color" varchar(7) DEFAULT '#64748B',
	"status" varchar DEFAULT 'Active',
	"subscription_plan" varchar DEFAULT 'Basic',
	"subscription_status" varchar DEFAULT 'Trial',
	"max_agents" integer DEFAULT 5,
	"max_members" integer DEFAULT 100,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" varchar NOT NULL,
	"organization_id" integer NOT NULL,
	"period_type" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"quotes_generated" integer DEFAULT 0,
	"quotes_converted" integer DEFAULT 0,
	"policies_sold" integer DEFAULT 0,
	"total_revenue" numeric(10, 2) DEFAULT '0.00',
	"commissions_earned" numeric(10, 2) DEFAULT '0.00',
	"clients_added" integer DEFAULT 0,
	"clients_lost" integer DEFAULT 0,
	"activities_logged" integer DEFAULT 0,
	"response_time_avg" integer,
	"satisfaction_score" numeric(3, 2),
	"goals_achieved" integer DEFAULT 0,
	"goals_total" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"organization_id" integer NOT NULL,
	"specializations" jsonb,
	"bio" text,
	"license_number" varchar(50),
	"years_experience" integer,
	"languages_spoken" jsonb,
	"certifications" jsonb,
	"contact_preferences" jsonb,
	"availability_schedule" jsonb,
	"profile_image_url" varchar(255),
	"is_public_profile" boolean DEFAULT true,
	"is_accepting_clients" boolean DEFAULT true,
	"max_client_load" integer DEFAULT 100,
	"current_client_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_participations" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"points_earned" integer DEFAULT 0,
	"bonus_points_earned" integer DEFAULT 0,
	"participated_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "claim_communications" (
	"id" serial PRIMARY KEY NOT NULL,
	"claim_id" integer NOT NULL,
	"user_id" varchar,
	"message_type" varchar(50) NOT NULL,
	"subject" varchar(200),
	"message" text NOT NULL,
	"is_internal" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "claim_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"claim_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" integer,
	"document_type" varchar(50) NOT NULL,
	"uploaded_by" varchar,
	"uploaded_at" timestamp DEFAULT now(),
	"is_required" boolean DEFAULT false,
	"status" varchar(20) DEFAULT 'pending'
);
--> statement-breakpoint
CREATE TABLE "claim_workflow_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"claim_id" integer NOT NULL,
	"step_name" varchar(100) NOT NULL,
	"step_description" text,
	"status" varchar(20) NOT NULL,
	"assigned_to" varchar,
	"due_date" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"policy_id" integer,
	"claim_number" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"claim_type" varchar(50) NOT NULL,
	"incident_date" timestamp NOT NULL,
	"amount" numeric(10, 2),
	"estimated_amount" numeric(10, 2),
	"status" varchar(20) DEFAULT 'draft',
	"priority" varchar(20) DEFAULT 'normal',
	"assigned_agent" varchar,
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"processed_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"agent_id" varchar NOT NULL,
	"organization_id" integer NOT NULL,
	"activity_type" varchar NOT NULL,
	"subject" varchar(200) NOT NULL,
	"description" text,
	"duration" integer,
	"outcome" varchar,
	"next_action_required" boolean DEFAULT false,
	"next_action_date" timestamp,
	"next_action_description" text,
	"priority" varchar DEFAULT 'Medium',
	"tags" jsonb,
	"attachments" jsonb,
	"is_private" boolean DEFAULT false,
	"related_quote_id" integer,
	"related_policy_id" integer,
	"related_claim_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"agent_id" varchar NOT NULL,
	"organization_id" integer NOT NULL,
	"assignment_type" varchar DEFAULT 'Primary',
	"assigned_by" varchar NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"notes" text,
	"priority" varchar DEFAULT 'Medium',
	"status" varchar DEFAULT 'Active',
	"transfer_reason" text,
	"transferred_to" varchar,
	"transferred_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_id" integer,
	"organization_id" integer,
	"type" varchar NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"email" varchar(100),
	"phone" varchar(20),
	"company" varchar(100),
	"address" text,
	"city" varchar(50),
	"state" varchar(50),
	"zip_code" varchar(10),
	"notes" text,
	"status" varchar DEFAULT 'Active',
	"assigned_agent" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dependents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"relationship" varchar(20) NOT NULL,
	"date_of_birth" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "external_quote_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" varchar(100) NOT NULL,
	"user_id" varchar,
	"coverage_type" varchar(100) NOT NULL,
	"applicant_age" integer NOT NULL,
	"zip_code" varchar(10) NOT NULL,
	"coverage_amount" numeric(12, 2) NOT NULL,
	"term_length" integer,
	"payment_frequency" varchar(20),
	"effective_date" timestamp,
	"request_data" jsonb,
	"providers_queried" jsonb,
	"total_quotes_received" integer DEFAULT 0,
	"successful_providers" integer DEFAULT 0,
	"failed_providers" integer DEFAULT 0,
	"errors" jsonb,
	"status" varchar DEFAULT 'pending',
	"processing_started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "external_quote_requests_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" serial PRIMARY KEY NOT NULL,
	"requester_id" varchar NOT NULL,
	"addressee_id" varchar NOT NULL,
	"status" varchar DEFAULT 'Pending',
	"request_message" text,
	"created_at" timestamp DEFAULT now(),
	"responded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "insurance_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"logo" varchar(255),
	"rating" numeric(2, 1),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "insurance_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"type_id" integer,
	"provider_id" integer,
	"monthly_premium" numeric(10, 2) NOT NULL,
	"annual_premium" numeric(10, 2),
	"coverage_amount" numeric(12, 2),
	"term_length" integer,
	"deductible" numeric(10, 2),
	"medical_exam_required" boolean DEFAULT false,
	"conversion_option" boolean DEFAULT false,
	"features" jsonb,
	"rating" numeric(2, 1),
	"is_external" boolean DEFAULT false,
	"external_quote_id" varchar(255),
	"external_provider_id" varchar(100),
	"external_provider_name" varchar(255),
	"application_url" varchar(500),
	"expires_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "insurance_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"color" varchar(20),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leaderboard_rankings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"period" varchar NOT NULL,
	"category" varchar NOT NULL,
	"rank" integer NOT NULL,
	"score" integer NOT NULL,
	"previous_rank" integer,
	"rank_change" integer DEFAULT 0,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leaderboard_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"is_opted_in" boolean DEFAULT false,
	"display_name" varchar(100),
	"show_tier_level" boolean DEFAULT true,
	"show_total_points" boolean DEFAULT true,
	"show_recent_activity" boolean DEFAULT false,
	"visibility_level" varchar DEFAULT 'Public',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "leaderboard_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_id" integer,
	"user_id" varchar,
	"organization_id" integer,
	"member_number" varchar(20) NOT NULL,
	"first_name" varchar(50),
	"last_name" varchar(50),
	"email" varchar(100),
	"date_of_birth" timestamp,
	"phone" varchar(20),
	"address" text,
	"city" varchar(50),
	"state" varchar(50),
	"zip_code" varchar(10),
	"ssn" varchar(11),
	"profile_image_url" varchar,
	"avatar_type" varchar DEFAULT 'initials',
	"avatar_color" varchar(7) DEFAULT '#0EA5E9',
	"bio" text,
	"emergency_contact" text,
	"preferences" jsonb,
	"membership_status" varchar DEFAULT 'Active',
	"membership_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "members_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "members_member_number_unique" UNIQUE("member_number")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"is_read" boolean DEFAULT false,
	"priority" varchar DEFAULT 'Normal',
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "organization_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"period_type" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"total_agents" integer DEFAULT 0,
	"active_agents" integer DEFAULT 0,
	"total_members" integer DEFAULT 0,
	"new_members" integer DEFAULT 0,
	"lost_members" integer DEFAULT 0,
	"total_quotes" integer DEFAULT 0,
	"converted_quotes" integer DEFAULT 0,
	"total_policies" integer DEFAULT 0,
	"active_policies" integer DEFAULT 0,
	"total_claims" integer DEFAULT 0,
	"processed_claims" integer DEFAULT 0,
	"total_revenue" numeric(12, 2) DEFAULT '0.00',
	"total_commissions" numeric(12, 2) DEFAULT '0.00',
	"average_quote_value" numeric(10, 2) DEFAULT '0.00',
	"conversion_rate" numeric(5, 4) DEFAULT '0.0000',
	"customer_satisfaction" numeric(3, 2),
	"avg_response_time" integer,
	"top_performing_agent" varchar,
	"growth_rate" numeric(6, 4),
	"churn_rate" numeric(6, 4),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"email" varchar(100) NOT NULL,
	"role" varchar NOT NULL,
	"invited_by" varchar NOT NULL,
	"invitation_token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"accepted_by" varchar,
	"status" varchar DEFAULT 'Pending',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "organization_invitations_invitation_token_unique" UNIQUE("invitation_token")
);
--> statement-breakpoint
CREATE TABLE "organization_knowledge_base" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"author_id" varchar NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"category" varchar NOT NULL,
	"tags" jsonb,
	"is_public" boolean DEFAULT true,
	"is_pinned" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"version" integer DEFAULT 1,
	"last_reviewed_by" varchar,
	"last_reviewed_at" timestamp,
	"attachments" jsonb,
	"related_articles" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partial_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"reward_id" integer NOT NULL,
	"total_points_required" integer NOT NULL,
	"points_contributed" integer NOT NULL,
	"remaining_points" integer NOT NULL,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"reservation_id" varchar(50),
	"status" varchar DEFAULT 'Active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "person_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_id" integer NOT NULL,
	"contact_id" integer NOT NULL,
	"contact_context" varchar(50),
	"organization_id" integer,
	"assigned_agent" varchar,
	"contact_metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "person_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"organization_id" integer,
	"member_number" varchar(20),
	"membership_status" varchar(20) DEFAULT 'Active',
	"membership_date" timestamp DEFAULT now(),
	"additional_info" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "person_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"role_context" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"full_name" varchar(101),
	"date_of_birth" timestamp,
	"gender" varchar,
	"ssn_encrypted" varchar(255),
	"external_ids" jsonb,
	"primary_email" varchar(100),
	"secondary_email" varchar(100),
	"primary_phone" varchar(20),
	"secondary_phone" varchar(20),
	"street_address" text,
	"address_line_2" varchar(100),
	"city" varchar(50),
	"state" varchar(50),
	"zip_code" varchar(10),
	"country" varchar(50) DEFAULT 'USA',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" varchar,
	"updated_by" varchar,
	"is_verified" boolean DEFAULT false,
	"verification_date" timestamp,
	"data_source" varchar(50),
	"identity_hash" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "points_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"category" varchar NOT NULL,
	"points" integer NOT NULL,
	"max_per_period" integer,
	"period_type" varchar,
	"is_active" boolean DEFAULT true,
	"valid_from" timestamp DEFAULT now(),
	"valid_until" timestamp,
	"conditions" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "points_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"total_earned" integer DEFAULT 0,
	"total_redeemed" integer DEFAULT 0,
	"current_balance" integer DEFAULT 0,
	"lifetime_balance" integer DEFAULT 0,
	"tier_level" varchar DEFAULT 'Bronze',
	"tier_progress" integer DEFAULT 0,
	"next_tier_threshold" integer DEFAULT 500,
	"last_earned_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "points_summary_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "points_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"transaction_type" varchar NOT NULL,
	"points" integer NOT NULL,
	"description" text NOT NULL,
	"category" varchar NOT NULL,
	"reference_id" varchar,
	"reference_type" varchar,
	"balance_after" integer NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"quote_id" integer,
	"policy_number" varchar NOT NULL,
	"status" varchar DEFAULT 'active',
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"next_payment_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "policy_amendments" (
	"id" serial PRIMARY KEY NOT NULL,
	"policy_id" integer NOT NULL,
	"amendment_type" varchar NOT NULL,
	"amendment_number" varchar(50) NOT NULL,
	"effective_date" timestamp NOT NULL,
	"description" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"premium_impact" numeric(10, 2) DEFAULT '0',
	"status" varchar DEFAULT 'Draft',
	"requested_by" varchar,
	"approved_by" varchar,
	"implemented_by" varchar,
	"requested_at" timestamp DEFAULT now(),
	"approved_at" timestamp,
	"implemented_at" timestamp,
	"rejection_reason" text,
	"document_path" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "policy_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"policy_id" integer NOT NULL,
	"document_name" varchar(255) NOT NULL,
	"document_type" varchar NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" integer,
	"file_path" varchar(500),
	"uploaded_by" varchar,
	"uploaded_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "premium_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"policy_id" integer NOT NULL,
	"payment_amount" numeric(10, 2) NOT NULL,
	"payment_type" varchar DEFAULT 'Premium',
	"payment_method" varchar,
	"transaction_id" varchar(100),
	"payment_status" varchar DEFAULT 'Pending',
	"due_date" timestamp NOT NULL,
	"paid_date" timestamp,
	"grace_period_end" timestamp,
	"late_fee_amount" numeric(10, 2) DEFAULT '0',
	"is_auto_pay" boolean DEFAULT false,
	"payment_reference" varchar(100),
	"notes" text,
	"processed_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recommendation_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_name" varchar(100) NOT NULL,
	"model_type" varchar NOT NULL,
	"version" varchar(20) DEFAULT '1.0',
	"is_active" boolean DEFAULT false,
	"accuracy" numeric(5, 4),
	"precision" numeric(5, 4),
	"recall" numeric(5, 4),
	"training_data" jsonb,
	"hyperparameters" jsonb,
	"training_started" timestamp,
	"training_completed" timestamp,
	"last_prediction" timestamp,
	"deployed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"code" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true,
	"max_uses" integer,
	"current_uses" integer DEFAULT 0,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referral_signups" (
	"id" serial PRIMARY KEY NOT NULL,
	"referral_code_id" integer NOT NULL,
	"referrer_id" varchar NOT NULL,
	"referee_id" varchar NOT NULL,
	"referrer_points" integer DEFAULT 200,
	"referee_points" integer DEFAULT 100,
	"status" varchar DEFAULT 'Completed',
	"completed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reward_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"reward_id" integer NOT NULL,
	"interaction_type" varchar NOT NULL,
	"session_id" varchar(100),
	"device_type" varchar(50),
	"user_agent" varchar(500),
	"referrer_source" varchar(200),
	"time_spent" integer,
	"page_depth" integer,
	"interaction_metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reward_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"reward_id" integer NOT NULL,
	"total_stock" integer,
	"available_stock" integer,
	"reserved_stock" integer DEFAULT 0,
	"low_stock_threshold" integer DEFAULT 10,
	"is_out_of_stock" boolean DEFAULT false,
	"auto_restock" boolean DEFAULT false,
	"restock_level" integer,
	"last_restocked" timestamp,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "reward_inventory_reward_id_unique" UNIQUE("reward_id")
);
--> statement-breakpoint
CREATE TABLE "reward_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"reward_id" integer,
	"notification_type" varchar NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"action_url" varchar(500),
	"priority" varchar DEFAULT 'Medium',
	"is_read" boolean DEFAULT false,
	"is_action_taken" boolean DEFAULT false,
	"delivery_method" varchar DEFAULT 'In-App',
	"sent_at" timestamp,
	"read_at" timestamp,
	"action_taken_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reward_pricing_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"reward_id" integer NOT NULL,
	"original_price" integer NOT NULL,
	"adjusted_price" integer NOT NULL,
	"demand_multiplier" numeric(3, 2) DEFAULT '1.00',
	"redemption_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"demand_level" varchar DEFAULT 'Normal',
	"price_change_reason" varchar,
	"valid_from" timestamp DEFAULT now(),
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reward_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"reward_id" integer NOT NULL,
	"recommendation_type" varchar NOT NULL,
	"confidence_score" numeric(3, 2),
	"reasoning" text,
	"user_behavior_data" jsonb,
	"is_viewed" boolean DEFAULT false,
	"is_clicked" boolean DEFAULT false,
	"is_redeemed" boolean DEFAULT false,
	"viewed_at" timestamp,
	"clicked_at" timestamp,
	"redeemed_at" timestamp,
	"rank" integer,
	"generated_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reward_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"reward_id" integer NOT NULL,
	"points_transaction_id" integer,
	"points_used" integer NOT NULL,
	"status" varchar DEFAULT 'Pending',
	"redemption_code" varchar(50),
	"delivery_method" varchar,
	"delivery_address" text,
	"delivered_at" timestamp,
	"expires_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reward_wishlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"reward_id" integer NOT NULL,
	"priority" integer DEFAULT 1,
	"target_points_goal" integer,
	"is_notifications_enabled" boolean DEFAULT true,
	"price_alert_threshold" numeric(5, 2),
	"added_at" timestamp DEFAULT now(),
	"last_notified" timestamp
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"category" varchar NOT NULL,
	"points_cost" integer NOT NULL,
	"value" numeric(10, 2),
	"image_url" varchar,
	"available_quantity" integer,
	"is_active" boolean DEFAULT true,
	"valid_from" timestamp DEFAULT now(),
	"valid_until" timestamp,
	"terms" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"privilege_level" integer NOT NULL,
	"description" text,
	"permissions" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_name_unique" UNIQUE("name"),
	CONSTRAINT "roles_privilege_level_unique" UNIQUE("privilege_level")
);
--> statement-breakpoint
CREATE TABLE "seasonal_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer,
	"name" varchar(200) NOT NULL,
	"description" text,
	"icon" varchar(100),
	"category" varchar NOT NULL,
	"points_reward" integer DEFAULT 0,
	"requirement" jsonb,
	"is_repeatable" boolean DEFAULT false,
	"max_unlocks" integer DEFAULT 1,
	"unlock_order" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"valid_from" timestamp DEFAULT now(),
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seasonal_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"campaign_type" varchar NOT NULL,
	"points_multiplier" numeric(3, 2) DEFAULT '1.00',
	"bonus_points" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"auto_start" boolean DEFAULT false,
	"auto_end" boolean DEFAULT true,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"target_user_tiers" varchar[],
	"target_categories" varchar[],
	"max_participants" integer,
	"current_participants" integer DEFAULT 0,
	"conditions" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "selected_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"quote_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"activity_type" varchar NOT NULL,
	"description" text NOT NULL,
	"points_involved" integer,
	"achievement_id" integer,
	"is_public" boolean DEFAULT true,
	"likes_count" integer DEFAULT 0,
	"comments_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_media_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"platform" varchar NOT NULL,
	"platform_user_id" varchar(200),
	"platform_username" varchar(100),
	"is_connected" boolean DEFAULT true,
	"bonus_points_earned" integer DEFAULT 0,
	"last_activity_sync" timestamp,
	"connection_bonus_awarded" boolean DEFAULT false,
	"connected_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_id" varchar NOT NULL,
	"referred_user_id" varchar,
	"referral_code" varchar(20) NOT NULL,
	"invite_method" varchar NOT NULL,
	"platform_used" varchar(50),
	"bonus_tier" varchar DEFAULT 'Standard',
	"referrer_reward" integer DEFAULT 0,
	"referred_reward" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "social_referrals_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"achievement_id" integer NOT NULL,
	"unlocked_at" timestamp DEFAULT now(),
	"progress" jsonb,
	"points_awarded" integer DEFAULT 0,
	"notification_sent" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "user_seasonal_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"achievement_id" integer NOT NULL,
	"campaign_id" integer NOT NULL,
	"points_awarded" integer DEFAULT 0,
	"unlocked_at" timestamp DEFAULT now(),
	"tier" varchar,
	"progress_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" integer,
	"email" varchar,
	"profile_image_url" varchar,
	"password" varchar(255),
	"role" varchar DEFAULT 'Guest',
	"privilege_level" integer DEFAULT 4,
	"organization_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wishlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"quote_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "achievement_shares" ADD CONSTRAINT "achievement_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievement_shares" ADD CONSTRAINT "achievement_shares_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievement_shares" ADD CONSTRAINT "achievement_shares_seasonal_achievement_id_seasonal_achievements_id_fk" FOREIGN KEY ("seasonal_achievement_id") REFERENCES "public"."seasonal_achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_comments" ADD CONSTRAINT "activity_comments_activity_id_social_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."social_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_comments" ADD CONSTRAINT "activity_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_likes" ADD CONSTRAINT "activity_likes_activity_id_social_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."social_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_likes" ADD CONSTRAINT "activity_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_collaborations" ADD CONSTRAINT "agent_collaborations_organization_id_agent_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."agent_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_collaborations" ADD CONSTRAINT "agent_collaborations_initiator_id_users_id_fk" FOREIGN KEY ("initiator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_collaborations" ADD CONSTRAINT "agent_collaborations_collaborator_id_users_id_fk" FOREIGN KEY ("collaborator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_performance" ADD CONSTRAINT "agent_performance_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_performance" ADD CONSTRAINT "agent_performance_organization_id_agent_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."agent_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_organization_id_agent_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."agent_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_participations" ADD CONSTRAINT "campaign_participations_campaign_id_seasonal_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."seasonal_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_participations" ADD CONSTRAINT "campaign_participations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_communications" ADD CONSTRAINT "claim_communications_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_communications" ADD CONSTRAINT "claim_communications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_documents" ADD CONSTRAINT "claim_documents_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_documents" ADD CONSTRAINT "claim_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_workflow_steps" ADD CONSTRAINT "claim_workflow_steps_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_workflow_steps" ADD CONSTRAINT "claim_workflow_steps_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_assigned_agent_users_id_fk" FOREIGN KEY ("assigned_agent") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_activities" ADD CONSTRAINT "client_activities_client_id_members_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_activities" ADD CONSTRAINT "client_activities_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_activities" ADD CONSTRAINT "client_activities_organization_id_agent_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."agent_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_activities" ADD CONSTRAINT "client_activities_related_quote_id_insurance_quotes_id_fk" FOREIGN KEY ("related_quote_id") REFERENCES "public"."insurance_quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_activities" ADD CONSTRAINT "client_activities_related_policy_id_policies_id_fk" FOREIGN KEY ("related_policy_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_activities" ADD CONSTRAINT "client_activities_related_claim_id_claims_id_fk" FOREIGN KEY ("related_claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_assignments" ADD CONSTRAINT "client_assignments_client_id_members_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_assignments" ADD CONSTRAINT "client_assignments_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_assignments" ADD CONSTRAINT "client_assignments_organization_id_agent_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."agent_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_assignments" ADD CONSTRAINT "client_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_assignments" ADD CONSTRAINT "client_assignments_transferred_to_users_id_fk" FOREIGN KEY ("transferred_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_organization_id_agent_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."agent_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_assigned_agent_users_id_fk" FOREIGN KEY ("assigned_agent") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dependents" ADD CONSTRAINT "dependents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_quote_requests" ADD CONSTRAINT "external_quote_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_users_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_quotes" ADD CONSTRAINT "insurance_quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_quotes" ADD CONSTRAINT "insurance_quotes_type_id_insurance_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."insurance_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_quotes" ADD CONSTRAINT "insurance_quotes_provider_id_insurance_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."insurance_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_rankings" ADD CONSTRAINT "leaderboard_rankings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_settings" ADD CONSTRAINT "leaderboard_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_organization_id_agent_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."agent_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_analytics" ADD CONSTRAINT "organization_analytics_organization_id_agent_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."agent_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_analytics" ADD CONSTRAINT "organization_analytics_top_performing_agent_users_id_fk" FOREIGN KEY ("top_performing_agent") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_agent_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."agent_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_knowledge_base" ADD CONSTRAINT "organization_knowledge_base_organization_id_agent_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."agent_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_knowledge_base" ADD CONSTRAINT "organization_knowledge_base_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_knowledge_base" ADD CONSTRAINT "organization_knowledge_base_last_reviewed_by_users_id_fk" FOREIGN KEY ("last_reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partial_redemptions" ADD CONSTRAINT "partial_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partial_redemptions" ADD CONSTRAINT "partial_redemptions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_contacts" ADD CONSTRAINT "person_contacts_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_contacts" ADD CONSTRAINT "person_contacts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_contacts" ADD CONSTRAINT "person_contacts_organization_id_agent_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."agent_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_contacts" ADD CONSTRAINT "person_contacts_assigned_agent_users_id_fk" FOREIGN KEY ("assigned_agent") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_members" ADD CONSTRAINT "person_members_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_members" ADD CONSTRAINT "person_members_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_members" ADD CONSTRAINT "person_members_organization_id_agent_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."agent_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_users" ADD CONSTRAINT "person_users_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_users" ADD CONSTRAINT "person_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_summary" ADD CONSTRAINT "points_summary_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_amendments" ADD CONSTRAINT "policy_amendments_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_amendments" ADD CONSTRAINT "policy_amendments_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_amendments" ADD CONSTRAINT "policy_amendments_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_amendments" ADD CONSTRAINT "policy_amendments_implemented_by_users_id_fk" FOREIGN KEY ("implemented_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_documents" ADD CONSTRAINT "policy_documents_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_documents" ADD CONSTRAINT "policy_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premium_payments" ADD CONSTRAINT "premium_payments_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premium_payments" ADD CONSTRAINT "premium_payments_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_signups" ADD CONSTRAINT "referral_signups_referral_code_id_referral_codes_id_fk" FOREIGN KEY ("referral_code_id") REFERENCES "public"."referral_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_signups" ADD CONSTRAINT "referral_signups_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_signups" ADD CONSTRAINT "referral_signups_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_interactions" ADD CONSTRAINT "reward_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_interactions" ADD CONSTRAINT "reward_interactions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_inventory" ADD CONSTRAINT "reward_inventory_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_notifications" ADD CONSTRAINT "reward_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_notifications" ADD CONSTRAINT "reward_notifications_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_pricing_history" ADD CONSTRAINT "reward_pricing_history_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_recommendations" ADD CONSTRAINT "reward_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_recommendations" ADD CONSTRAINT "reward_recommendations_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_points_transaction_id_points_transactions_id_fk" FOREIGN KEY ("points_transaction_id") REFERENCES "public"."points_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_wishlists" ADD CONSTRAINT "reward_wishlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_wishlists" ADD CONSTRAINT "reward_wishlists_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasonal_achievements" ADD CONSTRAINT "seasonal_achievements_campaign_id_seasonal_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."seasonal_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "selected_quotes" ADD CONSTRAINT "selected_quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "selected_quotes" ADD CONSTRAINT "selected_quotes_quote_id_insurance_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."insurance_quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_activities" ADD CONSTRAINT "social_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_activities" ADD CONSTRAINT "social_activities_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_integrations" ADD CONSTRAINT "social_media_integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_referrals" ADD CONSTRAINT "social_referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_referrals" ADD CONSTRAINT "social_referrals_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_seasonal_achievements" ADD CONSTRAINT "user_seasonal_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_seasonal_achievements" ADD CONSTRAINT "user_seasonal_achievements_achievement_id_seasonal_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."seasonal_achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_seasonal_achievements" ADD CONSTRAINT "user_seasonal_achievements_campaign_id_seasonal_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."seasonal_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_agent_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."agent_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_quote_id_insurance_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."insurance_quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agent_collaborations_organization_id" ON "agent_collaborations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_agent_collaborations_initiator_id" ON "agent_collaborations" USING btree ("initiator_id");--> statement-breakpoint
CREATE INDEX "idx_agent_collaborations_collaborator_id" ON "agent_collaborations" USING btree ("collaborator_id");--> statement-breakpoint
CREATE INDEX "idx_agent_performance_agent_id" ON "agent_performance" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_agent_performance_organization_id" ON "agent_performance" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_agent_performance_period" ON "agent_performance" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_agent_profiles_user_id" ON "agent_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_agent_profiles_organization_id" ON "agent_profiles" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_client_activities_client_id" ON "client_activities" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_client_activities_agent_id" ON "client_activities" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_client_activities_organization_id" ON "client_activities" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_client_activities_created_at" ON "client_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_client_assignments_client_id" ON "client_assignments" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_client_assignments_agent_id" ON "client_assignments" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_client_assignments_organization_id" ON "client_assignments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_is_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_type" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_organization_analytics_org_id" ON "organization_analytics" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_organization_analytics_period" ON "organization_analytics" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_organization_invitations_org_id" ON "organization_invitations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_organization_invitations_email" ON "organization_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_organization_invitations_token" ON "organization_invitations" USING btree ("invitation_token");--> statement-breakpoint
CREATE INDEX "idx_org_knowledge_base_organization_id" ON "organization_knowledge_base" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_org_knowledge_base_author_id" ON "organization_knowledge_base" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_org_knowledge_base_category" ON "organization_knowledge_base" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_person_contacts_person_id" ON "person_contacts" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "idx_person_contacts_contact_id" ON "person_contacts" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "idx_person_members_person_id" ON "person_members" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "idx_person_members_member_id" ON "person_members" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_person_users_person_id" ON "person_users" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "idx_person_users_user_id" ON "person_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_persons_name" ON "persons" USING btree ("last_name","first_name");--> statement-breakpoint
CREATE INDEX "idx_persons_primary_email" ON "persons" USING btree ("primary_email");--> statement-breakpoint
CREATE INDEX "idx_persons_primary_phone" ON "persons" USING btree ("primary_phone");--> statement-breakpoint
CREATE INDEX "idx_persons_identity_hash" ON "persons" USING btree ("identity_hash");--> statement-breakpoint
CREATE INDEX "idx_referral_codes_code" ON "referral_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_referral_codes_user_id" ON "referral_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_referral_signups_referrer_id" ON "referral_signups" USING btree ("referrer_id");--> statement-breakpoint
CREATE INDEX "idx_referral_signups_referee_id" ON "referral_signups" USING btree ("referee_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_user_achievements_user_id" ON "user_achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_achievements_achievement_id" ON "user_achievements" USING btree ("achievement_id");
-- ========================================
-- JUSTASKSHEL COMPLETE DATABASE SCHEMA
-- Enterprise Insurance Marketplace Platform
-- Last Updated: October 02, 2025
-- ========================================

-- DESCRIPTION:
-- This file contains the complete database schema for JustAskShel, 
-- an enterprise-grade insurance comparison and management platform
-- with multi-tenancy, role-based access control, points & rewards system,
-- and comprehensive agent-policy relationship management.

-- ========================================
-- TABLE OF CONTENTS:
-- 1. Core Authentication & Session Management
-- 2. Insurance Domain Tables
-- 3. Policy & Claims Management
-- 4. Member & Organization Management
-- 5. Points & Rewards System
-- 6. Social Features & Gamification
-- 7. Agent-Policy Relationship Management
-- 8. Advanced Analytics & Reporting
-- ========================================

-- ========================================
-- SECTION 1: CORE AUTHENTICATION & SESSION MANAGEMENT
-- ========================================

-- Session storage table (required for Replit Auth)
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions(expire);

-- Unified persons entity model
CREATE TABLE IF NOT EXISTS persons (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  date_of_birth TIMESTAMP,
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  ssn VARCHAR(11),
  profile_image_url VARCHAR(255),
  emergency_contact TEXT,
  preferences JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table with role-based authorization
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id INTEGER REFERENCES persons(id),
  email VARCHAR UNIQUE,
  profile_image_url VARCHAR,
  password VARCHAR(255),
  role VARCHAR CHECK (role IN ('SuperAdmin', 'TenantAdmin', 'Agent', 'Member', 'Guest', 'Visitor')) DEFAULT 'Guest',
  privilege_level INTEGER DEFAULT 4,
  organization_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_privilege_level ON users(privilege_level);
CREATE INDEX IF NOT EXISTS idx_users_org_privilege ON users(organization_id, privilege_level);

-- Roles definition table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  privilege_level INTEGER UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Person role relationship tables
CREATE TABLE IF NOT EXISTS person_users (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES persons(id) NOT NULL,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS person_members (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES persons(id) NOT NULL,
  member_id INTEGER NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS person_contacts (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES persons(id) NOT NULL,
  contact_id INTEGER NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- SECTION 2: INSURANCE DOMAIN TABLES
-- ========================================

-- Insurance types
CREATE TABLE IF NOT EXISTS insurance_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insurance providers
CREATE TABLE IF NOT EXISTS insurance_providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  logo VARCHAR(255),
  rating DECIMAL(2, 1),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insurance quotes (internal and external)
CREATE TABLE IF NOT EXISTS insurance_quotes (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  type_id INTEGER REFERENCES insurance_types(id),
  provider_id INTEGER REFERENCES insurance_providers(id),
  monthly_premium DECIMAL(10, 2) NOT NULL,
  annual_premium DECIMAL(10, 2),
  coverage_amount DECIMAL(12, 2),
  term_length INTEGER,
  deductible DECIMAL(10, 2),
  medical_exam_required BOOLEAN DEFAULT false,
  conversion_option BOOLEAN DEFAULT false,
  features JSONB,
  rating DECIMAL(2, 1),
  is_external BOOLEAN DEFAULT false,
  external_quote_id VARCHAR(255),
  external_provider_id VARCHAR(100),
  external_provider_name VARCHAR(255),
  application_url VARCHAR(500),
  expires_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- External quote requests tracking
CREATE TABLE IF NOT EXISTS external_quote_requests (
  id SERIAL PRIMARY KEY,
  request_id VARCHAR(100) UNIQUE NOT NULL,
  user_id VARCHAR REFERENCES users(id),
  coverage_type VARCHAR(100) NOT NULL,
  applicant_age INTEGER NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  coverage_amount DECIMAL(12, 2) NOT NULL,
  term_length INTEGER,
  payment_frequency VARCHAR(20),
  effective_date TIMESTAMP,
  request_data JSONB,
  providers_queried JSONB,
  total_quotes_received INTEGER DEFAULT 0,
  successful_providers INTEGER DEFAULT 0,
  failed_providers INTEGER DEFAULT 0,
  errors JSONB,
  status VARCHAR CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')) DEFAULT 'pending',
  processing_started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User selected quotes
CREATE TABLE IF NOT EXISTS selected_quotes (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  quote_id INTEGER REFERENCES insurance_quotes(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User wishlist
CREATE TABLE IF NOT EXISTS wishlist (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  quote_id INTEGER REFERENCES insurance_quotes(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- SECTION 3: POLICY & CLAIMS MANAGEMENT
-- ========================================

-- Agent organizations (multi-tenant) - Must be created before policies
CREATE TABLE IF NOT EXISTS agent_organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  website VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  logo_url VARCHAR(255),
  primary_color VARCHAR(7) DEFAULT '#0EA5E9',
  secondary_color VARCHAR(7) DEFAULT '#64748B',
  status VARCHAR CHECK (status IN ('Active', 'Inactive', 'Suspended')) DEFAULT 'Active',
  subscription_plan VARCHAR CHECK (subscription_plan IN ('Basic', 'Professional', 'Enterprise')) DEFAULT 'Basic',
  subscription_status VARCHAR CHECK (subscription_status IN ('Active', 'Inactive', 'Trial', 'Expired')) DEFAULT 'Trial',
  max_agents INTEGER DEFAULT 5,
  max_members INTEGER DEFAULT 100,
  settings JSONB,
  is_system_organization BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints after agent_organizations is created
ALTER TABLE users ADD CONSTRAINT fk_users_organization 
  FOREIGN KEY (organization_id) REFERENCES agent_organizations(id);

-- Policies table with agent relationships
CREATE TABLE IF NOT EXISTS policies (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  quote_id INTEGER,
  policy_number VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'active',
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  next_payment_date TIMESTAMP,
  selling_agent_id VARCHAR REFERENCES users(id),
  servicing_agent_id VARCHAR REFERENCES users(id),
  organization_id INTEGER REFERENCES agent_organizations(id),
  agent_commission_rate DECIMAL(5, 2) DEFAULT 0.00,
  agent_commission_paid BOOLEAN DEFAULT false,
  agent_assigned_at TIMESTAMP,
  policy_source VARCHAR(50),
  referral_source VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_policies_selling_agent ON policies(selling_agent_id);
CREATE INDEX IF NOT EXISTS idx_policies_servicing_agent ON policies(servicing_agent_id);
CREATE INDEX IF NOT EXISTS idx_policies_organization ON policies(organization_id);

-- Claims management
CREATE TABLE IF NOT EXISTS claims (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  policy_id INTEGER REFERENCES policies(id),
  claim_number VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  claim_type VARCHAR(50) NOT NULL,
  incident_date TIMESTAMP NOT NULL,
  amount DECIMAL(10, 2),
  estimated_amount DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'draft',
  priority VARCHAR(20) DEFAULT 'normal',
  assigned_agent VARCHAR REFERENCES users(id),
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  processed_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Claim documents
CREATE TABLE IF NOT EXISTS claim_documents (
  id SERIAL PRIMARY KEY,
  claim_id INTEGER REFERENCES claims(id) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER,
  document_type VARCHAR(50) NOT NULL,
  uploaded_by VARCHAR REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_required BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pending'
);

-- Claim communications
CREATE TABLE IF NOT EXISTS claim_communications (
  id SERIAL PRIMARY KEY,
  claim_id INTEGER REFERENCES claims(id) NOT NULL,
  user_id VARCHAR REFERENCES users(id),
  message_type VARCHAR(50) NOT NULL,
  subject VARCHAR(200),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Claim workflow steps
CREATE TABLE IF NOT EXISTS claim_workflow_steps (
  id SERIAL PRIMARY KEY,
  claim_id INTEGER REFERENCES claims(id) NOT NULL,
  step_name VARCHAR(100) NOT NULL,
  step_description TEXT,
  status VARCHAR(20) NOT NULL,
  assigned_to VARCHAR REFERENCES users(id),
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Policy documents
CREATE TABLE IF NOT EXISTS policy_documents (
  id SERIAL PRIMARY KEY,
  policy_id INTEGER REFERENCES policies(id) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR CHECK (document_type IN ('Policy Certificate', 'Application', 'Medical Records', 'Beneficiary Form', 'Amendment', 'Payment Receipt', 'Cancellation Notice', 'Other')) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER,
  file_path VARCHAR(500),
  uploaded_by VARCHAR REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Premium payments tracking
CREATE TABLE IF NOT EXISTS premium_payments (
  id SERIAL PRIMARY KEY,
  policy_id INTEGER REFERENCES policies(id) NOT NULL,
  payment_amount DECIMAL(10, 2) NOT NULL,
  payment_type VARCHAR CHECK (payment_type IN ('Premium', 'Late Fee', 'Processing Fee', 'Adjustment', 'Refund')) DEFAULT 'Premium',
  payment_method VARCHAR CHECK (payment_method IN ('Credit Card', 'Bank Transfer', 'Check', 'Cash', 'ACH', 'Wire Transfer')),
  transaction_id VARCHAR(100),
  payment_status VARCHAR CHECK (payment_status IN ('Pending', 'Processed', 'Failed', 'Cancelled', 'Refunded')) DEFAULT 'Pending',
  due_date TIMESTAMP NOT NULL,
  paid_date TIMESTAMP,
  grace_period_end TIMESTAMP,
  late_fee_amount DECIMAL(10, 2) DEFAULT 0,
  is_auto_pay BOOLEAN DEFAULT false,
  payment_reference VARCHAR(100),
  notes TEXT,
  processed_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Policy amendments
CREATE TABLE IF NOT EXISTS policy_amendments (
  id SERIAL PRIMARY KEY,
  policy_id INTEGER REFERENCES policies(id) NOT NULL,
  amendment_type VARCHAR CHECK (amendment_type IN ('Beneficiary Change', 'Coverage Change', 'Premium Adjustment', 'Address Change', 'Name Change', 'Payment Method Change', 'Other')) NOT NULL,
  amendment_number VARCHAR(50) NOT NULL,
  effective_date TIMESTAMP NOT NULL,
  description TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  premium_impact DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR CHECK (status IN ('Draft', 'Pending Review', 'Approved', 'Implemented', 'Rejected', 'Cancelled')) DEFAULT 'Draft',
  requested_by VARCHAR REFERENCES users(id),
  approved_by VARCHAR REFERENCES users(id),
  implemented_by VARCHAR REFERENCES users(id),
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  implemented_at TIMESTAMP,
  rejection_reason TEXT,
  document_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dependents
CREATE TABLE IF NOT EXISTS dependents (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  relationship VARCHAR(20) NOT NULL,
  date_of_birth TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- SECTION 4: MEMBER & ORGANIZATION MANAGEMENT
-- ========================================

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES persons(id),
  user_id VARCHAR UNIQUE REFERENCES users(id),
  organization_id INTEGER REFERENCES agent_organizations(id),
  member_number VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  email VARCHAR(100),
  date_of_birth TIMESTAMP,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  ssn VARCHAR(11),
  profile_image_url VARCHAR,
  avatar_type VARCHAR CHECK (avatar_type IN ('initials', 'image', 'generated')) DEFAULT 'initials',
  avatar_color VARCHAR(7) DEFAULT '#0EA5E9',
  bio TEXT,
  emergency_contact TEXT,
  preferences JSONB,
  membership_status VARCHAR CHECK (membership_status IN ('Active', 'Inactive', 'Suspended')) DEFAULT 'Active',
  membership_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organization invitations
CREATE TABLE IF NOT EXISTS organization_invitations (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES agent_organizations(id) NOT NULL,
  email VARCHAR(100) NOT NULL,
  role VARCHAR CHECK (role IN ('Agent', 'Member')) NOT NULL,
  invited_by VARCHAR REFERENCES users(id) NOT NULL,
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  accepted_by VARCHAR REFERENCES users(id),
  status VARCHAR CHECK (status IN ('Pending', 'Accepted', 'Expired', 'Revoked')) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_email ON organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_token ON organization_invitations(invitation_token);

-- Organization access requests (Phase 1: Login Flow)
CREATE TABLE IF NOT EXISTS organization_access_requests (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  organization_id INTEGER REFERENCES agent_organizations(id) NOT NULL,
  request_reason TEXT NOT NULL,
  desired_role VARCHAR CHECK (desired_role IN ('Agent', 'Member')),
  status VARCHAR CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_by VARCHAR REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_access_requests_user ON organization_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_org ON organization_access_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON organization_access_requests(status);

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES persons(id),
  organization_id INTEGER REFERENCES agent_organizations(id),
  type VARCHAR CHECK (type IN ('Lead', 'Customer', 'Provider', 'Agent')) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  company VARCHAR(100),
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  notes TEXT,
  status VARCHAR CHECK (status IN ('Active', 'Inactive', 'Prospect')) DEFAULT 'Active',
  assigned_agent VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- SECTION 5: POINTS & REWARDS SYSTEM
-- ========================================

-- Points transactions
CREATE TABLE IF NOT EXISTS points_transactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  transaction_type VARCHAR CHECK (transaction_type IN ('Earned', 'Redeemed', 'Expired', 'Adjustment', 'Bonus', 'Referral')) NOT NULL,
  points INTEGER NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR CHECK (category IN ('Policy Purchase', 'Claim Submission', 'Referral', 'Login', 'Profile Complete', 'Newsletter', 'Review', 'Survey', 'Birthday', 'Anniversary', 'Redemption', 'Adjustment', 'Bonus')) NOT NULL,
  reference_id VARCHAR,
  reference_type VARCHAR,
  balance_after INTEGER NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Points summary
CREATE TABLE IF NOT EXISTS points_summary (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) UNIQUE NOT NULL,
  total_earned INTEGER DEFAULT 0,
  total_redeemed INTEGER DEFAULT 0,
  current_balance INTEGER DEFAULT 0,
  lifetime_balance INTEGER DEFAULT 0,
  tier_level VARCHAR CHECK (tier_level IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond')) DEFAULT 'Bronze',
  tier_progress INTEGER DEFAULT 0,
  next_tier_threshold INTEGER,
  last_earned_at TIMESTAMP,
  last_redeemed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Points tiers
CREATE TABLE IF NOT EXISTS points_tiers (
  id SERIAL PRIMARY KEY,
  tier_name VARCHAR CHECK (tier_name IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond')) UNIQUE NOT NULL,
  tier_level INTEGER UNIQUE NOT NULL,
  points_required INTEGER NOT NULL,
  color_code VARCHAR(7),
  icon VARCHAR(100),
  perks JSONB,
  multiplier DECIMAL(3, 2) DEFAULT 1.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tier progression history
CREATE TABLE IF NOT EXISTS tier_progression_history (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  previous_tier VARCHAR,
  new_tier VARCHAR NOT NULL,
  points_at_progression INTEGER NOT NULL,
  reason TEXT,
  progressed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tier benefits
CREATE TABLE IF NOT EXISTS tier_benefits (
  id SERIAL PRIMARY KEY,
  tier_name VARCHAR NOT NULL,
  benefit_name VARCHAR(200) NOT NULL,
  benefit_description TEXT,
  benefit_type VARCHAR CHECK (benefit_type IN ('Discount', 'Bonus Points', 'Priority Support', 'Exclusive Access', 'Gift', 'Other')) NOT NULL,
  benefit_value JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rewards catalog
CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR CHECK (category IN ('Gift Card', 'Discount', 'Merchandise', 'Service', 'Donation', 'Premium Waiver', 'Cash Back', 'Other')) NOT NULL,
  points_required INTEGER NOT NULL,
  stock_quantity INTEGER,
  image_url VARCHAR(500),
  terms_conditions TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  priority_order INTEGER DEFAULT 0,
  min_tier_required VARCHAR,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  redemption_limit INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reward redemptions
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  reward_id INTEGER REFERENCES rewards(id) NOT NULL,
  points_spent INTEGER NOT NULL,
  status VARCHAR CHECK (status IN ('Pending', 'Approved', 'Shipped', 'Delivered', 'Completed', 'Cancelled')) DEFAULT 'Pending',
  redemption_code VARCHAR(50),
  shipping_address TEXT,
  tracking_number VARCHAR(100),
  notes TEXT,
  fulfilled_by VARCHAR REFERENCES users(id),
  fulfilled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reward reviews
CREATE TABLE IF NOT EXISTS reward_reviews (
  id SERIAL PRIMARY KEY,
  reward_id INTEGER REFERENCES rewards(id) NOT NULL,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  rating INTEGER NOT NULL,
  review TEXT,
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Points rules for automated awarding
CREATE TABLE IF NOT EXISTS points_rules (
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(200) NOT NULL,
  description TEXT,
  rule_type VARCHAR CHECK (rule_type IN ('Action Based', 'Milestone Based', 'Time Based', 'Manual', 'Conditional')) NOT NULL,
  trigger_event VARCHAR NOT NULL,
  points_awarded INTEGER NOT NULL,
  frequency VARCHAR CHECK (frequency IN ('Once', 'Daily', 'Weekly', 'Monthly', 'Unlimited')) DEFAULT 'Unlimited',
  max_occurrences INTEGER,
  conditions JSONB,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Achievements system
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR CHECK (category IN ('Getting Started', 'Engagement', 'Loyalty', 'Referral', 'Special', 'Milestone', 'Expert')) NOT NULL,
  icon VARCHAR(100),
  points_reward INTEGER DEFAULT 0,
  badge_color VARCHAR(7),
  requirement JSONB,
  is_repeatable BOOLEAN DEFAULT false,
  max_unlocks INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  achievement_id INTEGER REFERENCES achievements(id) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  points_awarded INTEGER DEFAULT 0,
  progress_data JSONB
);

-- Referral codes
CREATE TABLE IF NOT EXISTS referral_codes (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER,
  bonus_points INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS referral_tracking (
  id SERIAL PRIMARY KEY,
  referrer_id VARCHAR REFERENCES users(id) NOT NULL,
  referred_user_id VARCHAR REFERENCES users(id) NOT NULL,
  referral_code VARCHAR(20) NOT NULL,
  referrer_reward INTEGER NOT NULL,
  referred_reward INTEGER NOT NULL,
  status VARCHAR CHECK (status IN ('Pending', 'Completed', 'Expired')) DEFAULT 'Pending',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User notifications
CREATE TABLE IF NOT EXISTS user_notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  notification_type VARCHAR NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  action_url VARCHAR(500),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  priority VARCHAR CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) UNIQUE NOT NULL,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  points_earned BOOLEAN DEFAULT true,
  tier_changes BOOLEAN DEFAULT true,
  reward_updates BOOLEAN DEFAULT true,
  achievement_unlocked BOOLEAN DEFAULT true,
  referral_rewards BOOLEAN DEFAULT true,
  promotional_offers BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bulk points operations for admin
CREATE TABLE IF NOT EXISTS bulk_points_operations (
  id SERIAL PRIMARY KEY,
  initiated_by VARCHAR REFERENCES users(id) NOT NULL,
  operation_type VARCHAR CHECK (operation_type IN ('Award', 'Deduct', 'Reset', 'Adjust')) NOT NULL,
  target_users JSONB NOT NULL,
  points_per_user INTEGER NOT NULL,
  reason TEXT NOT NULL,
  total_users INTEGER NOT NULL,
  processed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status VARCHAR CHECK (status IN ('Pending', 'Processing', 'Completed', 'Failed')) DEFAULT 'Pending',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_log JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled points tasks
CREATE TABLE IF NOT EXISTS scheduled_points_tasks (
  id SERIAL PRIMARY KEY,
  task_name VARCHAR(200) NOT NULL,
  description TEXT,
  task_type VARCHAR CHECK (task_type IN ('Award Points', 'Expire Points', 'Tier Evaluation', 'Birthday Bonus', 'Anniversary Bonus', 'Campaign Bonus')) NOT NULL,
  schedule_type VARCHAR CHECK (schedule_type IN ('Once', 'Daily', 'Weekly', 'Monthly', 'Yearly')) NOT NULL,
  schedule_time TIME,
  schedule_day_of_week INTEGER,
  schedule_day_of_month INTEGER,
  next_run_at TIMESTAMP NOT NULL,
  last_run_at TIMESTAMP,
  points_to_award INTEGER,
  target_criteria JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin point adjustments audit
CREATE TABLE IF NOT EXISTS admin_point_adjustments (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  admin_id VARCHAR REFERENCES users(id) NOT NULL,
  adjustment_type VARCHAR CHECK (adjustment_type IN ('Award', 'Deduct', 'Reset')) NOT NULL,
  points_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  previous_balance INTEGER NOT NULL,
  new_balance INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- SECTION 6: SOCIAL FEATURES & GAMIFICATION
-- ========================================

-- Seasonal campaigns
CREATE TABLE IF NOT EXISTS seasonal_campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  campaign_type VARCHAR CHECK (campaign_type IN ('Holiday', 'Special Event', 'Milestone', 'Seasonal', 'Anniversary')) NOT NULL,
  points_multiplier DECIMAL(3, 2) DEFAULT 1.00,
  bonus_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  auto_start BOOLEAN DEFAULT false,
  auto_end BOOLEAN DEFAULT true,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  target_user_tiers VARCHAR[],
  target_categories VARCHAR[],
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  conditions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign participations
CREATE TABLE IF NOT EXISTS campaign_participations (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES seasonal_campaigns(id) NOT NULL,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  points_earned INTEGER DEFAULT 0,
  bonus_points_earned INTEGER DEFAULT 0,
  participated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Seasonal achievements
CREATE TABLE IF NOT EXISTS seasonal_achievements (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES seasonal_campaigns(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  category VARCHAR CHECK (category IN ('Holiday', 'Seasonal', 'Special Event', 'Challenge', 'Milestone')) NOT NULL,
  points_reward INTEGER DEFAULT 0,
  requirement JSONB,
  is_repeatable BOOLEAN DEFAULT false,
  max_unlocks INTEGER DEFAULT 1,
  unlock_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User seasonal achievements
CREATE TABLE IF NOT EXISTS user_seasonal_achievements (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  achievement_id INTEGER REFERENCES seasonal_achievements(id) NOT NULL,
  campaign_id INTEGER REFERENCES seasonal_campaigns(id) NOT NULL,
  points_awarded INTEGER DEFAULT 0,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tier VARCHAR CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond')),
  progress_data JSONB
);

-- Leaderboard settings
CREATE TABLE IF NOT EXISTS leaderboard_settings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) UNIQUE NOT NULL,
  is_opted_in BOOLEAN DEFAULT false,
  display_name VARCHAR(100),
  show_tier_level BOOLEAN DEFAULT true,
  show_total_points BOOLEAN DEFAULT true,
  show_recent_activity BOOLEAN DEFAULT false,
  visibility_level VARCHAR CHECK (visibility_level IN ('Public', 'Friends', 'Private')) DEFAULT 'Public',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Achievement shares
CREATE TABLE IF NOT EXISTS achievement_shares (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  achievement_id INTEGER REFERENCES achievements(id),
  seasonal_achievement_id INTEGER REFERENCES seasonal_achievements(id),
  share_type VARCHAR CHECK (share_type IN ('Internal', 'Facebook', 'Twitter', 'LinkedIn', 'Instagram', 'WhatsApp')) NOT NULL,
  message TEXT,
  image_url VARCHAR(500),
  hashtags VARCHAR[],
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social media integrations
CREATE TABLE IF NOT EXISTS social_media_integrations (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  platform VARCHAR CHECK (platform IN ('Facebook', 'Twitter', 'LinkedIn', 'Instagram', 'TikTok', 'YouTube')) NOT NULL,
  platform_user_id VARCHAR(200),
  platform_username VARCHAR(100),
  is_connected BOOLEAN DEFAULT true,
  bonus_points_earned INTEGER DEFAULT 0,
  last_activity_sync TIMESTAMP,
  connection_bonus_awarded BOOLEAN DEFAULT false,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Friendships
CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  requester_id VARCHAR REFERENCES users(id) NOT NULL,
  addressee_id VARCHAR REFERENCES users(id) NOT NULL,
  status VARCHAR CHECK (status IN ('Pending', 'Accepted', 'Declined', 'Blocked')) DEFAULT 'Pending',
  request_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP
);

-- Social referrals
CREATE TABLE IF NOT EXISTS social_referrals (
  id SERIAL PRIMARY KEY,
  referrer_id VARCHAR REFERENCES users(id) NOT NULL,
  referred_user_id VARCHAR REFERENCES users(id),
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  invite_method VARCHAR CHECK (invite_method IN ('Email', 'SMS', 'Social Media', 'Direct Link', 'QR Code')) NOT NULL,
  platform_used VARCHAR(50),
  bonus_tier VARCHAR CHECK (bonus_tier IN ('Standard', 'Premium', 'Elite')) DEFAULT 'Standard',
  referrer_reward INTEGER DEFAULT 0,
  referred_reward INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboard rankings
CREATE TABLE IF NOT EXISTS leaderboard_rankings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  period VARCHAR CHECK (period IN ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly', 'All-Time')) NOT NULL,
  category VARCHAR CHECK (category IN ('Points', 'Achievements', 'Referrals', 'Activity', 'Redemptions')) NOT NULL,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  previous_rank INTEGER,
  rank_change INTEGER DEFAULT 0,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social activities
CREATE TABLE IF NOT EXISTS social_activities (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  activity_type VARCHAR CHECK (activity_type IN ('Achievement Unlocked', 'Tier Promotion', 'Points Milestone', 'Referral Success', 'Redemption', 'Campaign Join', 'Challenge Complete')) NOT NULL,
  description TEXT NOT NULL,
  points_involved INTEGER,
  achievement_id INTEGER REFERENCES achievements(id),
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity likes
CREATE TABLE IF NOT EXISTS activity_likes (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER REFERENCES social_activities(id) NOT NULL,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  reaction_type VARCHAR CHECK (reaction_type IN ('Like', 'Love', 'Celebrate', 'Inspire', 'Congratulate')) DEFAULT 'Like',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity comments
CREATE TABLE IF NOT EXISTS activity_comments (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER REFERENCES social_activities(id) NOT NULL,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  comment TEXT NOT NULL,
  is_reply BOOLEAN DEFAULT false,
  parent_comment_id INTEGER,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- SECTION 7: ADVANCED REDEMPTION OPTIONS
-- ========================================

-- Reward wishlists
CREATE TABLE IF NOT EXISTS reward_wishlists (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  reward_id INTEGER REFERENCES rewards(id) NOT NULL,
  priority INTEGER DEFAULT 1,
  target_points_goal INTEGER,
  is_notifications_enabled BOOLEAN DEFAULT true,
  price_alert_threshold DECIMAL(5, 2),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_notified TIMESTAMP
);

-- Reward pricing history
CREATE TABLE IF NOT EXISTS reward_pricing_history (
  id SERIAL PRIMARY KEY,
  reward_id INTEGER REFERENCES rewards(id) NOT NULL,
  original_price INTEGER NOT NULL,
  adjusted_price INTEGER NOT NULL,
  demand_multiplier DECIMAL(3, 2) DEFAULT 1.00,
  redemption_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  demand_level VARCHAR CHECK (demand_level IN ('Very Low', 'Low', 'Normal', 'High', 'Very High')) DEFAULT 'Normal',
  price_change_reason VARCHAR CHECK (price_change_reason IN ('Demand', 'Seasonal', 'Inventory', 'Promotion', 'Manual')),
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partial redemptions
CREATE TABLE IF NOT EXISTS partial_redemptions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  reward_id INTEGER REFERENCES rewards(id) NOT NULL,
  total_points_required INTEGER NOT NULL,
  points_contributed INTEGER NOT NULL,
  remaining_points INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  reservation_id VARCHAR(50),
  status VARCHAR CHECK (status IN ('Active', 'Completed', 'Expired', 'Cancelled')) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reward recommendations
CREATE TABLE IF NOT EXISTS reward_recommendations (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  reward_id INTEGER REFERENCES rewards(id) NOT NULL,
  recommendation_type VARCHAR CHECK (recommendation_type IN ('Behavioral', 'Collaborative', 'Content-Based', 'Trending', 'Seasonal', 'Personalized')) NOT NULL,
  confidence_score DECIMAL(3, 2),
  reasoning TEXT,
  user_behavior_data JSONB,
  is_viewed BOOLEAN DEFAULT false,
  is_clicked BOOLEAN DEFAULT false,
  is_redeemed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMP,
  clicked_at TIMESTAMP,
  redeemed_at TIMESTAMP,
  rank INTEGER,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Reward inventory
CREATE TABLE IF NOT EXISTS reward_inventory (
  id SERIAL PRIMARY KEY,
  reward_id INTEGER REFERENCES rewards(id) UNIQUE NOT NULL,
  total_stock INTEGER,
  available_stock INTEGER,
  reserved_stock INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  is_out_of_stock BOOLEAN DEFAULT false,
  auto_restock BOOLEAN DEFAULT false,
  restock_level INTEGER,
  last_restocked TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recommendation models
CREATE TABLE IF NOT EXISTS recommendation_models (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  model_type VARCHAR CHECK (model_type IN ('Collaborative Filtering', 'Content-Based', 'Hybrid', 'Deep Learning', 'Matrix Factorization')) NOT NULL,
  version VARCHAR(20) DEFAULT '1.0',
  is_active BOOLEAN DEFAULT false,
  accuracy DECIMAL(5, 4),
  precision DECIMAL(5, 4),
  recall DECIMAL(5, 4),
  training_data JSONB,
  hyperparameters JSONB,
  training_started TIMESTAMP,
  training_completed TIMESTAMP,
  last_prediction TIMESTAMP,
  deployed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reward interactions
CREATE TABLE IF NOT EXISTS reward_interactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  reward_id INTEGER REFERENCES rewards(id) NOT NULL,
  interaction_type VARCHAR CHECK (interaction_type IN ('View', 'Click', 'Add to Wishlist', 'Share', 'Compare', 'Review', 'Redeem', 'Partial Redeem')) NOT NULL,
  session_id VARCHAR(100),
  device_type VARCHAR(50),
  user_agent VARCHAR(500),
  referrer_source VARCHAR(200),
  time_spent INTEGER,
  page_depth INTEGER,
  interaction_metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reward notifications
CREATE TABLE IF NOT EXISTS reward_notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  reward_id INTEGER REFERENCES rewards(id),
  notification_type VARCHAR CHECK (notification_type IN ('Price Drop', 'Back in Stock', 'Wishlist Goal Reached', 'Limited Time Offer', 'Recommendation', 'Expiring Soon')) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  action_url VARCHAR(500),
  priority VARCHAR CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
  is_read BOOLEAN DEFAULT false,
  is_action_taken BOOLEAN DEFAULT false,
  delivery_method VARCHAR CHECK (delivery_method IN ('In-App', 'Email', 'SMS', 'Push')) DEFAULT 'In-App',
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  action_taken_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- SECTION 8: AGENT-POLICY RELATIONSHIP MANAGEMENT
-- ========================================

-- Agent profiles
CREATE TABLE IF NOT EXISTS agent_profiles (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  organization_id INTEGER REFERENCES agent_organizations(id) NOT NULL,
  specializations JSONB,
  bio TEXT,
  license_number VARCHAR(50),
  years_experience INTEGER,
  languages_spoken JSONB,
  certifications JSONB,
  contact_preferences JSONB,
  availability_schedule JSONB,
  profile_image_url VARCHAR(255),
  is_public_profile BOOLEAN DEFAULT true,
  is_accepting_clients BOOLEAN DEFAULT true,
  max_client_load INTEGER DEFAULT 100,
  current_client_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_user_id ON agent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_organization_id ON agent_profiles(organization_id);

-- Client assignments
CREATE TABLE IF NOT EXISTS client_assignments (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES members(id) NOT NULL,
  agent_id VARCHAR REFERENCES users(id) NOT NULL,
  organization_id INTEGER REFERENCES agent_organizations(id) NOT NULL,
  assignment_type VARCHAR CHECK (assignment_type IN ('Primary', 'Secondary', 'Temporary', 'Shared')) DEFAULT 'Primary',
  assigned_by VARCHAR REFERENCES users(id) NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  priority VARCHAR CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
  status VARCHAR CHECK (status IN ('Active', 'Inactive', 'Transferred', 'Completed')) DEFAULT 'Active',
  transfer_reason TEXT,
  transferred_to VARCHAR REFERENCES users(id),
  transferred_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_client_assignments_client_id ON client_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_agent_id ON client_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_organization_id ON client_assignments(organization_id);

-- Policy transfers
CREATE TABLE IF NOT EXISTS policy_transfers (
  id SERIAL PRIMARY KEY,
  policy_id INTEGER REFERENCES policies(id) NOT NULL,
  from_agent_id VARCHAR REFERENCES users(id),
  to_agent_id VARCHAR REFERENCES users(id) NOT NULL,
  transferred_by VARCHAR REFERENCES users(id) NOT NULL,
  transfer_reason TEXT NOT NULL,
  transfer_type VARCHAR CHECK (transfer_type IN ('servicing', 'both')) DEFAULT 'servicing',
  transferred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_policy_transfers_policy ON policy_transfers(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_transfers_from_agent ON policy_transfers(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_policy_transfers_to_agent ON policy_transfers(to_agent_id);

-- Agent commissions
CREATE TABLE IF NOT EXISTS agent_commissions (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR REFERENCES users(id) NOT NULL,
  policy_id INTEGER REFERENCES policies(id) NOT NULL,
  organization_id INTEGER REFERENCES agent_organizations(id) NOT NULL,
  commission_type VARCHAR CHECK (commission_type IN ('initial_sale', 'renewal', 'bonus')) NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL,
  base_amount DECIMAL(10, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR CHECK (payment_status IN ('pending', 'approved', 'paid', 'cancelled')) DEFAULT 'pending',
  payment_date TIMESTAMP,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_agent ON agent_commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_policy ON agent_commissions(policy_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_status ON agent_commissions(payment_status);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_date ON agent_commissions(payment_date);

-- Agent performance
CREATE TABLE IF NOT EXISTS agent_performance (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR REFERENCES users(id) NOT NULL,
  organization_id INTEGER REFERENCES agent_organizations(id) NOT NULL,
  period_type VARCHAR CHECK (period_type IN ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly')) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  quotes_generated INTEGER DEFAULT 0,
  quotes_converted INTEGER DEFAULT 0,
  policies_sold INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0.00,
  commissions_earned DECIMAL(10, 2) DEFAULT 0.00,
  clients_added INTEGER DEFAULT 0,
  clients_lost INTEGER DEFAULT 0,
  activities_logged INTEGER DEFAULT 0,
  response_time_avg INTEGER,
  satisfaction_score DECIMAL(3, 2),
  goals_achieved INTEGER DEFAULT 0,
  goals_total INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_agent_performance_agent_id ON agent_performance(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_organization_id ON agent_performance(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_period ON agent_performance(period_start, period_end);

-- Client activities
CREATE TABLE IF NOT EXISTS client_activities (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES members(id) NOT NULL,
  agent_id VARCHAR REFERENCES users(id) NOT NULL,
  organization_id INTEGER REFERENCES agent_organizations(id) NOT NULL,
  activity_type VARCHAR CHECK (activity_type IN ('Call', 'Email', 'Meeting', 'Quote', 'Policy Review', 'Claim Assistance', 'Follow-up', 'Consultation', 'Document Review', 'Other')) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT,
  duration INTEGER,
  outcome VARCHAR CHECK (outcome IN ('Successful', 'Follow-up Required', 'No Response', 'Not Interested', 'Postponed', 'Completed')),
  next_action_required BOOLEAN DEFAULT false,
  next_action_date TIMESTAMP,
  next_action_description TEXT,
  priority VARCHAR CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
  tags JSONB,
  attachments JSONB,
  is_private BOOLEAN DEFAULT false,
  related_quote_id INTEGER REFERENCES insurance_quotes(id),
  related_policy_id INTEGER REFERENCES policies(id),
  related_claim_id INTEGER REFERENCES claims(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_client_activities_client_id ON client_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_agent_id ON client_activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_organization_id ON client_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_created_at ON client_activities(created_at);

-- Organization analytics
CREATE TABLE IF NOT EXISTS organization_analytics (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES agent_organizations(id) NOT NULL,
  period_type VARCHAR CHECK (period_type IN ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly')) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  total_agents INTEGER DEFAULT 0,
  active_agents INTEGER DEFAULT 0,
  total_members INTEGER DEFAULT 0,
  new_members INTEGER DEFAULT 0,
  lost_members INTEGER DEFAULT 0,
  total_quotes INTEGER DEFAULT 0,
  converted_quotes INTEGER DEFAULT 0,
  total_policies INTEGER DEFAULT 0,
  active_policies INTEGER DEFAULT 0,
  total_claims INTEGER DEFAULT 0,
  processed_claims INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0.00,
  total_commissions DECIMAL(12, 2) DEFAULT 0.00,
  average_quote_value DECIMAL(10, 2) DEFAULT 0.00,
  conversion_rate DECIMAL(5, 4) DEFAULT 0.0000,
  customer_satisfaction DECIMAL(3, 2),
  avg_response_time INTEGER,
  top_performing_agent VARCHAR REFERENCES users(id),
  growth_rate DECIMAL(6, 4),
  churn_rate DECIMAL(6, 4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_organization_analytics_org_id ON organization_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_analytics_period ON organization_analytics(period_start, period_end);

-- Agent collaborations
CREATE TABLE IF NOT EXISTS agent_collaborations (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES agent_organizations(id) NOT NULL,
  initiator_id VARCHAR REFERENCES users(id) NOT NULL,
  collaborator_id VARCHAR REFERENCES users(id) NOT NULL,
  collaboration_type VARCHAR CHECK (collaboration_type IN ('Referral', 'Joint Meeting', 'Knowledge Share', 'Case Review', 'Training', 'Mentoring')) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')) DEFAULT 'Pending',
  priority VARCHAR CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
  scheduled_date TIMESTAMP,
  completed_date TIMESTAMP,
  outcome TEXT,
  rating INTEGER,
  is_public BOOLEAN DEFAULT false,
  tags JSONB,
  attachments JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_agent_collaborations_organization_id ON agent_collaborations(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_collaborations_initiator_id ON agent_collaborations(initiator_id);
CREATE INDEX IF NOT EXISTS idx_agent_collaborations_collaborator_id ON agent_collaborations(collaborator_id);

-- Organization knowledge base
CREATE TABLE IF NOT EXISTS organization_knowledge_base (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES agent_organizations(id) NOT NULL,
  author_id VARCHAR REFERENCES users(id) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR CHECK (category IN ('Best Practices', 'Procedures', 'Templates', 'Training', 'FAQ', 'Resources', 'Policies', 'Updates')) NOT NULL,
  tags JSONB,
  is_public BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  last_reviewed_by VARCHAR REFERENCES users(id),
  last_reviewed_at TIMESTAMP,
  attachments JSONB,
  related_articles JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_org_knowledge_base_organization_id ON organization_knowledge_base(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_knowledge_base_author_id ON organization_knowledge_base(author_id);
CREATE INDEX IF NOT EXISTS idx_org_knowledge_base_category ON organization_knowledge_base(category);

-- ========================================
-- END OF SCHEMA
-- ========================================

-- TOTAL TABLES: 75
-- TOTAL INDEXES: 40+
-- LAST UPDATED: October 02, 2025

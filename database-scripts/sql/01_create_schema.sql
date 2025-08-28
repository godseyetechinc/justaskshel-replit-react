-- =====================================================
-- JustAskShel Insurance Platform Database Schema
-- =====================================================
-- This script creates all database tables and indexes
-- for the comprehensive insurance management platform.
-- 
-- Execute in order: 01_create_schema.sql -> 02_seed_data.sql
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE AUTHENTICATION & AUTHORIZATION TABLES
-- =====================================================

-- Session storage table (mandatory for authentication)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

-- Agent Organizations (multi-tenant structure)
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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table with role-based authorization
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    password VARCHAR(255),
    role VARCHAR CHECK (role IN ('SuperAdmin', 'TenantAdmin', 'Agent', 'Member', 'Guest', 'Visitor')) DEFAULT 'Guest',
    privilege_level INTEGER DEFAULT 4,
    organization_id INTEGER REFERENCES agent_organizations(id),
    is_active BOOLEAN DEFAULT TRUE,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    date_of_birth TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Roles definition table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    privilege_level INTEGER UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INSURANCE CORE ENTITIES
-- =====================================================

-- Insurance types (Life, Health, Dental, etc.)
CREATE TABLE IF NOT EXISTS insurance_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insurance providers
CREATE TABLE IF NOT EXISTS insurance_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo VARCHAR(255),
    rating DECIMAL(2,1),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- QUOTES & EXTERNAL PROVIDERS
-- =====================================================

-- Insurance quotes (enhanced for external providers)
CREATE TABLE IF NOT EXISTS insurance_quotes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    type_id INTEGER REFERENCES insurance_types(id),
    provider_id INTEGER REFERENCES insurance_providers(id),
    monthly_premium DECIMAL(10,2) NOT NULL,
    annual_premium DECIMAL(10,2),
    coverage_amount DECIMAL(12,2),
    term_length INTEGER,
    deductible DECIMAL(10,2),
    medical_exam_required BOOLEAN DEFAULT FALSE,
    conversion_option BOOLEAN DEFAULT FALSE,
    features JSONB,
    rating DECIMAL(2,1),
    -- External provider integration fields
    is_external BOOLEAN DEFAULT FALSE,
    external_quote_id VARCHAR(255),
    external_provider_id VARCHAR(100),
    external_provider_name VARCHAR(255),
    application_url VARCHAR(500),
    expires_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- External quote requests tracking
CREATE TABLE IF NOT EXISTS external_quote_requests (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(100) NOT NULL UNIQUE,
    user_id VARCHAR REFERENCES users(id),
    coverage_type VARCHAR(100) NOT NULL,
    applicant_age INTEGER NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    coverage_amount DECIMAL(12,2) NOT NULL,
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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User selected quotes
CREATE TABLE IF NOT EXISTS selected_quotes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    quote_id INTEGER REFERENCES insurance_quotes(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User wishlist
CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    quote_id INTEGER REFERENCES insurance_quotes(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- POLICIES & MANAGEMENT
-- =====================================================

-- User policies (enhanced policy management)
CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    quote_id INTEGER REFERENCES insurance_quotes(id),
    policy_number VARCHAR(50) NOT NULL,
    status VARCHAR CHECK (status IN ('Active', 'Pending', 'Expired', 'Cancelled', 'Suspended', 'Lapsed')) DEFAULT 'Pending',
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    renewal_date TIMESTAMP,
    next_payment_date TIMESTAMP,
    annual_premium DECIMAL(10,2),
    monthly_premium DECIMAL(10,2),
    payment_frequency VARCHAR CHECK (payment_frequency IN ('Monthly', 'Quarterly', 'Semi-Annual', 'Annual')) DEFAULT 'Monthly',
    coverage_amount DECIMAL(12,2),
    deductible DECIMAL(10,2),
    agent_id VARCHAR REFERENCES users(id),
    underwriter_id VARCHAR REFERENCES users(id),
    beneficiary JSONB,
    contingent_beneficiary JSONB,
    medical_exam_required BOOLEAN DEFAULT FALSE,
    medical_exam_completed BOOLEAN DEFAULT FALSE,
    medical_exam_date TIMESTAMP,
    issued_date TIMESTAMP,
    last_review_date TIMESTAMP,
    auto_renewal BOOLEAN DEFAULT TRUE,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
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
    uploaded_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Premium payments tracking
CREATE TABLE IF NOT EXISTS premium_payments (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES policies(id) NOT NULL,
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR CHECK (payment_type IN ('Premium', 'Late Fee', 'Processing Fee', 'Adjustment', 'Refund')) DEFAULT 'Premium',
    payment_method VARCHAR CHECK (payment_method IN ('Credit Card', 'Bank Transfer', 'Check', 'Cash', 'ACH', 'Wire Transfer')),
    transaction_id VARCHAR(100),
    payment_status VARCHAR CHECK (payment_status IN ('Pending', 'Processed', 'Failed', 'Cancelled', 'Refunded')) DEFAULT 'Pending',
    due_date TIMESTAMP NOT NULL,
    paid_date TIMESTAMP,
    grace_period_end TIMESTAMP,
    late_fee_amount DECIMAL(10,2) DEFAULT 0,
    is_auto_pay BOOLEAN DEFAULT FALSE,
    payment_reference VARCHAR(100),
    notes TEXT,
    processed_by VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Policy amendments and endorsements
CREATE TABLE IF NOT EXISTS policy_amendments (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES policies(id) NOT NULL,
    amendment_type VARCHAR CHECK (amendment_type IN ('Beneficiary Change', 'Coverage Change', 'Premium Adjustment', 'Address Change', 'Name Change', 'Payment Method Change', 'Other')) NOT NULL,
    amendment_number VARCHAR(50) NOT NULL,
    effective_date TIMESTAMP NOT NULL,
    description TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    premium_impact DECIMAL(10,2) DEFAULT 0,
    status VARCHAR CHECK (status IN ('Draft', 'Pending Review', 'Approved', 'Implemented', 'Rejected', 'Cancelled')) DEFAULT 'Draft',
    requested_by VARCHAR REFERENCES users(id),
    approved_by VARCHAR REFERENCES users(id),
    implemented_by VARCHAR REFERENCES users(id),
    requested_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    implemented_at TIMESTAMP,
    rejection_reason TEXT,
    document_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- CLAIMS MANAGEMENT
-- =====================================================

-- Claims
CREATE TABLE IF NOT EXISTS claims (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    policy_id INTEGER REFERENCES policies(id),
    claim_number VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    claim_type VARCHAR(50) NOT NULL,
    incident_date TIMESTAMP NOT NULL,
    amount DECIMAL(10,2),
    estimated_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'draft',
    priority VARCHAR(20) DEFAULT 'normal',
    assigned_agent VARCHAR REFERENCES users(id),
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    processed_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Claims documents for file attachments
CREATE TABLE IF NOT EXISTS claim_documents (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES claims(id) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER,
    document_type VARCHAR(50) NOT NULL,
    uploaded_by VARCHAR REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    is_required BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending'
);

-- Claims communications/notes
CREATE TABLE IF NOT EXISTS claim_communications (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES claims(id) NOT NULL,
    user_id VARCHAR REFERENCES users(id),
    message_type VARCHAR(50) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Claims workflow steps
CREATE TABLE IF NOT EXISTS claim_workflow_steps (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES claims(id) NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_description TEXT,
    status VARCHAR(20) NOT NULL,
    assigned_to VARCHAR REFERENCES users(id),
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- MEMBER & ORGANIZATION MANAGEMENT
-- =====================================================

-- Members (extends users with additional member-specific information)
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
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
    membership_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Dependents
CREATE TABLE IF NOT EXISTS dependents (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    relationship VARCHAR(20) NOT NULL,
    date_of_birth TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Contacts (general contact information)
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- APPLICATIONS & APPLICANTS
-- =====================================================

-- Applications (insurance applications)
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    application_number VARCHAR(30) UNIQUE NOT NULL,
    user_id VARCHAR REFERENCES users(id),
    contact_id INTEGER REFERENCES contacts(id),
    insurance_type_id INTEGER REFERENCES insurance_types(id),
    status VARCHAR CHECK (status IN ('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Withdrawn')) DEFAULT 'Draft',
    application_data JSONB,
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR REFERENCES users(id),
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Applicants (individuals applying for insurance)
CREATE TABLE IF NOT EXISTS applicants (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id),
    is_primary BOOLEAN DEFAULT TRUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth TIMESTAMP NOT NULL,
    gender VARCHAR CHECK (gender IN ('Male', 'Female', 'Other')),
    ssn VARCHAR(11),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    occupation VARCHAR(100),
    annual_income DECIMAL(12,2),
    health_status VARCHAR CHECK (health_status IN ('Excellent', 'Good', 'Fair', 'Poor')),
    smoker BOOLEAN DEFAULT FALSE,
    medical_history JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Applicant Dependents (dependents on applications)
CREATE TABLE IF NOT EXISTS applicant_dependents (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id),
    applicant_id INTEGER REFERENCES applicants(id),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth TIMESTAMP NOT NULL,
    gender VARCHAR CHECK (gender IN ('Male', 'Female', 'Other')),
    relationship VARCHAR(30) NOT NULL,
    ssn VARCHAR(11),
    health_status VARCHAR CHECK (health_status IN ('Excellent', 'Good', 'Fair', 'Poor')),
    smoker BOOLEAN DEFAULT FALSE,
    medical_history JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- LOYALTY & REWARDS SYSTEM
-- =====================================================

-- Points system transactions
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
    created_at TIMESTAMP DEFAULT NOW()
);

-- Points summary for each user
CREATE TABLE IF NOT EXISTS points_summary (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id) UNIQUE NOT NULL,
    total_earned INTEGER DEFAULT 0,
    total_redeemed INTEGER DEFAULT 0,
    current_balance INTEGER DEFAULT 0,
    lifetime_balance INTEGER DEFAULT 0,
    tier_level VARCHAR CHECK (tier_level IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond')) DEFAULT 'Bronze',
    tier_progress INTEGER DEFAULT 0,
    next_tier_threshold INTEGER DEFAULT 500,
    last_earned_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Rewards catalog
CREATE TABLE IF NOT EXISTS rewards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR CHECK (category IN ('Discount', 'Gift Card', 'Premium Service', 'Insurance Credit', 'Merchandise', 'Experience')) NOT NULL,
    points_cost INTEGER NOT NULL,
    value DECIMAL(10,2),
    image_url VARCHAR,
    available_quantity INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    terms TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User reward redemptions
CREATE TABLE IF NOT EXISTS reward_redemptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    reward_id INTEGER REFERENCES rewards(id) NOT NULL,
    points_transaction_id INTEGER REFERENCES points_transactions(id),
    points_used INTEGER NOT NULL,
    status VARCHAR CHECK (status IN ('Pending', 'Approved', 'Delivered', 'Cancelled', 'Expired')) DEFAULT 'Pending',
    redemption_code VARCHAR(50),
    delivery_method VARCHAR CHECK (delivery_method IN ('Email', 'Mail', 'Digital', 'Account Credit', 'Instant')),
    delivery_address TEXT,
    delivered_at TIMESTAMP,
    expires_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Points earning rules
CREATE TABLE IF NOT EXISTS points_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR CHECK (category IN ('Policy Purchase', 'Claim Submission', 'Referral', 'Login', 'Profile Complete', 'Newsletter', 'Review', 'Survey', 'Birthday', 'Anniversary', 'Bonus')) NOT NULL,
    points INTEGER NOT NULL,
    max_per_period INTEGER,
    period_type VARCHAR CHECK (period_type IN ('Daily', 'Weekly', 'Monthly', 'Yearly', 'Lifetime')),
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    conditions JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- Quote-related indexes
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON insurance_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_type_id ON insurance_quotes(type_id);
CREATE INDEX IF NOT EXISTS idx_quotes_is_external ON insurance_quotes(is_external);

-- Policy-related indexes
CREATE INDEX IF NOT EXISTS idx_policies_user_id ON policies(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_agent_id ON policies(agent_id);

-- Claims-related indexes
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_policy_id ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);

-- Application-related indexes
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Points-related indexes
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_summary_user_id ON points_summary(user_id);

-- External quote request indexes
CREATE INDEX IF NOT EXISTS idx_external_quote_requests_user_id ON external_quote_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_external_quote_requests_status ON external_quote_requests(status);

-- Schema creation completed successfully
-- Next step: Execute 02_seed_data.sql for initial data population
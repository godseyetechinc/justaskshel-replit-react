-- ============================================================================
-- COMPLETE DATABASE SCHEMA EXPORT FOR JUSTASKSHEL
-- ============================================================================
-- Generated: $(date +"%Y-%m-%d %H:%M:%S")
-- Database: PostgreSQL 16.9
-- Description: Complete schema export including all tables, indexes, and constraints
--              Organized by functional area for better maintainability
-- ============================================================================

-- PostgreSQL Settings
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- ============================================================================
-- SECTION 1: CORE SYSTEM TABLES
-- ============================================================================

-- Sessions table (required for connect-pg-simple)
CREATE TABLE IF NOT EXISTS public.sessions (
    sid character varying PRIMARY KEY,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON public.sessions USING btree (expire);

-- ============================================================================
-- SECTION 2: ORGANIZATION & USER MANAGEMENT
-- ============================================================================

-- Agent Organizations
CREATE SEQUENCE IF NOT EXISTS public.agent_organizations_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.agent_organizations (
    id integer PRIMARY KEY DEFAULT nextval('public.agent_organizations_id_seq'),
    name character varying(100) NOT NULL,
    display_name character varying(100) NOT NULL,
    description text,
    website character varying(255),
    phone character varying(20),
    email character varying(100),
    address text,
    city character varying(50),
    state character varying(50),
    zip_code character varying(10),
    logo_url character varying(255),
    primary_color character varying(7) DEFAULT '#0EA5E9',
    secondary_color character varying(7) DEFAULT '#64748B',
    status character varying(20) DEFAULT 'Active',
    subscription_plan character varying(20) DEFAULT 'Basic',
    subscription_status character varying(20) DEFAULT 'Trial',
    max_agents integer DEFAULT 5,
    max_members integer DEFAULT 100,
    settings jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    is_system_organization boolean DEFAULT false,
    is_hidden boolean DEFAULT false,
    CONSTRAINT agent_organizations_status_check CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    CONSTRAINT agent_organizations_subscription_plan_check CHECK (subscription_plan IN ('Basic', 'Professional', 'Enterprise')),
    CONSTRAINT agent_organizations_subscription_status_check CHECK (subscription_status IN ('Active', 'Inactive', 'Trial', 'Expired'))
);

ALTER SEQUENCE public.agent_organizations_id_seq OWNED BY public.agent_organizations.id;

-- Persons (unified entity model)
CREATE SEQUENCE IF NOT EXISTS public.persons_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.persons (
    id integer PRIMARY KEY DEFAULT nextval('public.persons_id_seq'),
    identity_hash character varying(255) UNIQUE,
    first_name character varying(100),
    middle_name character varying(100),
    last_name character varying(100),
    date_of_birth date,
    ssn_last_four character varying(4),
    gender character varying(20),
    primary_email character varying(255),
    primary_phone character varying(20),
    address_line1 character varying(255),
    address_line2 character varying(255),
    city character varying(100),
    state character varying(50),
    zip_code character varying(10),
    country character varying(100) DEFAULT 'United States',
    profile_image_url character varying(255),
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.persons_id_seq OWNED BY public.persons.id;

CREATE INDEX IF NOT EXISTS idx_persons_identity_hash ON public.persons USING btree (identity_hash);
CREATE INDEX IF NOT EXISTS idx_persons_name ON public.persons USING btree (last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_persons_primary_email ON public.persons USING btree (primary_email);
CREATE INDEX IF NOT EXISTS idx_persons_primary_phone ON public.persons USING btree (primary_phone);

-- Users
CREATE TABLE IF NOT EXISTS public.users (
    id character varying PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    person_id integer REFERENCES public.persons(id),
    email character varying UNIQUE,
    profile_image_url character varying,
    password character varying(255),
    role character varying CHECK (role IN ('SuperAdmin', 'TenantAdmin', 'Agent', 'Member', 'Guest', 'Visitor')) DEFAULT 'Guest',
    privilege_level integer DEFAULT 4,
    organization_id integer REFERENCES public.agent_organizations(id),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users USING btree (role);
CREATE INDEX IF NOT EXISTS idx_users_privilege_level ON public.users USING btree (privilege_level);
CREATE INDEX IF NOT EXISTS idx_users_org_privilege ON public.users USING btree (organization_id, privilege_level);

-- Roles
CREATE SEQUENCE IF NOT EXISTS public.roles_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.roles (
    id integer PRIMARY KEY DEFAULT nextval('public.roles_id_seq'),
    name character varying(50) UNIQUE NOT NULL,
    privilege_level integer UNIQUE NOT NULL,
    description text,
    permissions jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;

-- ============================================================================
-- SECTION 3: AUTHENTICATION & SECURITY (PHASE 2 ENHANCEMENTS)
-- ============================================================================

-- Account Lockouts (Phase 2)
CREATE SEQUENCE IF NOT EXISTS public.account_lockouts_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.account_lockouts (
    id integer PRIMARY KEY DEFAULT nextval('public.account_lockouts_id_seq'),
    user_id character varying NOT NULL REFERENCES public.users(id),
    failed_attempts integer DEFAULT 0 NOT NULL,
    last_failed_at timestamp without time zone,
    locked_until timestamp without time zone,
    locked_at timestamp without time zone,
    unlocked_at timestamp without time zone,
    lock_reason character varying(255),
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.account_lockouts_id_seq OWNED BY public.account_lockouts.id;

CREATE INDEX IF NOT EXISTS idx_account_lockouts_user_id ON public.account_lockouts USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_locked_until ON public.account_lockouts USING btree (locked_until);

-- Password Reset Tokens (Phase 2)
CREATE SEQUENCE IF NOT EXISTS public.password_reset_tokens_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id integer PRIMARY KEY DEFAULT nextval('public.password_reset_tokens_id_seq'),
    user_id character varying NOT NULL REFERENCES public.users(id),
    token character varying(255) UNIQUE NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens USING btree (expires_at);

-- MFA Settings (Phase 2)
CREATE SEQUENCE IF NOT EXISTS public.mfa_settings_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.mfa_settings (
    id integer PRIMARY KEY DEFAULT nextval('public.mfa_settings_id_seq'),
    user_id character varying UNIQUE NOT NULL REFERENCES public.users(id),
    mfa_enabled boolean DEFAULT false NOT NULL,
    totp_secret character varying(255),
    backup_codes jsonb,
    recovery_email character varying(255),
    enabled_at timestamp without time zone,
    last_verified_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.mfa_settings_id_seq OWNED BY public.mfa_settings.id;

CREATE INDEX IF NOT EXISTS idx_mfa_settings_user_id ON public.mfa_settings USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_settings_enabled ON public.mfa_settings USING btree (mfa_enabled);

-- MFA Verification Attempts (Phase 2)
CREATE SEQUENCE IF NOT EXISTS public.mfa_verification_attempts_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.mfa_verification_attempts (
    id integer PRIMARY KEY DEFAULT nextval('public.mfa_verification_attempts_id_seq'),
    user_id character varying NOT NULL REFERENCES public.users(id),
    attempt_type character varying(20) CHECK (attempt_type IN ('totp', 'sms', 'recovery')) NOT NULL,
    success boolean NOT NULL,
    ip_address character varying(45),
    user_agent text,
    attempted_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.mfa_verification_attempts_id_seq OWNED BY public.mfa_verification_attempts.id;

CREATE INDEX IF NOT EXISTS idx_mfa_verification_user_id ON public.mfa_verification_attempts USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_verification_attempted_at ON public.mfa_verification_attempts USING btree (attempted_at);

-- Login History (Phase 2)
CREATE SEQUENCE IF NOT EXISTS public.login_history_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.login_history (
    id integer PRIMARY KEY DEFAULT nextval('public.login_history_id_seq'),
    user_id character varying REFERENCES public.users(id),
    email character varying(255) NOT NULL,
    success boolean NOT NULL,
    failure_reason character varying(255),
    ip_address character varying(45),
    user_agent text,
    location character varying(255),
    device_type character varying(50),
    organization_id integer REFERENCES public.agent_organizations(id),
    mfa_used boolean DEFAULT false,
    session_id character varying(255),
    logged_in_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.login_history_id_seq OWNED BY public.login_history.id;

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON public.login_history USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_logged_in_at ON public.login_history USING btree (logged_in_at);
CREATE INDEX IF NOT EXISTS idx_login_history_success ON public.login_history USING btree (success);
CREATE INDEX IF NOT EXISTS idx_login_history_ip_address ON public.login_history USING btree (ip_address);

-- MFA Configuration (Phase 2)
CREATE SEQUENCE IF NOT EXISTS public.mfa_config_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.mfa_config (
    id integer PRIMARY KEY DEFAULT nextval('public.mfa_config_id_seq'),
    enable_mfa boolean DEFAULT false NOT NULL,
    enforcement_mode character varying(50) CHECK (enforcement_mode IN ('disabled', 'optional', 'required_admins', 'required_all')) DEFAULT 'optional' NOT NULL,
    bypass_emails jsonb,
    updated_by character varying REFERENCES public.users(id),
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.mfa_config_id_seq OWNED BY public.mfa_config.id;

-- Organization Access Requests
CREATE SEQUENCE IF NOT EXISTS public.organization_access_requests_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.organization_access_requests (
    id integer PRIMARY KEY DEFAULT nextval('public.organization_access_requests_id_seq'),
    user_id character varying NOT NULL REFERENCES public.users(id),
    organization_id integer NOT NULL REFERENCES public.agent_organizations(id),
    status character varying(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    requested_role character varying(50),
    reason text,
    reviewed_by character varying REFERENCES public.users(id),
    review_notes text,
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.organization_access_requests_id_seq OWNED BY public.organization_access_requests.id;

CREATE INDEX IF NOT EXISTS idx_access_requests_user ON public.organization_access_requests USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_org ON public.organization_access_requests USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.organization_access_requests USING btree (status);

-- ============================================================================
-- SECTION 4: ASSOCIATION TABLES (Person Relationships)
-- ============================================================================

-- Person-Users relationship
CREATE TABLE IF NOT EXISTS public.person_users (
    id character varying PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    person_id integer NOT NULL REFERENCES public.persons(id),
    user_id character varying NOT NULL REFERENCES public.users(id),
    relationship_type character varying(50),
    is_primary boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_person_users_person_id ON public.person_users USING btree (person_id);
CREATE INDEX IF NOT EXISTS idx_person_users_user_id ON public.person_users USING btree (user_id);

-- Person-Members relationship
CREATE TABLE IF NOT EXISTS public.person_members (
    id character varying PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    person_id integer NOT NULL REFERENCES public.persons(id),
    member_id integer NOT NULL,
    relationship_type character varying(50),
    is_primary boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_person_members_person_id ON public.person_members USING btree (person_id);
CREATE INDEX IF NOT EXISTS idx_person_members_member_id ON public.person_members USING btree (member_id);

-- Person-Contacts relationship
CREATE TABLE IF NOT EXISTS public.person_contacts (
    id character varying PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    person_id integer NOT NULL REFERENCES public.persons(id),
    contact_id integer NOT NULL,
    relationship_type character varying(50),
    is_primary boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_person_contacts_person_id ON public.person_contacts USING btree (person_id);
CREATE INDEX IF NOT EXISTS idx_person_contacts_contact_id ON public.person_contacts USING btree (contact_id);

-- ============================================================================
-- SECTION 5: AGENT & CLIENT MANAGEMENT
-- ============================================================================

-- Agent Profiles
CREATE SEQUENCE IF NOT EXISTS public.agent_profiles_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.agent_profiles (
    id integer PRIMARY KEY DEFAULT nextval('public.agent_profiles_id_seq'),
    user_id character varying NOT NULL REFERENCES public.users(id),
    organization_id integer NOT NULL REFERENCES public.agent_organizations(id),
    specializations jsonb,
    bio text,
    license_number character varying(50),
    years_experience integer,
    languages_spoken jsonb,
    certifications jsonb,
    contact_preferences jsonb,
    availability_schedule jsonb,
    profile_image_url character varying(255),
    client_capacity integer DEFAULT 50,
    current_client_count integer DEFAULT 0,
    is_accepting_new_clients boolean DEFAULT true,
    collaboration_preferences jsonb,
    performance_rating numeric(3,2) DEFAULT 0.00,
    last_active_at timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.agent_profiles_id_seq OWNED BY public.agent_profiles.id;

CREATE INDEX IF NOT EXISTS idx_agent_profiles_user_id ON public.agent_profiles USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_organization_id ON public.agent_profiles USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_active ON public.agent_profiles USING btree (is_active);

-- Client Assignments
CREATE SEQUENCE IF NOT EXISTS public.client_assignments_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.client_assignments (
    id integer PRIMARY KEY DEFAULT nextval('public.client_assignments_id_seq'),
    client_id character varying NOT NULL REFERENCES public.users(id),
    agent_id character varying NOT NULL REFERENCES public.users(id),
    organization_id integer NOT NULL REFERENCES public.agent_organizations(id),
    assignment_type character varying(50),
    priority_level character varying(20),
    assignment_date timestamp without time zone DEFAULT now(),
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.client_assignments_id_seq OWNED BY public.client_assignments.id;

CREATE INDEX IF NOT EXISTS idx_client_assignments_client_id ON public.client_assignments USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_agent_id ON public.client_assignments USING btree (agent_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_organization_id ON public.client_assignments USING btree (organization_id);

-- Contacts
CREATE SEQUENCE IF NOT EXISTS public.contacts_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.contacts (
    id integer PRIMARY KEY DEFAULT nextval('public.contacts_id_seq'),
    user_id character varying REFERENCES public.users(id),
    person_id integer REFERENCES public.persons(id),
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255),
    phone character varying(20),
    relationship character varying(50),
    date_of_birth date,
    ssn character varying(11),
    address text,
    city character varying(100),
    state character varying(50),
    zip_code character varying(10),
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.contacts_id_seq OWNED BY public.contacts.id;

-- Members
CREATE SEQUENCE IF NOT EXISTS public.members_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.members (
    id integer PRIMARY KEY DEFAULT nextval('public.members_id_seq'),
    user_id character varying REFERENCES public.users(id),
    person_id integer REFERENCES public.persons(id),
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    relationship character varying(50),
    date_of_birth date,
    gender character varying(20),
    ssn character varying(11),
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.members_id_seq OWNED BY public.members.id;

-- Dependents
CREATE SEQUENCE IF NOT EXISTS public.dependents_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.dependents (
    id integer PRIMARY KEY DEFAULT nextval('public.dependents_id_seq'),
    user_id character varying REFERENCES public.users(id),
    person_id integer REFERENCES public.persons(id),
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    date_of_birth date NOT NULL,
    relationship character varying(50) NOT NULL,
    ssn character varying(11),
    gender character varying(20),
    is_covered boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.dependents_id_seq OWNED BY public.dependents.id;

-- ============================================================================
-- SECTION 6: INSURANCE TYPES, PROVIDERS & QUOTES
-- ============================================================================

-- Insurance Types
CREATE SEQUENCE IF NOT EXISTS public.insurance_types_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.insurance_types (
    id integer PRIMARY KEY DEFAULT nextval('public.insurance_types_id_seq'),
    name character varying(100) NOT NULL,
    description text,
    icon character varying(50),
    color character varying(20),
    created_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.insurance_types_id_seq OWNED BY public.insurance_types.id;

-- Insurance Providers
CREATE SEQUENCE IF NOT EXISTS public.insurance_providers_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.insurance_providers (
    id integer PRIMARY KEY DEFAULT nextval('public.insurance_providers_id_seq'),
    name character varying(100) NOT NULL,
    logo character varying(255),
    rating numeric(2,1),
    created_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.insurance_providers_id_seq OWNED BY public.insurance_providers.id;

-- Insurance Quotes
CREATE SEQUENCE IF NOT EXISTS public.insurance_quotes_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.insurance_quotes (
    id integer PRIMARY KEY DEFAULT nextval('public.insurance_quotes_id_seq'),
    user_id character varying REFERENCES public.users(id),
    type_id integer REFERENCES public.insurance_types(id),
    provider_id integer REFERENCES public.insurance_providers(id),
    monthly_premium numeric(10,2) NOT NULL,
    annual_premium numeric(10,2),
    coverage_amount numeric(12,2),
    term_length integer,
    deductible numeric(10,2),
    medical_exam_required boolean DEFAULT false,
    conversion_option boolean DEFAULT false,
    features jsonb,
    rating numeric(2,1),
    is_external boolean DEFAULT false,
    external_quote_id character varying(255),
    external_provider_id character varying(100),
    external_provider_name character varying(255),
    application_url character varying(500),
    expires_at timestamp without time zone,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.insurance_quotes_id_seq OWNED BY public.insurance_quotes.id;

-- External Quote Requests
CREATE SEQUENCE IF NOT EXISTS public.external_quote_requests_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.external_quote_requests (
    id integer PRIMARY KEY DEFAULT nextval('public.external_quote_requests_id_seq'),
    request_id character varying(100) UNIQUE NOT NULL,
    user_id character varying REFERENCES public.users(id),
    coverage_type character varying(100) NOT NULL,
    applicant_age integer NOT NULL,
    zip_code character varying(10) NOT NULL,
    coverage_amount numeric(12,2) NOT NULL,
    term_length integer,
    payment_frequency character varying(20),
    effective_date timestamp without time zone,
    request_data jsonb,
    providers_queried jsonb,
    total_quotes_received integer DEFAULT 0,
    successful_providers integer DEFAULT 0,
    failed_providers integer DEFAULT 0,
    errors jsonb,
    status character varying CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')) DEFAULT 'pending',
    processing_started_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.external_quote_requests_id_seq OWNED BY public.external_quote_requests.id;

-- Selected Quotes
CREATE SEQUENCE IF NOT EXISTS public.selected_quotes_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.selected_quotes (
    id integer PRIMARY KEY DEFAULT nextval('public.selected_quotes_id_seq'),
    user_id character varying REFERENCES public.users(id),
    quote_id integer REFERENCES public.insurance_quotes(id),
    created_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.selected_quotes_id_seq OWNED BY public.selected_quotes.id;

-- Wishlist
CREATE SEQUENCE IF NOT EXISTS public.wishlist_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.wishlist (
    id integer PRIMARY KEY DEFAULT nextval('public.wishlist_id_seq'),
    user_id character varying REFERENCES public.users(id),
    quote_id integer REFERENCES public.insurance_quotes(id),
    created_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.wishlist_id_seq OWNED BY public.wishlist.id;

-- ============================================================================
-- SECTION 7: POLICIES & AGENT RELATIONSHIPS
-- ============================================================================

-- Policies (with agent relationships and commission tracking)
CREATE SEQUENCE IF NOT EXISTS public.policies_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.policies (
    id integer PRIMARY KEY DEFAULT nextval('public.policies_id_seq'),
    user_id character varying REFERENCES public.users(id),
    quote_id integer,
    policy_number character varying NOT NULL,
    status character varying DEFAULT 'active',
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    next_payment_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    selling_agent_id character varying REFERENCES public.users(id),
    servicing_agent_id character varying REFERENCES public.users(id),
    organization_id integer REFERENCES public.agent_organizations(id),
    agent_commission_rate numeric(5,2) DEFAULT 0.00,
    agent_commission_paid boolean DEFAULT false,
    agent_assigned_at timestamp without time zone,
    policy_source character varying(50),
    referral_source character varying(255),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.policies_id_seq OWNED BY public.policies.id;

CREATE INDEX IF NOT EXISTS idx_policies_selling_agent ON public.policies USING btree (selling_agent_id);
CREATE INDEX IF NOT EXISTS idx_policies_servicing_agent ON public.policies USING btree (servicing_agent_id);
CREATE INDEX IF NOT EXISTS idx_policies_organization ON public.policies USING btree (organization_id);

-- Policy Transfers
CREATE SEQUENCE IF NOT EXISTS public.policy_transfers_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.policy_transfers (
    id integer PRIMARY KEY DEFAULT nextval('public.policy_transfers_id_seq'),
    policy_id integer NOT NULL REFERENCES public.policies(id),
    from_agent_id character varying NOT NULL REFERENCES public.users(id),
    to_agent_id character varying NOT NULL REFERENCES public.users(id),
    organization_id integer NOT NULL REFERENCES public.agent_organizations(id),
    transfer_reason character varying(255),
    transfer_notes text,
    transferred_by character varying REFERENCES public.users(id),
    transferred_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.policy_transfers_id_seq OWNED BY public.policy_transfers.id;

CREATE INDEX IF NOT EXISTS idx_policy_transfers_policy ON public.policy_transfers USING btree (policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_transfers_from_agent ON public.policy_transfers USING btree (from_agent_id);
CREATE INDEX IF NOT EXISTS idx_policy_transfers_to_agent ON public.policy_transfers USING btree (to_agent_id);

-- Agent Commissions
CREATE SEQUENCE IF NOT EXISTS public.agent_commissions_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.agent_commissions (
    id integer PRIMARY KEY DEFAULT nextval('public.agent_commissions_id_seq'),
    agent_id character varying NOT NULL REFERENCES public.users(id),
    policy_id integer NOT NULL REFERENCES public.policies(id),
    organization_id integer NOT NULL REFERENCES public.agent_organizations(id),
    commission_type character varying CHECK (commission_type IN ('initial_sale', 'renewal', 'bonus')) NOT NULL,
    commission_rate numeric(5,2) NOT NULL,
    base_amount numeric(10,2) NOT NULL,
    commission_amount numeric(10,2) NOT NULL,
    payment_status character varying CHECK (payment_status IN ('pending', 'approved', 'paid', 'cancelled')) DEFAULT 'pending',
    payment_date timestamp without time zone,
    payment_method character varying(50),
    payment_reference character varying(100),
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.agent_commissions_id_seq OWNED BY public.agent_commissions.id;

CREATE INDEX IF NOT EXISTS idx_agent_commissions_agent ON public.agent_commissions USING btree (agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_policy ON public.agent_commissions USING btree (policy_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_status ON public.agent_commissions USING btree (payment_status);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_date ON public.agent_commissions USING btree (payment_date);

-- Policy Documents
CREATE SEQUENCE IF NOT EXISTS public.policy_documents_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.policy_documents (
    id integer PRIMARY KEY DEFAULT nextval('public.policy_documents_id_seq'),
    policy_id integer NOT NULL REFERENCES public.policies(id),
    document_type character varying(50) NOT NULL,
    file_url character varying(500) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_size integer,
    uploaded_by character varying REFERENCES public.users(id),
    uploaded_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.policy_documents_id_seq OWNED BY public.policy_documents.id;

-- Policy Amendments
CREATE SEQUENCE IF NOT EXISTS public.policy_amendments_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.policy_amendments (
    id integer PRIMARY KEY DEFAULT nextval('public.policy_amendments_id_seq'),
    policy_id integer NOT NULL REFERENCES public.policies(id),
    amendment_type character varying(50) NOT NULL,
    description text,
    previous_value jsonb,
    new_value jsonb,
    effective_date timestamp without time zone NOT NULL,
    amended_by character varying REFERENCES public.users(id),
    created_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.policy_amendments_id_seq OWNED BY public.policy_amendments.id;

-- ============================================================================
-- SECTION 8: CLAIMS MANAGEMENT
-- ============================================================================

-- Claims
CREATE SEQUENCE IF NOT EXISTS public.claims_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.claims (
    id integer PRIMARY KEY DEFAULT nextval('public.claims_id_seq'),
    user_id character varying REFERENCES public.users(id),
    policy_id integer REFERENCES public.policies(id),
    claim_number character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    claim_type character varying(50) NOT NULL,
    incident_date timestamp without time zone NOT NULL,
    amount numeric(10,2),
    estimated_amount numeric(10,2),
    status character varying(20) DEFAULT 'draft',
    priority character varying(20) DEFAULT 'normal',
    assigned_agent character varying REFERENCES public.users(id),
    submitted_at timestamp without time zone,
    reviewed_at timestamp without time zone,
    processed_at timestamp without time zone,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.claims_id_seq OWNED BY public.claims.id;

-- Claim Documents
CREATE SEQUENCE IF NOT EXISTS public.claim_documents_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.claim_documents (
    id integer PRIMARY KEY DEFAULT nextval('public.claim_documents_id_seq'),
    claim_id integer NOT NULL REFERENCES public.claims(id),
    file_name character varying(255) NOT NULL,
    file_type character varying(50) NOT NULL,
    file_size integer,
    document_type character varying(50) NOT NULL,
    uploaded_by character varying REFERENCES public.users(id),
    uploaded_at timestamp without time zone DEFAULT now(),
    is_required boolean DEFAULT false,
    status character varying(20) DEFAULT 'pending'
);

ALTER SEQUENCE public.claim_documents_id_seq OWNED BY public.claim_documents.id;

-- Claim Communications
CREATE SEQUENCE IF NOT EXISTS public.claim_communications_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.claim_communications (
    id integer PRIMARY KEY DEFAULT nextval('public.claim_communications_id_seq'),
    claim_id integer NOT NULL REFERENCES public.claims(id),
    from_user_id character varying REFERENCES public.users(id),
    to_user_id character varying REFERENCES public.users(id),
    message text NOT NULL,
    communication_type character varying(50) DEFAULT 'note',
    is_internal boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.claim_communications_id_seq OWNED BY public.claim_communications.id;

-- Claim Workflow Steps
CREATE SEQUENCE IF NOT EXISTS public.claim_workflow_steps_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.claim_workflow_steps (
    id integer PRIMARY KEY DEFAULT nextval('public.claim_workflow_steps_id_seq'),
    claim_id integer NOT NULL REFERENCES public.claims(id),
    step_name character varying(100) NOT NULL,
    step_order integer NOT NULL,
    status character varying(20) DEFAULT 'pending',
    completed_by character varying REFERENCES public.users(id),
    completed_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.claim_workflow_steps_id_seq OWNED BY public.claim_workflow_steps.id;

-- ============================================================================
-- SECTION 9: APPLICATIONS
-- ============================================================================

-- Applications
CREATE SEQUENCE IF NOT EXISTS public.applications_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.applications (
    id integer PRIMARY KEY DEFAULT nextval('public.applications_id_seq'),
    application_number character varying(30) NOT NULL,
    user_id character varying REFERENCES public.users(id),
    contact_id integer,
    insurance_type_id integer REFERENCES public.insurance_types(id),
    status character varying DEFAULT 'Draft',
    application_data jsonb,
    submitted_at timestamp without time zone,
    reviewed_at timestamp without time zone,
    reviewed_by character varying REFERENCES public.users(id),
    approved_at timestamp without time zone,
    rejected_at timestamp without time zone,
    rejection_reason text,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.applications_id_seq OWNED BY public.applications.id;

-- ============================================================================
-- SECTION 10: POINTS & REWARDS SYSTEM
-- ============================================================================

-- Achievements
CREATE SEQUENCE IF NOT EXISTS public.achievements_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.achievements (
    id integer PRIMARY KEY DEFAULT nextval('public.achievements_id_seq'),
    name character varying(100) NOT NULL,
    description text,
    category character varying(50) CHECK (category IN ('Milestone', 'Streak', 'Activity', 'Special', 'Referral', 'Tier')) NOT NULL,
    icon character varying(50),
    points_reward integer DEFAULT 0,
    requirements jsonb,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER SEQUENCE public.achievements_id_seq OWNED BY public.achievements.id;

-- User Achievements
CREATE SEQUENCE IF NOT EXISTS public.user_achievements_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id integer PRIMARY KEY DEFAULT nextval('public.user_achievements_id_seq'),
    user_id character varying NOT NULL REFERENCES public.users(id),
    achievement_id integer NOT NULL REFERENCES public.achievements(id),
    earned_at timestamp with time zone DEFAULT now(),
    progress_data jsonb
);

ALTER SEQUENCE public.user_achievements_id_seq OWNED BY public.user_achievements.id;

-- Points Rules
CREATE SEQUENCE IF NOT EXISTS public.points_rules_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.points_rules (
    id integer PRIMARY KEY DEFAULT nextval('public.points_rules_id_seq'),
    rule_name character varying(100) NOT NULL,
    action_type character varying(50) NOT NULL,
    points_value integer NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    conditions jsonb,
    max_occurrences_per_user integer,
    max_occurrences_per_day integer,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER SEQUENCE public.points_rules_id_seq OWNED BY public.points_rules.id;

-- Points Transactions
CREATE SEQUENCE IF NOT EXISTS public.points_transactions_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.points_transactions (
    id integer PRIMARY KEY DEFAULT nextval('public.points_transactions_id_seq'),
    user_id character varying NOT NULL REFERENCES public.users(id),
    points integer NOT NULL,
    transaction_type character varying(50) NOT NULL,
    description text,
    reference_id character varying(100),
    reference_type character varying(50),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);

ALTER SEQUENCE public.points_transactions_id_seq OWNED BY public.points_transactions.id;

-- Points Summary
CREATE SEQUENCE IF NOT EXISTS public.points_summary_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.points_summary (
    id integer PRIMARY KEY DEFAULT nextval('public.points_summary_id_seq'),
    user_id character varying NOT NULL UNIQUE REFERENCES public.users(id),
    total_points integer DEFAULT 0,
    lifetime_points integer DEFAULT 0,
    current_tier character varying(50) DEFAULT 'Bronze',
    next_tier character varying(50),
    points_to_next_tier integer DEFAULT 0,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    last_activity_date timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now()
);

ALTER SEQUENCE public.points_summary_id_seq OWNED BY public.points_summary.id;

-- Points (legacy compatibility)
CREATE SEQUENCE IF NOT EXISTS public.points_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.points (
    id integer PRIMARY KEY DEFAULT nextval('public.points_id_seq'),
    user_id character varying NOT NULL REFERENCES public.users(id),
    points integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.points_id_seq OWNED BY public.points.id;

-- Rewards
CREATE SEQUENCE IF NOT EXISTS public.rewards_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.rewards (
    id integer PRIMARY KEY DEFAULT nextval('public.rewards_id_seq'),
    name character varying(200) NOT NULL,
    description text,
    category character varying(50) NOT NULL,
    points_cost integer NOT NULL,
    stock_quantity integer,
    availability_status character varying(20) DEFAULT 'available',
    reward_type character varying(50) DEFAULT 'product',
    reward_value numeric(10,2),
    image_url character varying(500),
    terms_conditions text,
    redemption_instructions text,
    is_featured boolean DEFAULT false,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER SEQUENCE public.rewards_id_seq OWNED BY public.rewards.id;

-- Reward Redemptions
CREATE SEQUENCE IF NOT EXISTS public.reward_redemptions_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.reward_redemptions (
    id integer PRIMARY KEY DEFAULT nextval('public.reward_redemptions_id_seq'),
    user_id character varying NOT NULL REFERENCES public.users(id),
    reward_id integer NOT NULL REFERENCES public.rewards(id),
    points_spent integer NOT NULL,
    status character varying(20) DEFAULT 'pending',
    redemption_code character varying(50),
    fulfillment_details jsonb,
    redeemed_at timestamp with time zone DEFAULT now(),
    fulfilled_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    notes text
);

ALTER SEQUENCE public.reward_redemptions_id_seq OWNED BY public.reward_redemptions.id;

-- Reward Wishlists
CREATE SEQUENCE IF NOT EXISTS public.reward_wishlists_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.reward_wishlists (
    id integer PRIMARY KEY DEFAULT nextval('public.reward_wishlists_id_seq'),
    user_id character varying NOT NULL REFERENCES public.users(id),
    reward_id integer NOT NULL REFERENCES public.rewards(id),
    added_at timestamp with time zone DEFAULT now()
);

ALTER SEQUENCE public.reward_wishlists_id_seq OWNED BY public.reward_wishlists.id;

-- Referral Codes
CREATE SEQUENCE IF NOT EXISTS public.referral_codes_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.referral_codes (
    id integer PRIMARY KEY DEFAULT nextval('public.referral_codes_id_seq'),
    user_id character varying NOT NULL REFERENCES public.users(id),
    code character varying(20) UNIQUE NOT NULL,
    uses_count integer DEFAULT 0,
    max_uses integer,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

ALTER SEQUENCE public.referral_codes_id_seq OWNED BY public.referral_codes.id;

CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes USING btree (code);

-- Referral Signups
CREATE SEQUENCE IF NOT EXISTS public.referral_signups_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.referral_signups (
    id integer PRIMARY KEY DEFAULT nextval('public.referral_signups_id_seq'),
    referrer_user_id character varying NOT NULL REFERENCES public.users(id),
    referred_user_id character varying NOT NULL REFERENCES public.users(id),
    referral_code_id integer NOT NULL REFERENCES public.referral_codes(id),
    referrer_points_awarded integer DEFAULT 0,
    referred_points_awarded integer DEFAULT 0,
    signup_completed_at timestamp with time zone DEFAULT now()
);

ALTER SEQUENCE public.referral_signups_id_seq OWNED BY public.referral_signups.id;

-- Seasonal Campaigns
CREATE SEQUENCE IF NOT EXISTS public.seasonal_campaigns_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.seasonal_campaigns (
    id integer PRIMARY KEY DEFAULT nextval('public.seasonal_campaigns_id_seq'),
    name character varying(100) NOT NULL,
    description text,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    points_multiplier numeric(3,2) DEFAULT 1.00,
    bonus_points integer DEFAULT 0,
    eligible_actions jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

ALTER SEQUENCE public.seasonal_campaigns_id_seq OWNED BY public.seasonal_campaigns.id;

-- Campaign Participations
CREATE SEQUENCE IF NOT EXISTS public.campaign_participations_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.campaign_participations (
    id integer PRIMARY KEY DEFAULT nextval('public.campaign_participations_id_seq'),
    user_id character varying NOT NULL REFERENCES public.users(id),
    campaign_id integer NOT NULL REFERENCES public.seasonal_campaigns(id),
    points_earned integer DEFAULT 0,
    completed_actions jsonb,
    participated_at timestamp with time zone DEFAULT now()
);

ALTER SEQUENCE public.campaign_participations_id_seq OWNED BY public.campaign_participations.id;

-- Leaderboard Settings
CREATE SEQUENCE IF NOT EXISTS public.leaderboard_settings_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.leaderboard_settings (
    id integer PRIMARY KEY DEFAULT nextval('public.leaderboard_settings_id_seq'),
    period_type character varying(20) CHECK (period_type IN ('daily', 'weekly', 'monthly', 'all_time')) NOT NULL,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    is_active boolean DEFAULT true,
    prize_details jsonb,
    created_at timestamp with time zone DEFAULT now()
);

ALTER SEQUENCE public.leaderboard_settings_id_seq OWNED BY public.leaderboard_settings.id;

-- ============================================================================
-- SECTION 11: NOTIFICATIONS
-- ============================================================================

-- Notifications
CREATE SEQUENCE IF NOT EXISTS public.notifications_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.notifications (
    id integer PRIMARY KEY DEFAULT nextval('public.notifications_id_seq'),
    user_id character varying NOT NULL REFERENCES public.users(id),
    type character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    data jsonb,
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications USING btree (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications USING btree (type);

-- ============================================================================
-- SECTION 12: DRIZZLE MIGRATIONS (SYSTEM)
-- ============================================================================

-- Drizzle Schema
CREATE SCHEMA IF NOT EXISTS drizzle;

-- Drizzle Migrations Table
CREATE SEQUENCE IF NOT EXISTS drizzle.__drizzle_migrations_id_seq AS integer;

CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id integer PRIMARY KEY DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'),
    hash text NOT NULL,
    created_at bigint
);

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;

-- ============================================================================
-- SEQUENCE DEFAULT ASSIGNMENTS
-- ============================================================================
-- Note: All sequences are already assigned to their respective table columns above
-- using ALTER SEQUENCE ... OWNED BY statements

-- ============================================================================
-- PRIMARY KEY CONSTRAINTS
-- ============================================================================
-- Note: All primary keys are defined inline in the table creation statements

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- Note: All foreign keys are defined inline using REFERENCES in table creation

-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================
-- Note: All unique constraints are defined inline in table creation statements

-- ============================================================================
-- CHECK CONSTRAINTS
-- ============================================================================
-- Note: All check constraints are defined inline in table creation statements

-- ============================================================================
-- END OF SCHEMA EXPORT
-- ============================================================================

-- Summary:
-- Total Tables: ~52 tables
-- Sections:
--   1. Core System Tables (sessions)
--   2. Organization & User Management (5 tables)
--   3. Authentication & Security - Phase 2 (7 tables)
--   4. Association Tables (3 tables)
--   5. Agent & Client Management (5 tables)
--   6. Insurance Types, Providers & Quotes (6 tables)
--   7. Policies & Agent Relationships (6 tables)
--   8. Claims Management (4 tables)
--   9. Applications (1 table)
--  10. Points & Rewards System (14 tables)
--  11. Notifications (1 table)
--  12. Drizzle Migrations (1 table)

-- All indexes, constraints, and relationships included
-- Ready for fresh database initialization
-- Compatible with Drizzle ORM schema


-- =============================================
-- JustAskShel Database Schema Creation Script
-- =============================================
-- Description: Create complete database schema with all tables, constraints, and indexes
-- Dependencies: 00_init.sql
-- Execution Order: 01
-- Idempotent: Yes
-- Reference: shared/schema.ts

BEGIN;

-- =============================================
-- Session Management Table (Required for Replit Auth)
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- =============================================
-- Core Entity Tables
-- =============================================

-- Agent Organizations (Multi-tenant support)
CREATE TABLE IF NOT EXISTS agent_organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    logo_url VARCHAR(500),
    primary_color VARCHAR(20) DEFAULT '#0EA5E9',
    secondary_color VARCHAR(20) DEFAULT '#64748B',
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    subscription_plan VARCHAR(50) DEFAULT 'Basic' CHECK (subscription_plan IN ('Basic', 'Professional', 'Enterprise')),
    subscription_status VARCHAR(20) DEFAULT 'Trial' CHECK (subscription_status IN ('Trial', 'Active', 'Expired', 'Cancelled')),
    max_agents INTEGER DEFAULT 5,
    max_members INTEGER DEFAULT 100,
    settings JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Persons (Unified entity model - single source of truth for individual data)
CREATE TABLE IF NOT EXISTS persons (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    middle_name VARCHAR(100),
    last_name VARCHAR(100),
    prefix VARCHAR(10),
    suffix VARCHAR(10),
    date_of_birth DATE,
    gender VARCHAR(20),
    ssn_last_four VARCHAR(4),
    primary_email VARCHAR(255),
    secondary_email VARCHAR(255),
    primary_phone VARCHAR(20),
    secondary_phone VARCHAR(20),
    street_address TEXT,
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'USA',
    full_name VARCHAR(255),
    ssn_encrypted VARCHAR(255),
    external_ids JSONB,
    identity_hash VARCHAR(255),
    data_source VARCHAR(50),
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users (Authentication and role management)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id INTEGER REFERENCES persons(id),
    email VARCHAR UNIQUE,
    profile_image_url VARCHAR,
    password VARCHAR(255),
    role VARCHAR CHECK (role IN ('SuperAdmin', 'LandlordAdmin', 'Agent', 'Member', 'Guest', 'Visitor')) DEFAULT 'Guest',
    privilege_level INTEGER DEFAULT 4, -- 0=SuperAdmin, 1=LandlordAdmin, 2=Agent, 3=Member, 4=Guest, 5=Visitor
    organization_id INTEGER REFERENCES agent_organizations(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Roles Definition
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    privilege_level INTEGER UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Insurance Domain Tables
-- =============================================

-- Insurance Types
CREATE TABLE IF NOT EXISTS insurance_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insurance Providers
CREATE TABLE IF NOT EXISTS insurance_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo VARCHAR(255),
    rating DECIMAL(2,1),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Policies and Claims Tables
-- =============================================

-- Policies
CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    quote_id INTEGER,
    policy_number VARCHAR(100) UNIQUE NOT NULL,
    insurance_type_id INTEGER REFERENCES insurance_types(id),
    provider_name VARCHAR(255),
    coverage_amount DECIMAL(12,2),
    premium_amount DECIMAL(10,2),
    deductible DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'suspended')),
    policy_documents JSONB,
    beneficiaries JSONB,
    next_payment_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Claims
CREATE TABLE IF NOT EXISTS claims (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    policy_id INTEGER REFERENCES policies(id),
    claim_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    claim_type VARCHAR(50) NOT NULL,
    incident_date TIMESTAMP NOT NULL,
    amount DECIMAL(12,2),
    estimated_amount DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'denied', 'paid', 'closed')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_agent VARCHAR REFERENCES users(id),
    submitted_at TIMESTAMP,
    processed_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMIT;

-- Verification
SELECT 'Schema created successfully' as status, count(*) as tables_created 
FROM information_schema.tables 
WHERE table_schema = 'public';
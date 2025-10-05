-- =============================================
-- Core Tables Creation Script
-- =============================================
-- Description: Create core authentication and organization tables
-- Dependencies: schema/01_create_schema.sql
-- Execution Order: 10
-- Idempotent: Yes

BEGIN;

-- =============================================
-- Agent Organizations
-- =============================================
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

-- =============================================
-- Persons (Unified Entity Model)
-- =============================================
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

-- =============================================
-- Users (Authentication & Authorization)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id INTEGER REFERENCES persons(id),
    email VARCHAR UNIQUE,
    profile_image_url VARCHAR,
    password VARCHAR(255),
    role VARCHAR CHECK (role IN ('SuperAdmin', 'TenantAdmin', 'Agent', 'Member', 'Guest', 'Visitor')) DEFAULT 'Guest',
    privilege_level INTEGER DEFAULT 4, -- 0=SuperAdmin, 1=TenantAdmin, 2=Agent, 3=Member, 4=Guest, 5=Visitor
    organization_id INTEGER REFERENCES agent_organizations(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Roles Definition
-- =============================================
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

COMMIT;

-- Verification
SELECT 'Core tables created successfully' as status;
-- =============================================
-- Association and Utility Tables Creation Script
-- =============================================
-- Description: Create member, contact, and association tables
-- Dependencies: 30_create_policy_claims_tables.sql
-- Execution Order: 40
-- Idempotent: Yes

BEGIN;

-- =============================================
-- Members
-- =============================================
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    member_number VARCHAR(50) UNIQUE NOT NULL,
    membership_status VARCHAR(20) DEFAULT 'Active' CHECK (membership_status IN ('Active', 'Inactive', 'Suspended', 'Expired')),
    membership_date TIMESTAMP DEFAULT NOW(),
    profile_image_url VARCHAR,
    avatar_type VARCHAR(20) DEFAULT 'initials' CHECK (avatar_type IN ('initials', 'image', 'generated')),
    avatar_color VARCHAR(20) DEFAULT '#0EA5E9',
    bio TEXT,
    emergency_contact TEXT,
    preferences JSONB,
    organization_id INTEGER REFERENCES agent_organizations(id),
    person_id INTEGER REFERENCES persons(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Contacts
-- =============================================
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    company VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Archived')),
    assigned_agent VARCHAR REFERENCES users(id),
    organization_id INTEGER REFERENCES agent_organizations(id),
    person_id INTEGER REFERENCES persons(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Person-User Association
-- =============================================
CREATE TABLE IF NOT EXISTS person_users (
    id SERIAL PRIMARY KEY,
    person_id INTEGER REFERENCES persons(id) NOT NULL,
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    role_context JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(person_id, user_id)
);

-- =============================================
-- Person-Member Association
-- =============================================
CREATE TABLE IF NOT EXISTS person_members (
    id SERIAL PRIMARY KEY,
    person_id INTEGER REFERENCES persons(id) NOT NULL,
    member_id INTEGER REFERENCES members(id) NOT NULL,
    organization_id INTEGER REFERENCES agent_organizations(id),
    member_number VARCHAR(50),
    membership_status VARCHAR(20) DEFAULT 'Active',
    membership_date TIMESTAMP DEFAULT NOW(),
    additional_info JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(person_id, member_id)
);

-- =============================================
-- Person-Contact Association
-- =============================================
CREATE TABLE IF NOT EXISTS person_contacts (
    id SERIAL PRIMARY KEY,
    person_id INTEGER REFERENCES persons(id) NOT NULL,
    contact_id INTEGER REFERENCES contacts(id) NOT NULL,
    contact_context VARCHAR(100),
    organization_id INTEGER REFERENCES agent_organizations(id),
    assigned_agent VARCHAR REFERENCES users(id),
    contact_metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(person_id, contact_id)
);

-- =============================================
-- Dependents
-- =============================================
CREATE TABLE IF NOT EXISTS dependents (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    date_of_birth TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Applications
-- =============================================
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    application_number VARCHAR(100) UNIQUE NOT NULL,
    user_id VARCHAR REFERENCES users(id),
    contact_id INTEGER REFERENCES contacts(id),
    insurance_type_id INTEGER REFERENCES insurance_types(id),
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Expired')),
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

COMMIT;

-- Verification
SELECT 'Association tables created successfully' as status;
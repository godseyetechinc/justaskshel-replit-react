-- =============================================
-- Policies and Claims Tables Creation Script
-- =============================================
-- Description: Create policies, claims, and related workflow tables
-- Dependencies: 20_create_insurance_tables.sql
-- Execution Order: 30
-- Idempotent: Yes

BEGIN;

-- =============================================
-- Policies
-- =============================================
CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    quote_id INTEGER REFERENCES insurance_quotes(id),
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

-- =============================================
-- Policy Amendments
-- =============================================
CREATE TABLE IF NOT EXISTS policy_amendments (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES policies(id),
    amendment_type VARCHAR(50) NOT NULL,
    description TEXT,
    effective_date DATE,
    premium_change DECIMAL(10,2),
    coverage_change DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_by VARCHAR REFERENCES users(id),
    approved_by VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Claims
-- =============================================
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

-- =============================================
-- Claim Documents
-- =============================================
CREATE TABLE IF NOT EXISTS claim_documents (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES claims(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER,
    document_type VARCHAR(100) NOT NULL,
    uploaded_by VARCHAR REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    is_required BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- =============================================
-- Claim Communications
-- =============================================
CREATE TABLE IF NOT EXISTS claim_communications (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES claims(id) NOT NULL,
    user_id VARCHAR REFERENCES users(id),
    message_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Claim Workflow Steps
-- =============================================
CREATE TABLE IF NOT EXISTS claim_workflow_steps (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES claims(id) NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_description TEXT,
    status VARCHAR(50) NOT NULL,
    assigned_to VARCHAR REFERENCES users(id),
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMIT;

-- Verification
SELECT 'Policy and claims tables created successfully' as status;
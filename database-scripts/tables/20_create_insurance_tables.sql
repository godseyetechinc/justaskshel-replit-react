-- =============================================
-- Insurance Domain Tables Creation Script
-- =============================================
-- Description: Create insurance types, providers, quotes, and related tables
-- Dependencies: 10_create_core_tables.sql
-- Execution Order: 20
-- Idempotent: Yes

BEGIN;

-- =============================================
-- Insurance Types
-- =============================================
CREATE TABLE IF NOT EXISTS insurance_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Insurance Providers
-- =============================================
CREATE TABLE IF NOT EXISTS insurance_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo VARCHAR(255),
    rating DECIMAL(2,1),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Insurance Quotes
-- =============================================
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
    medical_exam_required BOOLEAN DEFAULT false,
    conversion_option BOOLEAN DEFAULT false,
    features JSONB,
    rating DECIMAL(2,1),
    -- External provider integration fields
    is_external BOOLEAN DEFAULT false,
    external_quote_id VARCHAR(255),
    external_provider_id VARCHAR(100),
    external_provider_name VARCHAR(255),
    application_url VARCHAR(500),
    expires_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- External Quote Requests
-- =============================================
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

-- =============================================
-- Selected Quotes (User Selections)
-- =============================================
CREATE TABLE IF NOT EXISTS selected_quotes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    quote_id INTEGER REFERENCES insurance_quotes(id),
    notes TEXT,
    selected_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Wishlist (User Saved Quotes)
-- =============================================
CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    quote_id INTEGER REFERENCES insurance_quotes(id),
    notes TEXT,
    added_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

COMMIT;

-- Verification
SELECT 'Insurance tables created successfully' as status;
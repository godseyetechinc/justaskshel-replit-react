-- =============================================
-- JustAskShel Database Initialization Script
-- =============================================
-- Description: Initialize database with required extensions
-- Dependencies: PostgreSQL 12+
-- Execution Order: 00 (First)
-- Idempotent: Yes

BEGIN;

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone and locale settings
SET timezone = 'UTC';

COMMIT;

-- Verification
SELECT 
    'Database initialized successfully' as status,
    current_database() as database_name,
    current_user as current_user,
    now() as timestamp;
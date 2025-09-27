-- =============================================
-- Drop All Tables Script
-- =============================================
-- Description: Drop all tables in correct dependency order
-- Dependencies: None
-- Execution Order: 90 (High drop order)
-- WARNING: This will destroy all data permanently!

-- Uncomment the following line to enable table dropping
-- SET client_min_messages = warning;

BEGIN;

-- Drop tables in reverse dependency order
-- (Most dependent tables first, core tables last)

-- Applications and dependent data
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS dependents CASCADE;

-- Claims and workflow
DROP TABLE IF EXISTS claim_workflow_steps CASCADE;
DROP TABLE IF EXISTS claim_communications CASCADE;
DROP TABLE IF EXISTS claim_documents CASCADE;
DROP TABLE IF EXISTS claims CASCADE;

-- Policies
DROP TABLE IF EXISTS policy_amendments CASCADE;
DROP TABLE IF EXISTS policies CASCADE;

-- Quote selections and wishlist
DROP TABLE IF EXISTS selected_quotes CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS external_quote_requests CASCADE;
DROP TABLE IF EXISTS insurance_quotes CASCADE;

-- Association tables
DROP TABLE IF EXISTS person_contacts CASCADE;
DROP TABLE IF EXISTS person_members CASCADE;
DROP TABLE IF EXISTS person_users CASCADE;

-- Member and contact tables
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;

-- Core user and person tables
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS persons CASCADE;

-- Reference tables
DROP TABLE IF EXISTS insurance_providers CASCADE;
DROP TABLE IF EXISTS insurance_types CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS agent_organizations CASCADE;

-- Session table (last)
DROP TABLE IF EXISTS sessions CASCADE;

COMMIT;

-- Verification
SELECT 'All tables dropped successfully' as status, count(*) as remaining_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';
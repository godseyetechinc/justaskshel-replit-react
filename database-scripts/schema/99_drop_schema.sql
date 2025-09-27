-- =============================================
-- JustAskShel Database Schema Drop Script
-- =============================================
-- Description: Safely drop all database objects in correct dependency order
-- Dependencies: None
-- Execution Order: 99 (Last)
-- WARNING: This will destroy all data permanently!

-- Confirm intention (uncomment the following line to enable dropping)
-- SET client_min_messages = warning;

BEGIN;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS claim_workflow_steps CASCADE;
DROP TABLE IF EXISTS claim_communications CASCADE;
DROP TABLE IF EXISTS claim_documents CASCADE;
DROP TABLE IF EXISTS claims CASCADE;

DROP TABLE IF EXISTS policy_amendments CASCADE;
DROP TABLE IF EXISTS policies CASCADE;

DROP TABLE IF EXISTS points_transactions CASCADE;
DROP TABLE IF EXISTS points_summary CASCADE;
DROP TABLE IF EXISTS reward_redemptions CASCADE;
DROP TABLE IF EXISTS points_rules CASCADE;
DROP TABLE IF EXISTS points CASCADE;

DROP TABLE IF EXISTS selected_quotes CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS external_quote_requests CASCADE;
DROP TABLE IF EXISTS insurance_quotes CASCADE;

DROP TABLE IF EXISTS dependents CASCADE;
DROP TABLE IF EXISTS applications CASCADE;

-- Association tables
DROP TABLE IF EXISTS person_contacts CASCADE;
DROP TABLE IF EXISTS person_members CASCADE;
DROP TABLE IF EXISTS person_users CASCADE;

-- Core entity tables
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS persons CASCADE;

-- Reference tables
DROP TABLE IF EXISTS insurance_providers CASCADE;
DROP TABLE IF EXISTS insurance_types CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS agent_organizations CASCADE;

-- Session table
DROP TABLE IF EXISTS sessions CASCADE;

-- Drop extensions (optional - uncomment if needed)
-- DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

COMMIT;

-- Verification
SELECT 'Schema dropped successfully' as status, count(*) as remaining_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';
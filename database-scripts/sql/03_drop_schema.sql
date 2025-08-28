-- =====================================================
-- JustAskShel Insurance Platform - Drop Database Schema
-- =====================================================
-- WARNING: This script will completely remove all database
-- tables and data. Use with extreme caution!
-- 
-- This script drops all tables in reverse dependency order
-- to avoid foreign key constraint violations.
-- =====================================================

-- =====================================================
-- DISABLE FOREIGN KEY CHECKS TEMPORARILY (PostgreSQL)
-- =====================================================

-- PostgreSQL doesn't have a global FK disable, so we drop in correct order

-- =====================================================
-- DROP DEPENDENT TABLES FIRST (Tables with Foreign Keys)
-- =====================================================

-- Loyalty & Rewards System
DROP TABLE IF EXISTS reward_redemptions CASCADE;
DROP TABLE IF EXISTS points_transactions CASCADE;
DROP TABLE IF EXISTS points_summary CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS points_rules CASCADE;

-- Applications & Applicants
DROP TABLE IF EXISTS applicant_dependents CASCADE;
DROP TABLE IF EXISTS applicants CASCADE;
DROP TABLE IF EXISTS applications CASCADE;

-- Claims Management
DROP TABLE IF EXISTS claim_workflow_steps CASCADE;
DROP TABLE IF EXISTS claim_communications CASCADE;
DROP TABLE IF EXISTS claim_documents CASCADE;
DROP TABLE IF EXISTS claims CASCADE;

-- Policy Management
DROP TABLE IF EXISTS policy_amendments CASCADE;
DROP TABLE IF EXISTS premium_payments CASCADE;
DROP TABLE IF EXISTS policy_documents CASCADE;
DROP TABLE IF EXISTS policies CASCADE;

-- Quotes & Selections
DROP TABLE IF EXISTS external_quote_requests CASCADE;
DROP TABLE IF EXISTS selected_quotes CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS insurance_quotes CASCADE;

-- Member & Organization Management
DROP TABLE IF EXISTS dependents CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- User Management
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- DROP CORE TABLES (No Dependencies)
-- =====================================================

-- Insurance Core Entities
DROP TABLE IF EXISTS insurance_providers CASCADE;
DROP TABLE IF EXISTS insurance_types CASCADE;

-- Role & Authorization System
DROP TABLE IF EXISTS roles CASCADE;

-- Multi-tenant Organizations
DROP TABLE IF EXISTS agent_organizations CASCADE;

-- Authentication System
DROP TABLE IF EXISTS sessions CASCADE;

-- =====================================================
-- DROP INDEXES (Usually dropped automatically with tables)
-- =====================================================

-- Individual index drops (if needed)
DROP INDEX IF EXISTS IDX_session_expire;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_organization_id;
DROP INDEX IF EXISTS idx_quotes_user_id;
DROP INDEX IF EXISTS idx_quotes_type_id;
DROP INDEX IF EXISTS idx_quotes_is_external;
DROP INDEX IF EXISTS idx_policies_user_id;
DROP INDEX IF EXISTS idx_policies_status;
DROP INDEX IF EXISTS idx_policies_agent_id;
DROP INDEX IF EXISTS idx_claims_user_id;
DROP INDEX IF EXISTS idx_claims_policy_id;
DROP INDEX IF EXISTS idx_claims_status;
DROP INDEX IF EXISTS idx_applications_user_id;
DROP INDEX IF EXISTS idx_applications_status;
DROP INDEX IF EXISTS idx_points_transactions_user_id;
DROP INDEX IF EXISTS idx_points_summary_user_id;
DROP INDEX IF EXISTS idx_external_quote_requests_user_id;
DROP INDEX IF EXISTS idx_external_quote_requests_status;

-- =====================================================
-- DROP EXTENSIONS (Optional)
-- =====================================================

-- Uncomment if you want to remove the UUID extension
-- DROP EXTENSION IF EXISTS "pgcrypto";

-- =====================================================
-- VERIFICATION QUERIES (Optional)
-- =====================================================

-- Uncomment to verify all tables are dropped
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_type = 'BASE TABLE'
-- ORDER BY table_name;

-- =====================================================
-- SCHEMA DROP COMPLETED
-- =====================================================

-- All database objects have been successfully removed
-- To recreate the database, run:
-- 1. 01_create_schema.sql (creates all tables)
-- 2. 02_seed_data.sql (populates with initial data)
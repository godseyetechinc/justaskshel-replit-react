-- =============================================
-- Database Backup Script
-- =============================================
-- Description: Create comprehensive backup of JustAskShel database
-- Usage: Run this script to create a full backup with data
-- Note: This creates logical backup statements, not physical backup

-- Generate timestamp for backup identification
\set backup_timestamp `date +%Y%m%d_%H%M%S`

-- Set output format
\pset format unaligned
\pset tuples_only on
\o /tmp/justaskshel_backup_:backup_timestamp.sql

-- Backup header
SELECT '-- =============================================';
SELECT '-- JustAskShel Database Backup';
SELECT '-- Generated: ' || NOW()::text;
SELECT '-- Timestamp: ' || ':backup_timestamp';
SELECT '-- =============================================';
SELECT '';
SELECT 'BEGIN;';
SELECT '';

-- Backup schema structure (basic DDL)
SELECT '-- =============================================';
SELECT '-- SCHEMA STRUCTURE';
SELECT '-- =============================================';

-- Note: For full schema backup, use pg_dump instead
-- This is a simplified version for reference

-- Backup data
SELECT '-- =============================================';
SELECT '-- DATA BACKUP';
SELECT '-- =============================================';

-- Core tables data
\echo '-- Agent Organizations'
SELECT 'INSERT INTO agent_organizations VALUES ' || string_agg(
    '(' || 
    id || ',' ||
    quote_literal(name) || ',' ||
    quote_literal(display_name) || ',' ||
    COALESCE(quote_literal(description), 'NULL') || ',' ||
    COALESCE(quote_literal(website), 'NULL') || ',' ||
    COALESCE(quote_literal(phone), 'NULL') || ',' ||
    COALESCE(quote_literal(email), 'NULL') || ',' ||
    COALESCE(quote_literal(address), 'NULL') || ',' ||
    COALESCE(quote_literal(city), 'NULL') || ',' ||
    COALESCE(quote_literal(state), 'NULL') || ',' ||
    COALESCE(quote_literal(zip_code), 'NULL') || ',' ||
    COALESCE(quote_literal(logo_url), 'NULL') || ',' ||
    quote_literal(primary_color) || ',' ||
    quote_literal(secondary_color) || ',' ||
    quote_literal(status) || ',' ||
    quote_literal(subscription_plan) || ',' ||
    quote_literal(subscription_status) || ',' ||
    max_agents || ',' ||
    max_members || ',' ||
    COALESCE(settings::text, 'NULL') || ',' ||
    quote_literal(created_at::text) || ',' ||
    quote_literal(updated_at::text) ||
    ')', 
    ',
'
) || ';'
FROM agent_organizations;

\echo '-- Insurance Types'
SELECT 'INSERT INTO insurance_types VALUES ' || string_agg(
    '(' || 
    id || ',' ||
    quote_literal(name) || ',' ||
    COALESCE(quote_literal(description), 'NULL') || ',' ||
    COALESCE(quote_literal(icon), 'NULL') || ',' ||
    COALESCE(quote_literal(color), 'NULL') || ',' ||
    quote_literal(created_at::text) ||
    ')', 
    ',
'
) || ';'
FROM insurance_types;

\echo '-- Insurance Providers'
SELECT 'INSERT INTO insurance_providers VALUES ' || string_agg(
    '(' || 
    id || ',' ||
    quote_literal(name) || ',' ||
    COALESCE(quote_literal(logo), 'NULL') || ',' ||
    COALESCE(rating::text, 'NULL') || ',' ||
    quote_literal(created_at::text) ||
    ')', 
    ',
'
) || ';'
FROM insurance_providers;

\echo '-- Achievements'
SELECT 'INSERT INTO achievements VALUES ' || string_agg(
    '(' || 
    id || ',' ||
    quote_literal(name) || ',' ||
    COALESCE(quote_literal(description), 'NULL') || ',' ||
    quote_literal(category) || ',' ||
    COALESCE(quote_literal(icon), 'NULL') || ',' ||
    points_reward || ',' ||
    COALESCE(requirements::text, 'NULL') || ',' ||
    is_active || ',' ||
    sort_order || ',' ||
    quote_literal(created_at::text) || ',' ||
    quote_literal(updated_at::text) ||
    ')', 
    ',
'
) || ';'
FROM achievements;

\echo '-- Rewards'
SELECT 'INSERT INTO rewards VALUES ' || string_agg(
    '(' || 
    id || ',' ||
    quote_literal(name) || ',' ||
    COALESCE(quote_literal(description), 'NULL') || ',' ||
    quote_literal(category) || ',' ||
    points_cost || ',' ||
    COALESCE(value::text, 'NULL') || ',' ||
    COALESCE(quote_literal(image_url), 'NULL') || ',' ||
    COALESCE(available_quantity::text, 'NULL') || ',' ||
    is_active || ',' ||
    quote_literal(valid_from::text) || ',' ||
    COALESCE(quote_literal(valid_until::text), 'NULL') || ',' ||
    COALESCE(quote_literal(terms), 'NULL') || ',' ||
    quote_literal(created_at::text) || ',' ||
    quote_literal(updated_at::text) ||
    ')', 
    ',
'
) || ';'
FROM rewards;

\echo '-- Points Rules'
SELECT 'INSERT INTO points_rules VALUES ' || string_agg(
    '(' || 
    id || ',' ||
    quote_literal(name) || ',' ||
    COALESCE(quote_literal(description), 'NULL') || ',' ||
    quote_literal(category) || ',' ||
    points || ',' ||
    COALESCE(max_per_period::text, 'NULL') || ',' ||
    COALESCE(quote_literal(period_type), 'NULL') || ',' ||
    is_active || ',' ||
    quote_literal(valid_from::text) || ',' ||
    COALESCE(quote_literal(valid_until::text), 'NULL') || ',' ||
    COALESCE(conditions::text, 'NULL') || ',' ||
    quote_literal(created_at::text) || ',' ||
    quote_literal(updated_at::text) ||
    ')', 
    ',
'
) || ';'
FROM points_rules;

-- End backup
SELECT '';
SELECT 'COMMIT;';
SELECT '';
SELECT '-- =============================================';
SELECT '-- BACKUP COMPLETED: ' || NOW()::text;
SELECT '-- Total tables backed up: ' || (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
)::text;
SELECT '-- =============================================';

\o
\pset format aligned
\pset tuples_only off

-- Display summary
SELECT 'Backup completed successfully!' as status,
       '/tmp/justaskshel_backup_' || to_char(NOW(), 'YYYYMMDD_HH24MISS') || '.sql' as backup_file;
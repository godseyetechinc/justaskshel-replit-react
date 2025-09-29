-- =============================================
-- Database Cleanup and Maintenance Script
-- =============================================
-- Description: Clean up old data, optimize tables, and maintain database health
-- Dependencies: None
-- Usage: Run periodically for database maintenance
-- Safety: Includes safety checks and confirmations

BEGIN;

-- =============================================
-- Configuration Variables
-- =============================================
-- Set cleanup parameters (modify as needed)
\set retention_days 90
\set notification_retention_days 30
\set session_cleanup_days 7
\set audit_retention_days 180

-- =============================================
-- Safety Check
-- =============================================
DO $$
BEGIN
    -- Prevent accidental cleanup in production without explicit confirmation
    IF current_database() = 'production_db_name' THEN
        RAISE NOTICE 'Production database detected. Please confirm cleanup operation.';
        -- Uncomment next line after review to enable production cleanup
        -- RAISE EXCEPTION 'Production cleanup not confirmed. Aborting.';
    END IF;
END $$;

-- =============================================
-- Clean Expired Sessions
-- =============================================
\echo 'Cleaning expired sessions...'

-- Count expired sessions
SELECT COUNT(*) as expired_sessions_count 
FROM sessions 
WHERE expire < NOW();

-- Delete expired sessions
DELETE FROM sessions 
WHERE expire < NOW();

\echo 'Expired sessions cleaned.'

-- =============================================
-- Clean Old Notifications
-- =============================================
\echo 'Cleaning old notifications...'

-- Count old notifications
SELECT COUNT(*) as old_notifications_count
FROM notifications 
WHERE created_at < NOW() - INTERVAL ':notification_retention_days days'
   OR (expires_at IS NOT NULL AND expires_at < NOW());

-- Delete old notifications
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL ':notification_retention_days days'
   OR (expires_at IS NOT NULL AND expires_at < NOW());

\echo 'Old notifications cleaned.'

-- =============================================
-- Clean Expired Reward Redemptions
-- =============================================
\echo 'Updating expired reward redemptions...'

-- Update expired redemptions
UPDATE reward_redemptions 
SET status = 'Expired'
WHERE status = 'Pending' 
  AND expires_at < NOW();

SELECT ROW_COUNT() as expired_redemptions_updated;

-- =============================================
-- Clean Old Points Transactions
-- =============================================
\echo 'Cleaning very old points transactions (keeping summary data)...'

-- Archive old transactions (optional - create archive table first)
-- CREATE TABLE IF NOT EXISTS points_transactions_archive AS 
-- SELECT * FROM points_transactions WHERE 1=0;

-- Keep essential transactions, clean very old ones
WITH old_transactions AS (
    SELECT id 
    FROM points_transactions 
    WHERE created_at < NOW() - INTERVAL ':retention_days days'
    AND transaction_type NOT IN ('Earned', 'Redeemed') -- Keep earned/redeemed for audit
    LIMIT 1000 -- Limit batch size for safety
)
DELETE FROM points_transactions 
WHERE id IN (SELECT id FROM old_transactions);

\echo 'Old points transactions cleaned.'

-- =============================================
-- Clean Expired External Quote Requests
-- =============================================
\echo 'Cleaning old external quote requests...'

DELETE FROM external_quote_requests 
WHERE created_at < NOW() - INTERVAL ':retention_days days'
  AND status IN ('completed', 'failed', 'expired');

\echo 'Old external quote requests cleaned.'

-- =============================================
-- Clean Inactive Referral Codes
-- =============================================
\echo 'Deactivating expired referral codes...'

UPDATE referral_codes 
SET is_active = false
WHERE expires_at < NOW() 
  AND is_active = true;

\echo 'Expired referral codes deactivated.'

-- =============================================
-- Clean Old Social Activities
-- =============================================
\echo 'Cleaning old social activities...'

DELETE FROM social_activities 
WHERE created_at < NOW() - INTERVAL ':retention_days days'
  AND is_public = false; -- Keep public activities longer

\echo 'Old social activities cleaned.'

-- =============================================
-- Clean Orphaned Records
-- =============================================
\echo 'Cleaning orphaned records...'

-- Clean orphaned person associations
DELETE FROM person_users 
WHERE user_id NOT IN (SELECT id FROM users);

DELETE FROM person_members 
WHERE member_id NOT IN (SELECT id FROM members);

DELETE FROM person_contacts 
WHERE contact_id NOT IN (SELECT id FROM contacts);

-- Clean orphaned user achievements
DELETE FROM user_achievements 
WHERE user_id NOT IN (SELECT id FROM users);

-- Clean orphaned reward interactions
DELETE FROM reward_interactions 
WHERE user_id NOT IN (SELECT id FROM users)
   OR reward_id NOT IN (SELECT id FROM rewards);

\echo 'Orphaned records cleaned.'

-- =============================================
-- Update Statistics
-- =============================================
\echo 'Updating table statistics...'

-- Update table statistics for better query performance
ANALYZE sessions;
ANALYZE notifications;
ANALYZE points_transactions;
ANALYZE reward_redemptions;
ANALYZE external_quote_requests;
ANALYZE social_activities;
ANALYZE user_achievements;
ANALYZE reward_interactions;

\echo 'Table statistics updated.'

-- =============================================
-- Reindex Critical Tables
-- =============================================
\echo 'Reindexing critical tables...'

-- Reindex frequently accessed tables
REINDEX TABLE points_transactions;
REINDEX TABLE notifications;
REINDEX TABLE user_achievements;
REINDEX TABLE sessions;

\echo 'Critical tables reindexed.'

-- =============================================
-- Vacuum Tables
-- =============================================
\echo 'Vacuuming tables to reclaim space...'

-- Vacuum tables to reclaim space
VACUUM ANALYZE points_transactions;
VACUUM ANALYZE notifications;
VACUUM ANALYZE sessions;
VACUUM ANALYZE social_activities;

\echo 'Tables vacuumed.'

-- =============================================
-- Generate Cleanup Report
-- =============================================
\echo 'Generating cleanup report...'

SELECT 
    'Database Cleanup Summary' as report_title,
    NOW() as cleanup_completed_at;

-- Table sizes after cleanup
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Current active data counts
SELECT 'Active Users' as metric, COUNT(*) as count FROM users WHERE is_active = true
UNION ALL
SELECT 'Active Notifications', COUNT(*) FROM notifications WHERE is_read = false
UNION ALL
SELECT 'Pending Redemptions', COUNT(*) FROM reward_redemptions WHERE status = 'Pending'
UNION ALL
SELECT 'Active Campaigns', COUNT(*) FROM seasonal_campaigns WHERE is_active = true
UNION ALL
SELECT 'Recent Points Transactions', COUNT(*) FROM points_transactions WHERE created_at > NOW() - INTERVAL '30 days';

-- Database size
SELECT pg_size_pretty(pg_database_size(current_database())) as total_database_size;

COMMIT;

\echo 'Database cleanup completed successfully!';
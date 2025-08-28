-- =====================================================
-- JustAskShel Insurance Platform - Utility Queries
-- =====================================================
-- This script contains useful utility queries for database
-- maintenance, monitoring, and development purposes.
-- =====================================================

-- =====================================================
-- DATABASE STATISTICS & MONITORING
-- =====================================================

-- Table sizes and row counts
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Get all table sizes with row counts
SELECT 
    t.table_name,
    pg_size_pretty(pg_total_relation_size(c.oid)) AS table_size,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count,
    c.reltuples::bigint AS estimated_rows
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
ORDER BY pg_total_relation_size(c.oid) DESC;

-- Database connection statistics
SELECT 
    datname as database_name,
    numbackends as active_connections,
    xact_commit as transactions_committed,
    xact_rollback as transactions_rolled_back,
    blks_read as blocks_read,
    blks_hit as blocks_hit,
    tup_returned as tuples_returned,
    tup_fetched as tuples_fetched,
    tup_inserted as tuples_inserted,
    tup_updated as tuples_updated,
    tup_deleted as tuples_deleted
FROM pg_stat_database 
WHERE datname = current_database();

-- =====================================================
-- USER & ORGANIZATION ANALYTICS
-- =====================================================

-- User distribution by role and organization
SELECT 
    ao.display_name as organization,
    u.role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN u.is_active = true THEN 1 END) as active_users
FROM users u
LEFT JOIN agent_organizations ao ON u.organization_id = ao.id
GROUP BY ao.display_name, u.role
ORDER BY organization, u.role;

-- Member activity summary
SELECT 
    ao.display_name as organization,
    COUNT(DISTINCT m.id) as total_members,
    COUNT(DISTINCT CASE WHEN m.membership_status = 'Active' THEN m.id END) as active_members,
    COUNT(DISTINCT p.id) as total_policies,
    COUNT(DISTINCT CASE WHEN p.status = 'Active' THEN p.id END) as active_policies,
    COUNT(DISTINCT c.id) as total_claims,
    COALESCE(SUM(p.annual_premium), 0) as total_annual_premium
FROM agent_organizations ao
LEFT JOIN members m ON ao.id = m.organization_id
LEFT JOIN users u ON m.user_id = u.id
LEFT JOIN policies p ON u.id = p.user_id
LEFT JOIN claims c ON p.id = c.policy_id
GROUP BY ao.id, ao.display_name
ORDER BY total_annual_premium DESC;

-- Top performing agents by policies sold
SELECT 
    u.first_name || ' ' || u.last_name as agent_name,
    ao.display_name as organization,
    COUNT(p.id) as policies_sold,
    SUM(p.annual_premium) as total_premium_volume,
    AVG(p.annual_premium) as avg_policy_premium
FROM users u
JOIN agent_organizations ao ON u.organization_id = ao.id
LEFT JOIN policies p ON u.id = p.agent_id
WHERE u.role = 'Agent'
GROUP BY u.id, u.first_name, u.last_name, ao.display_name
HAVING COUNT(p.id) > 0
ORDER BY total_premium_volume DESC;

-- =====================================================
-- INSURANCE BUSINESS ANALYTICS
-- =====================================================

-- Coverage type popularity and revenue
SELECT 
    it.name as coverage_type,
    COUNT(DISTINCT iq.id) as total_quotes,
    COUNT(DISTINCT p.id) as policies_sold,
    ROUND((COUNT(DISTINCT p.id)::decimal / NULLIF(COUNT(DISTINCT iq.id), 0)) * 100, 2) as conversion_rate,
    SUM(p.annual_premium) as total_annual_premium,
    AVG(p.annual_premium) as avg_annual_premium
FROM insurance_types it
LEFT JOIN insurance_quotes iq ON it.id = iq.type_id
LEFT JOIN policies p ON iq.id = p.quote_id
GROUP BY it.id, it.name
ORDER BY total_annual_premium DESC NULLS LAST;

-- Provider performance analysis
SELECT 
    ip.name as provider_name,
    ip.rating as provider_rating,
    COUNT(DISTINCT iq.id) as quotes_generated,
    COUNT(DISTINCT p.id) as policies_sold,
    ROUND((COUNT(DISTINCT p.id)::decimal / NULLIF(COUNT(DISTINCT iq.id), 0)) * 100, 2) as conversion_rate,
    SUM(p.annual_premium) as total_premium,
    AVG(iq.monthly_premium) as avg_monthly_premium
FROM insurance_providers ip
LEFT JOIN insurance_quotes iq ON ip.id = iq.provider_id
LEFT JOIN policies p ON iq.id = p.quote_id
GROUP BY ip.id, ip.name, ip.rating
HAVING COUNT(DISTINCT iq.id) > 0
ORDER BY conversion_rate DESC;

-- Monthly premium trends
SELECT 
    DATE_TRUNC('month', p.created_at) as month,
    COUNT(p.id) as new_policies,
    SUM(p.annual_premium) as monthly_new_premium,
    AVG(p.annual_premium) as avg_policy_premium
FROM policies p
WHERE p.created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', p.created_at)
ORDER BY month;

-- =====================================================
-- CLAIMS ANALYSIS
-- =====================================================

-- Claims status distribution
SELECT 
    c.status,
    COUNT(*) as claim_count,
    SUM(c.amount) as total_amount,
    AVG(c.amount) as avg_amount,
    MIN(c.amount) as min_amount,
    MAX(c.amount) as max_amount
FROM claims c
GROUP BY c.status
ORDER BY total_amount DESC;

-- Claims processing time analysis
SELECT 
    c.claim_type,
    COUNT(*) as total_claims,
    AVG(EXTRACT(epoch FROM (COALESCE(c.processed_at, NOW()) - c.submitted_at))/86400) as avg_processing_days,
    MIN(EXTRACT(epoch FROM (COALESCE(c.processed_at, NOW()) - c.submitted_at))/86400) as min_processing_days,
    MAX(EXTRACT(epoch FROM (COALESCE(c.processed_at, NOW()) - c.submitted_at))/86400) as max_processing_days
FROM claims c
WHERE c.submitted_at IS NOT NULL
GROUP BY c.claim_type
ORDER BY avg_processing_days;

-- =====================================================
-- EXTERNAL PROVIDER PERFORMANCE
-- =====================================================

-- External quote request success rates
SELECT 
    coverage_type,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_requests,
    ROUND((COUNT(CASE WHEN status = 'completed' THEN 1 END)::decimal / COUNT(*)) * 100, 2) as success_rate,
    AVG(total_quotes_received) as avg_quotes_per_request,
    AVG(successful_providers) as avg_successful_providers,
    AVG(failed_providers) as avg_failed_providers
FROM external_quote_requests
GROUP BY coverage_type
ORDER BY success_rate DESC;

-- External provider response times
SELECT 
    coverage_type,
    COUNT(*) as requests,
    AVG(EXTRACT(epoch FROM (completed_at - processing_started_at))/60) as avg_response_minutes,
    MIN(EXTRACT(epoch FROM (completed_at - processing_started_at))/60) as min_response_minutes,
    MAX(EXTRACT(epoch FROM (completed_at - processing_started_at))/60) as max_response_minutes
FROM external_quote_requests
WHERE processing_started_at IS NOT NULL 
    AND completed_at IS NOT NULL
GROUP BY coverage_type
ORDER BY avg_response_minutes;

-- =====================================================
-- LOYALTY PROGRAM ANALYTICS
-- =====================================================

-- Points program participation
SELECT 
    ps.tier_level,
    COUNT(*) as member_count,
    AVG(ps.current_balance) as avg_current_balance,
    AVG(ps.total_earned) as avg_total_earned,
    AVG(ps.total_redeemed) as avg_total_redeemed,
    SUM(ps.current_balance) as total_outstanding_points
FROM points_summary ps
GROUP BY ps.tier_level
ORDER BY 
    CASE ps.tier_level 
        WHEN 'Bronze' THEN 1
        WHEN 'Silver' THEN 2
        WHEN 'Gold' THEN 3
        WHEN 'Platinum' THEN 4
        WHEN 'Diamond' THEN 5
    END;

-- Most popular rewards
SELECT 
    r.name,
    r.category,
    r.points_cost,
    r.value,
    COUNT(rr.id) as redemption_count,
    SUM(rr.points_used) as total_points_redeemed,
    AVG(rr.points_used) as avg_points_per_redemption
FROM rewards r
LEFT JOIN reward_redemptions rr ON r.id = rr.reward_id
GROUP BY r.id, r.name, r.category, r.points_cost, r.value
HAVING COUNT(rr.id) > 0
ORDER BY redemption_count DESC;

-- =====================================================
-- DATA QUALITY CHECKS
-- =====================================================

-- Users without complete profiles
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    CASE 
        WHEN u.phone IS NULL THEN 'Missing Phone'
        WHEN u.address IS NULL THEN 'Missing Address'
        WHEN u.date_of_birth IS NULL THEN 'Missing DOB'
        ELSE 'Complete'
    END as profile_status
FROM users u
WHERE u.phone IS NULL 
    OR u.address IS NULL 
    OR (u.role IN ('Member', 'Agent') AND u.date_of_birth IS NULL)
ORDER BY u.role, u.last_name;

-- Policies without active payments
SELECT 
    p.policy_number,
    p.user_id,
    u.first_name || ' ' || u.last_name as policy_holder,
    p.status,
    p.next_payment_date,
    COUNT(pp.id) as payment_count,
    MAX(pp.paid_date) as last_payment_date
FROM policies p
JOIN users u ON p.user_id = u.id
LEFT JOIN premium_payments pp ON p.id = pp.policy_id AND pp.payment_status = 'Processed'
WHERE p.status = 'Active'
GROUP BY p.id, p.policy_number, p.user_id, u.first_name, u.last_name, p.status, p.next_payment_date
HAVING COUNT(pp.id) = 0 OR MAX(pp.paid_date) < CURRENT_DATE - INTERVAL '60 days'
ORDER BY p.next_payment_date;

-- =====================================================
-- MAINTENANCE QUERIES
-- =====================================================

-- Find duplicate email addresses
SELECT 
    email,
    COUNT(*) as duplicate_count,
    STRING_AGG(id, ', ') as user_ids
FROM users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- Inactive sessions cleanup (sessions older than 7 days)
-- Uncomment to execute cleanup
-- DELETE FROM sessions WHERE expire < NOW() - INTERVAL '7 days';

-- Update user organization assignments for orphaned users
-- Uncomment to execute update
-- UPDATE users SET organization_id = 1 WHERE organization_id IS NULL AND role IN ('Agent', 'Member');

-- =====================================================
-- BACKUP VERIFICATION
-- =====================================================

-- Verify critical data relationships
SELECT 
    'Users' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM users
UNION ALL
SELECT 
    'Policies' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM policies
UNION ALL
SELECT 
    'Claims' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM claims
UNION ALL
SELECT 
    'Applications' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM applications
ORDER BY table_name;

-- End of utility queries
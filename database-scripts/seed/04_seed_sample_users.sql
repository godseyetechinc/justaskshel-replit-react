-- =============================================
-- Sample Users and Data Seeding Script
-- =============================================
-- Description: Seed sample users, members, and demonstration data
-- Dependencies: 03_seed_points_data.sql
-- Execution Order: 04
-- Idempotent: Yes
-- Note: This is optional seed data for demonstration purposes

BEGIN;

-- =============================================
-- Sample Persons
-- =============================================
INSERT INTO persons (
    first_name, last_name, full_name, date_of_birth, gender,
    primary_email, primary_phone, street_address, city, state, zip_code,
    data_source, is_verified, verification_date, created_at, updated_at
) VALUES
(
    'John',
    'Smith',
    'John Smith',
    '1985-03-15',
    'Male',
    'john.smith@example.com',
    '555-0101',
    '123 Main St',
    'New York',
    'NY',
    '10001',
    'demo_seed',
    true,
    NOW(),
    NOW(),
    NOW()
),
(
    'Sarah',
    'Johnson',
    'Sarah Johnson',
    '1990-07-22',
    'Female',
    'sarah.johnson@example.com',
    '555-0102',
    '456 Oak Ave',
    'Los Angeles',
    'CA',
    '90210',
    'demo_seed',
    true,
    NOW(),
    NOW(),
    NOW()
),
(
    'Michael',
    'Davis',
    'Michael Davis',
    '1978-11-08',
    'Male',
    'michael.davis@example.com',
    '555-0103',
    '789 Pine Rd',
    'Chicago',
    'IL',
    '60601',
    'demo_seed',
    false,
    NULL,
    NOW(),
    NOW()
),
(
    'Emily',
    'Wilson',
    'Emily Wilson',
    '1988-05-12',
    'Female',
    'emily.wilson@example.com',
    '555-0104',
    '321 Elm St',
    'Houston',
    'TX',
    '77001',
    'demo_seed',
    true,
    NOW(),
    NOW(),
    NOW()
),
(
    'David',
    'Brown',
    'David Brown',
    '1982-09-30',
    'Male',
    'david.brown@example.com',
    '555-0105',
    '654 Maple Dr',
    'Phoenix',
    'AZ',
    '85001',
    'demo_seed',
    true,
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (primary_email) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- =============================================
-- Sample Users
-- =============================================
WITH org_data AS (
    SELECT id as demo_org_id FROM agent_organizations WHERE name = 'justaskshel-demo' LIMIT 1
),
person_data AS (
    SELECT 
        id as person_id,
        primary_email
    FROM persons 
    WHERE primary_email IN (
        'john.smith@example.com', 
        'sarah.johnson@example.com', 
        'michael.davis@example.com',
        'emily.wilson@example.com',
        'david.brown@example.com'
    )
)
INSERT INTO users (
    id, person_id, email, role, privilege_level, organization_id,
    is_active, created_at, updated_at
)
SELECT 
    'user-' || LOWER(REPLACE(p.primary_email, '@example.com', '')),
    p.person_id,
    p.primary_email,
    'Member',
    3,
    o.demo_org_id,
    true,
    NOW(),
    NOW()
FROM person_data p, org_data o
ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    privilege_level = EXCLUDED.privilege_level,
    updated_at = NOW();

-- =============================================
-- Sample Members
-- =============================================
WITH user_data AS (
    SELECT 
        u.id as user_id,
        u.person_id,
        u.organization_id,
        ROW_NUMBER() OVER (ORDER BY u.created_at) as rn
    FROM users u
    WHERE u.email LIKE '%@example.com'
)
INSERT INTO members (
    user_id, member_number, membership_status, membership_date,
    avatar_type, avatar_color, bio, organization_id, person_id,
    created_at, updated_at
)
SELECT 
    u.user_id,
    'MBR-' || LPAD(u.rn::text, 6, '0'),
    'Active',
    NOW() - INTERVAL '30 days' * RANDOM(),
    'initials',
    CASE u.rn % 5
        WHEN 0 THEN '#EF4444'
        WHEN 1 THEN '#10B981'
        WHEN 2 THEN '#3B82F6'
        WHEN 3 THEN '#8B5CF6'
        ELSE '#F59E0B'
    END,
    'Demo member for testing and demonstration purposes',
    u.organization_id,
    u.person_id,
    NOW(),
    NOW()
FROM user_data u
ON CONFLICT (member_number) DO UPDATE SET
    membership_status = EXCLUDED.membership_status,
    updated_at = NOW();

-- =============================================
-- Sample Points Summary
-- =============================================
INSERT INTO points_summary (
    user_id, total_earned, total_redeemed, current_balance, lifetime_balance,
    tier_level, tier_progress, next_tier_threshold, last_earned_at,
    created_at, updated_at
)
SELECT 
    u.id,
    FLOOR(RANDOM() * 5000 + 1000)::integer as total_earned,
    FLOOR(RANDOM() * 1000)::integer as total_redeemed,
    FLOOR(RANDOM() * 3000 + 500)::integer as current_balance,
    FLOOR(RANDOM() * 5000 + 1000)::integer as lifetime_balance,
    CASE 
        WHEN RANDOM() < 0.4 THEN 'Bronze'
        WHEN RANDOM() < 0.7 THEN 'Silver'
        WHEN RANDOM() < 0.9 THEN 'Gold'
        ELSE 'Platinum'
    END as tier_level,
    FLOOR(RANDOM() * 500)::integer as tier_progress,
    CASE 
        WHEN RANDOM() < 0.4 THEN 500
        WHEN RANDOM() < 0.7 THEN 2000
        WHEN RANDOM() < 0.9 THEN 5000
        ELSE 10000
    END as next_tier_threshold,
    NOW() - INTERVAL '1 day' * RANDOM() * 30,
    NOW(),
    NOW()
FROM users u
WHERE u.email LIKE '%@example.com'
ON CONFLICT (user_id) DO UPDATE SET
    current_balance = EXCLUDED.current_balance,
    last_earned_at = EXCLUDED.last_earned_at,
    updated_at = NOW();

-- =============================================
-- Sample Points Transactions
-- =============================================
WITH user_sample AS (
    SELECT id as user_id FROM users WHERE email LIKE '%@example.com' LIMIT 3
),
transaction_data AS (
    SELECT 
        u.user_id,
        generate_series(1, 10) as transaction_num
    FROM user_sample u
)
INSERT INTO points_transactions (
    user_id, transaction_type, points, description, category,
    reference_id, reference_type, balance_after, created_at
)
SELECT 
    t.user_id,
    CASE (t.transaction_num % 4)
        WHEN 0 THEN 'Earned'
        WHEN 1 THEN 'Earned'
        WHEN 2 THEN 'Earned'
        ELSE 'Redeemed'
    END as transaction_type,
    CASE (t.transaction_num % 4)
        WHEN 0 THEN FLOOR(RANDOM() * 500 + 50)::integer
        WHEN 1 THEN FLOOR(RANDOM() * 200 + 10)::integer
        WHEN 2 THEN FLOOR(RANDOM() * 300 + 100)::integer
        ELSE -FLOOR(RANDOM() * 1000 + 100)::integer
    END as points,
    CASE (t.transaction_num % 4)
        WHEN 0 THEN 'Daily login bonus'
        WHEN 1 THEN 'Profile completion'
        WHEN 2 THEN 'Policy purchase reward'
        ELSE 'Gift card redemption'
    END as description,
    CASE (t.transaction_num % 4)
        WHEN 0 THEN 'Login'
        WHEN 1 THEN 'Profile Complete'
        WHEN 2 THEN 'Policy Purchase'
        ELSE 'Redemption'
    END as category,
    'REF-' || t.transaction_num::text,
    'system',
    FLOOR(RANDOM() * 3000 + 500)::integer as balance_after,
    NOW() - INTERVAL '1 day' * RANDOM() * 60
FROM transaction_data t
ON CONFLICT DO NOTHING;

-- =============================================
-- Sample User Achievements
-- =============================================
WITH user_sample AS (
    SELECT id as user_id FROM users WHERE email LIKE '%@example.com'
),
achievement_sample AS (
    SELECT id as achievement_id FROM achievements WHERE category IN ('Milestone', 'Activity') LIMIT 5
)
INSERT INTO user_achievements (
    user_id, achievement_id, unlocked_at, points_awarded, notification_sent
)
SELECT 
    u.user_id,
    a.achievement_id,
    NOW() - INTERVAL '1 day' * RANDOM() * 90,
    FLOOR(RANDOM() * 500 + 100)::integer,
    RANDOM() < 0.8
FROM user_sample u
CROSS JOIN achievement_sample a
WHERE RANDOM() < 0.6  -- 60% chance each user has each achievement
ON CONFLICT (user_id, achievement_id) DO NOTHING;

-- =============================================
-- Sample Referral Codes
-- =============================================
INSERT INTO referral_codes (
    user_id, code, is_active, max_uses, current_uses, 
    expires_at, created_at, updated_at
)
SELECT 
    u.id,
    'REF' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 6)),
    true,
    10,
    FLOOR(RANDOM() * 3)::integer,
    NOW() + INTERVAL '1 year',
    NOW(),
    NOW()
FROM users u
WHERE u.email LIKE '%@example.com'
ON CONFLICT DO NOTHING;

-- =============================================
-- Sample Leaderboard Settings
-- =============================================
INSERT INTO leaderboard_settings (
    user_id, is_visible, show_full_name, show_points, 
    show_achievements, show_tier, created_at, updated_at
)
SELECT 
    u.id,
    RANDOM() < 0.8,  -- 80% visible
    RANDOM() < 0.6,  -- 60% show full name
    RANDOM() < 0.9,  -- 90% show points
    RANDOM() < 0.85, -- 85% show achievements
    RANDOM() < 0.95, -- 95% show tier
    NOW(),
    NOW()
FROM users u
WHERE u.email LIKE '%@example.com'
ON CONFLICT (user_id) DO UPDATE SET
    is_visible = EXCLUDED.is_visible,
    updated_at = NOW();

COMMIT;

-- Output confirmation
SELECT 'Sample users and data seeding completed successfully.' as status,
       (SELECT COUNT(*) FROM persons WHERE data_source = 'demo_seed') as demo_persons_created,
       (SELECT COUNT(*) FROM users WHERE email LIKE '%@example.com') as demo_users_created,
       (SELECT COUNT(*) FROM points_transactions WHERE reference_type = 'system') as sample_transactions_created;
-- =============================================
-- Core Data Seeding Script
-- =============================================
-- Description: Seed essential system data including organizations, roles, and admin users
-- Dependencies: Complete schema must be created first
-- Execution Order: 01
-- Idempotent: Yes

BEGIN;

-- =============================================
-- Agent Organizations
-- =============================================
INSERT INTO agent_organizations (
    name, display_name, description, email, phone, 
    subscription_plan, subscription_status, max_agents, max_members,
    created_at, updated_at
) VALUES 
(
    'justaskshel-demo', 
    'JustAskShel Demo Agency', 
    'Default demonstration insurance agency for JustAskShel platform',
    'demo@justaskshel.com',
    '555-0100',
    'Enterprise',
    'Active',
    50,
    1000,
    NOW(),
    NOW()
),
(
    'abc-insurance', 
    'ABC Insurance Group', 
    'Full-service insurance agency specializing in comprehensive coverage solutions',
    'contact@abcinsurance.com',
    '555-0200',
    'Professional',
    'Active',
    25,
    500,
    NOW(),
    NOW()
),
(
    'quickquote-insurance', 
    'QuickQuote Insurance', 
    'Fast and efficient insurance quotes for modern consumers',
    'info@quickquote.com',
    '555-0300',
    'Basic',
    'Trial',
    10,
    200,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- =============================================
-- Roles Definition
-- =============================================
INSERT INTO roles (
    name, privilege_level, description, permissions, is_active, created_at, updated_at
) VALUES
(
    'SuperAdmin',
    0,
    'System-wide administrator with unrestricted access across all organizations',
    '{"admin": true, "all_orgs": true, "user_management": true, "system_config": true, "reports": true}',
    true,
    NOW(),
    NOW()
),
(
    'TenantAdmin',
    1,
    'Organization administrator with full access within their assigned organization',
    '{"admin": true, "org_management": true, "user_management": true, "member_management": true, "reports": true}',
    true,
    NOW(),
    NOW()
),
(
    'Agent',
    2,
    'Insurance agent with access to client management and policy operations',
    '{"client_management": true, "policy_management": true, "claims_management": true, "quotes": true}',
    true,
    NOW(),
    NOW()
),
(
    'Member',
    3,
    'Organization member with access to personal dashboard and basic features',
    '{"dashboard": true, "profile_management": true, "policies_view": true, "claims_submit": true}',
    true,
    NOW(),
    NOW()
),
(
    'Guest',
    4,
    'Guest user with limited access to public features and quote requests',
    '{"quotes": true, "public_pages": true, "registration": true}',
    true,
    NOW(),
    NOW()
),
(
    'Visitor',
    5,
    'Anonymous visitor with access only to public marketing pages',
    '{"public_pages": true}',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET
    privilege_level = EXCLUDED.privilege_level,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- =============================================
-- Sample Persons for System Users
-- =============================================
INSERT INTO persons (
    first_name, last_name, full_name, primary_email, 
    data_source, is_verified, verification_date, created_at, updated_at
) VALUES
(
    'System',
    'Administrator',
    'System Administrator',
    'superadmin@justaskshel.com',
    'system_seed',
    true,
    NOW(),
    NOW(),
    NOW()
),
(
    'Demo',
    'Admin',
    'Demo Admin',
    'admin@justaskshel.com',
    'system_seed',
    true,
    NOW(),
    NOW(),
    NOW()
),
(
    'Sample',
    'Agent',
    'Sample Agent',
    'agent@justaskshel.com',
    'system_seed',
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
-- System Users
-- =============================================
-- Get organization IDs
WITH org_ids AS (
    SELECT id as demo_org_id FROM agent_organizations WHERE name = 'justaskshel-demo' LIMIT 1
),
person_ids AS (
    SELECT 
        p1.id as superadmin_person_id,
        p2.id as admin_person_id,
        p3.id as agent_person_id
    FROM persons p1, persons p2, persons p3
    WHERE p1.primary_email = 'superadmin@justaskshel.com'
    AND p2.primary_email = 'admin@justaskshel.com'
    AND p3.primary_email = 'agent@justaskshel.com'
)
INSERT INTO users (
    id, person_id, email, role, privilege_level, organization_id, 
    is_active, created_at, updated_at
)
SELECT 
    'superadmin-user-id',
    p.superadmin_person_id,
    'superadmin@justaskshel.com',
    'SuperAdmin',
    0,
    NULL, -- SuperAdmin has access to all organizations
    true,
    NOW(),
    NOW()
FROM person_ids p
UNION ALL
SELECT 
    'demo-admin-user-id',
    p.admin_person_id,
    'admin@justaskshel.com',
    'TenantAdmin',
    1,
    o.demo_org_id,
    true,
    NOW(),
    NOW()
FROM person_ids p, org_ids o
UNION ALL
SELECT 
    'sample-agent-user-id',
    p.agent_person_id,
    'agent@justaskshel.com',
    'Agent',
    2,
    o.demo_org_id,
    true,
    NOW(),
    NOW()
FROM person_ids p, org_ids o
ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    privilege_level = EXCLUDED.privilege_level,
    updated_at = NOW();

-- =============================================
-- Person-User Associations
-- =============================================
INSERT INTO person_users (person_id, user_id, created_at)
SELECT 
    p.id,
    u.id,
    NOW()
FROM persons p
JOIN users u ON p.primary_email = u.email
WHERE p.primary_email IN ('superadmin@justaskshel.com', 'admin@justaskshel.com', 'agent@justaskshel.com')
ON CONFLICT (person_id, user_id) DO NOTHING;

-- =============================================
-- Initial Points Rules
-- =============================================
INSERT INTO points_rules (
    name, description, category, points, period_type, max_per_period, 
    is_active, valid_from, created_at, updated_at
) VALUES
(
    'Daily Login Bonus',
    'Daily points for logging into the platform',
    'Login',
    10,
    'Daily',
    1,
    true,
    NOW(),
    NOW(),
    NOW()
),
(
    'Welcome Bonus',
    'One-time welcome bonus for new users',
    'Profile Complete',
    1000,
    'Lifetime',
    1,
    true,
    NOW(),
    NOW(),
    NOW()
),
(
    'Policy Purchase',
    'Points earned for purchasing an insurance policy',
    'Policy Purchase',
    500,
    'Monthly',
    5,
    true,
    NOW(),
    NOW(),
    NOW()
),
(
    'Claim Submission',
    'Points for submitting insurance claims',
    'Claim Submission',
    100,
    'Monthly',
    10,
    true,
    NOW(),
    NOW(),
    NOW()
),
(
    'Successful Referral',
    'Points for successfully referring new users',
    'Referral',
    200,
    'Monthly',
    20,
    true,
    NOW(),
    NOW(),
    NOW()
),
(
    'Profile Completion',
    'Points for completing profile information',
    'Profile Complete',
    50,
    'Lifetime',
    1,
    true,
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    points = EXCLUDED.points,
    updated_at = NOW();

COMMIT;

-- Output confirmation
SELECT 'Core data seeding completed successfully.' as status,
       COUNT(*) as organizations_created
FROM agent_organizations;
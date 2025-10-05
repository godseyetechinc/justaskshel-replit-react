-- =============================================
-- Test Accounts Seed Data Script
-- =============================================
-- Description: Insert essential test accounts for development and testing
-- Dependencies: 10_base_seed.sql
-- Execution Order: 20
-- Idempotent: Yes

BEGIN;

-- =============================================
-- Test User Accounts
-- =============================================
-- Password for all test accounts: 'password123'
-- Bcrypt hash: $2b$10$jtFibJJoAbZdvY8FXcLXx.V7Kiltl4Ub9sw4oqMv47TEzBYQNBckG

-- SuperAdmin account
INSERT INTO users (id, email, password, role, privilege_level, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'superadmin@justaskshel.com', '$2b$10$jtFibJJoAbZdvY8FXcLXx.V7Kiltl4Ub9sw4oqMv47TEzBYQNBckG', 'SuperAdmin', 0, true)
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    privilege_level = EXCLUDED.privilege_level,
    is_active = EXCLUDED.is_active;

-- TenantAdmin account
INSERT INTO users (id, email, password, role, privilege_level, is_active) VALUES
('00000000-0000-0000-0000-000000000002', 'admin1@justaskshel.com', '$2b$10$jtFibJJoAbZdvY8FXcLXx.V7Kiltl4Ub9sw4oqMv47TEzBYQNBckG', 'TenantAdmin', 1, true)
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    privilege_level = EXCLUDED.privilege_level,
    is_active = EXCLUDED.is_active;

-- Agent account
INSERT INTO users (id, email, password, role, privilege_level, is_active) VALUES
('00000000-0000-0000-0000-000000000003', 'agent1@justaskshel.com', '$2b$10$jtFibJJoAbZdvY8FXcLXx.V7Kiltl4Ub9sw4oqMv47TEzBYQNBckG', 'Agent', 2, true)
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    privilege_level = EXCLUDED.privilege_level,
    is_active = EXCLUDED.is_active;

-- Test Member account
INSERT INTO users (id, email, password, role, privilege_level, is_active) VALUES
('00000000-0000-0000-0000-000000000004', 'member1@justaskshel.com', '$2b$10$jtFibJJoAbZdvY8FXcLXx.V7Kiltl4Ub9sw4oqMv47TEzBYQNBckG', 'Member', 3, true)
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    privilege_level = EXCLUDED.privilege_level,
    is_active = EXCLUDED.is_active;

COMMIT;

-- Verification
SELECT 'Test accounts created successfully' as status,
       u.email,
       u.role,
       u.privilege_level,
       CASE 
           WHEN u.password IS NOT NULL THEN 'Has Password'
           ELSE 'No Password'
       END as password_status
FROM users u 
WHERE u.email IN ('superadmin@justaskshel.com', 'admin1@justaskshel.com', 'agent1@justaskshel.com', 'member1@justaskshel.com')
ORDER BY u.privilege_level;
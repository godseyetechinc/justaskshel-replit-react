-- =============================================
-- Base Seed Data Script
-- =============================================
-- Description: Insert essential reference data (insurance types, roles, etc.)
-- Dependencies: All table creation scripts (10-40)
-- Execution Order: 10
-- Idempotent: Yes

BEGIN;

-- =============================================
-- Insurance Types
-- =============================================
INSERT INTO insurance_types (id, name, description, icon, color) VALUES
(1, 'Life Insurance', 'Provides financial protection for your beneficiaries in case of death', 'Heart', '#ef4444'),
(2, 'Health Insurance', 'Covers medical expenses and healthcare costs', 'Shield', '#10b981'),
(3, 'Dental Insurance', 'Covers dental care and oral health treatments', 'Smile', '#3b82f6'),
(4, 'Vision Insurance', 'Covers eye care and vision-related expenses', 'Eye', '#8b5cf6'),
(5, 'Hospital Indemnity', 'Provides cash benefits for hospital stays', 'Building2', '#f59e0b')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence
SELECT setval('insurance_types_id_seq', (SELECT MAX(id) FROM insurance_types));

-- =============================================
-- Roles Definition
-- =============================================
INSERT INTO roles (id, name, privilege_level, description, permissions, is_active) VALUES
(1, 'SuperAdmin', 0, 'System administrator with full access', '{"all": true}', true),
(2, 'TenantAdmin', 1, 'Organization administrator', '{"org_admin": true, "user_management": true}', true),
(3, 'Agent', 2, 'Insurance agent with client management', '{"client_management": true, "quotes": true}', true),
(4, 'Member', 3, 'Standard member with policy access', '{"own_policies": true, "quotes": true}', true),
(5, 'Guest', 4, 'Limited access guest user', '{"view_public": true}', true),
(6, 'Visitor', 5, 'Minimal access visitor', '{"view_basic": true}', true)
ON CONFLICT (privilege_level) DO NOTHING;

-- Reset sequence
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));

-- =============================================
-- Insurance Providers
-- =============================================
INSERT INTO insurance_providers (id, name, logo, rating) VALUES
(1, 'Aetna', 'https://logos.aetna.com/logo.png', 4.2),
(2, 'Blue Cross Blue Shield', 'https://logos.bcbs.com/logo.png', 4.0),
(3, 'Cigna', 'https://logos.cigna.com/logo.png', 4.1),
(4, 'UnitedHealthcare', 'https://logos.uhc.com/logo.png', 4.3),
(5, 'Humana', 'https://logos.humana.com/logo.png', 3.9),
(6, 'Kaiser Permanente', 'https://logos.kp.com/logo.png', 4.4),
(7, 'State Farm', 'https://logos.statefarm.com/logo.png', 4.0),
(8, 'Allstate', 'https://logos.allstate.com/logo.png', 3.8),
(9, 'Progressive', 'https://logos.progressive.com/logo.png', 3.7),
(10, 'MetLife', 'https://logos.metlife.com/logo.png', 4.1)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence
SELECT setval('insurance_providers_id_seq', (SELECT MAX(id) FROM insurance_providers));

COMMIT;

-- Verification
SELECT 'Base seed data inserted successfully' as status,
       (SELECT count(*) FROM insurance_types) as insurance_types,
       (SELECT count(*) FROM roles) as roles,
       (SELECT count(*) FROM insurance_providers) as providers;
-- =============================================
-- Insurance Data Seeding Script
-- =============================================
-- Description: Seed insurance types, providers, and sample data
-- Dependencies: 01_seed_core_data.sql
-- Execution Order: 02
-- Idempotent: Yes

BEGIN;

-- =============================================
-- Insurance Types
-- =============================================
INSERT INTO insurance_types (name, description, icon, color, created_at) VALUES
(
    'Life Insurance',
    'Financial protection for your loved ones in case of unexpected death',
    'Heart',
    '#EF4444',
    NOW()
),
(
    'Health Insurance',
    'Comprehensive medical coverage for doctor visits, hospital stays, and prescriptions',
    'Activity',
    '#10B981',
    NOW()
),
(
    'Dental Insurance',
    'Coverage for dental care including cleanings, fillings, and major procedures',
    'Smile',
    '#3B82F6',
    NOW()
),
(
    'Vision Insurance',
    'Eye care coverage including exams, glasses, and contact lenses',
    'Eye',
    '#8B5CF6',
    NOW()
),
(
    'Discount Health Insurance',
    'Affordable healthcare options with negotiated discounts on medical services',
    'DollarSign',
    '#F59E0B',
    NOW()
),
(
    'Hospital Indemnity Insurance',
    'Daily cash benefits to help cover costs during hospital stays',
    'Building2',
    '#EC4899',
    NOW()
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color;

-- =============================================
-- Insurance Providers
-- =============================================
INSERT INTO insurance_providers (name, logo, rating, created_at) VALUES
('Aetna', '/logos/aetna.png', 4.2, NOW()),
('Blue Cross Blue Shield', '/logos/bcbs.png', 4.4, NOW()),
('Cigna', '/logos/cigna.png', 4.1, NOW()),
('Humana', '/logos/humana.png', 4.3, NOW()),
('UnitedHealthcare', '/logos/uhc.png', 4.5, NOW()),
('Kaiser Permanente', '/logos/kaiser.png', 4.6, NOW()),
('Anthem', '/logos/anthem.png', 4.0, NOW()),
('MetLife', '/logos/metlife.png', 4.2, NOW()),
('Prudential', '/logos/prudential.png', 4.3, NOW()),
('State Farm', '/logos/statefarm.png', 4.4, NOW()),
('Allstate', '/logos/allstate.png', 4.1, NOW()),
('GEICO', '/logos/geico.png', 4.3, NOW()),
('Progressive', '/logos/progressive.png', 4.2, NOW()),
('Liberty Mutual', '/logos/liberty.png', 4.0, NOW()),
('Farmers Insurance', '/logos/farmers.png', 4.1, NOW())
ON CONFLICT (name) DO UPDATE SET
    logo = EXCLUDED.logo,
    rating = EXCLUDED.rating;

-- =============================================
-- Sample Insurance Quotes
-- =============================================
-- Get IDs for relationships
WITH type_provider_data AS (
    SELECT 
        it_life.id as life_type_id,
        it_health.id as health_type_id,
        it_dental.id as dental_type_id,
        it_vision.id as vision_type_id,
        ip_aetna.id as aetna_id,
        ip_bcbs.id as bcbs_id,
        ip_cigna.id as cigna_id,
        ip_uhc.id as uhc_id,
        ip_humana.id as humana_id
    FROM 
        insurance_types it_life,
        insurance_types it_health,
        insurance_types it_dental,
        insurance_types it_vision,
        insurance_providers ip_aetna,
        insurance_providers ip_bcbs,
        insurance_providers ip_cigna,
        insurance_providers ip_uhc,
        insurance_providers ip_humana
    WHERE 
        it_life.name = 'Life Insurance'
        AND it_health.name = 'Health Insurance'
        AND it_dental.name = 'Dental Insurance'
        AND it_vision.name = 'Vision Insurance'
        AND ip_aetna.name = 'Aetna'
        AND ip_bcbs.name = 'Blue Cross Blue Shield'
        AND ip_cigna.name = 'Cigna'
        AND ip_uhc.name = 'UnitedHealthcare'
        AND ip_humana.name = 'Humana'
)
INSERT INTO insurance_quotes (
    type_id, provider_id, monthly_premium, annual_premium, coverage_amount, 
    term_length, deductible, medical_exam_required, conversion_option, 
    features, rating, is_external, created_at, updated_at
)
SELECT 
    tp.life_type_id,
    tp.aetna_id,
    125.50,
    1506.00,
    250000.00,
    20,
    0.00,
    true,
    true,
    '{"accelerated_death_benefit": true, "waiver_of_premium": true, "guaranteed_renewable": true}',
    4.2,
    false,
    NOW(),
    NOW()
FROM type_provider_data tp
UNION ALL
SELECT 
    tp.health_type_id,
    tp.bcbs_id,
    350.75,
    4209.00,
    NULL,
    NULL,
    2500.00,
    false,
    false,
    '{"preventive_care": true, "prescription_coverage": true, "telehealth": true, "mental_health": true}',
    4.4,
    false,
    NOW(),
    NOW()
FROM type_provider_data tp
UNION ALL
SELECT 
    tp.dental_type_id,
    tp.cigna_id,
    45.25,
    543.00,
    NULL,
    NULL,
    50.00,
    false,
    false,
    '{"preventive_covered": true, "orthodontics": false, "annual_maximum": 1500}',
    4.1,
    false,
    NOW(),
    NOW()
FROM type_provider_data tp
UNION ALL
SELECT 
    tp.vision_type_id,
    tp.uhc_id,
    25.99,
    311.88,
    NULL,
    NULL,
    0.00,
    false,
    false,
    '{"eye_exams": true, "frames_allowance": 150, "contacts_allowance": 120}',
    4.5,
    false,
    NOW(),
    NOW()
FROM type_provider_data tp
UNION ALL
SELECT 
    tp.health_type_id,
    tp.humana_id,
    285.00,
    3420.00,
    NULL,
    NULL,
    1500.00,
    false,
    false,
    '{"preventive_care": true, "prescription_coverage": true, "wellness_programs": true}',
    4.3,
    false,
    NOW(),
    NOW()
FROM type_provider_data tp
ON CONFLICT DO NOTHING;

-- =============================================
-- Sample External Quote Requests
-- =============================================
INSERT INTO external_quote_requests (
    request_id, coverage_type, applicant_age, zip_code, coverage_amount,
    term_length, payment_frequency, status, total_quotes_received,
    successful_providers, created_at, updated_at
) VALUES
(
    'EQR-' || EXTRACT(EPOCH FROM NOW())::text || '-001',
    'Life Insurance',
    35,
    '10001',
    500000.00,
    30,
    'Monthly',
    'completed',
    8,
    6,
    NOW(),
    NOW()
),
(
    'EQR-' || EXTRACT(EPOCH FROM NOW())::text || '-002',
    'Health Insurance',
    28,
    '90210',
    NULL,
    NULL,
    'Monthly',
    'completed',
    12,
    10,
    NOW(),
    NOW()
),
(
    'EQR-' || EXTRACT(EPOCH FROM NOW())::text || '-003',
    'Dental Insurance',
    42,
    '60601',
    NULL,
    NULL,
    'Monthly',
    'processing',
    3,
    2,
    NOW(),
    NOW()
)
ON CONFLICT (request_id) DO NOTHING;

COMMIT;

-- Output confirmation
SELECT 'Insurance data seeding completed successfully.' as status,
       (SELECT COUNT(*) FROM insurance_types) as insurance_types_created,
       (SELECT COUNT(*) FROM insurance_providers) as providers_created,
       (SELECT COUNT(*) FROM insurance_quotes) as sample_quotes_created;
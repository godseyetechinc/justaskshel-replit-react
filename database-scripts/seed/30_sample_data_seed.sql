-- =============================================
-- Sample Data Seed Script
-- =============================================
-- Description: Insert sample policies and claims for testing/demo purposes
-- Dependencies: 20_test_accounts_seed.sql
-- Execution Order: 30
-- Idempotent: Yes

BEGIN;

-- =============================================
-- Sample Policies for Test Member
-- =============================================
INSERT INTO policies (user_id, policy_number, insurance_type_id, provider_name, coverage_amount, premium_amount, start_date, end_date, status, next_payment_date) VALUES
('00000000-0000-0000-0000-000000000004', 'POL-SAMPLE-001', 1, 'MetLife', 250000.00, 89.99, '2024-01-01', '2024-12-31', 'active', '2025-01-01'),
('00000000-0000-0000-0000-000000000004', 'POL-SAMPLE-002', 2, 'Aetna', 5000.00, 299.99, '2024-03-01', '2025-02-28', 'active', '2025-03-01'),
('00000000-0000-0000-0000-000000000004', 'POL-SAMPLE-003', 3, 'Blue Cross Blue Shield', 2000.00, 45.00, '2024-06-01', '2025-05-31', 'active', '2025-06-01')
ON CONFLICT (policy_number) DO NOTHING;

-- =============================================
-- Sample Claims for Test Member
-- =============================================
INSERT INTO claims (user_id, policy_id, claim_number, title, claim_type, incident_date, status, description, estimated_amount, priority) VALUES
('00000000-0000-0000-0000-000000000004', 
 (SELECT id FROM policies WHERE policy_number = 'POL-SAMPLE-002' LIMIT 1), 
 'CLM-SAMPLE-001', 
 'Annual Physical Checkup', 
 'medical', 
 '2024-08-15 10:00:00', 
 'approved', 
 'Comprehensive medical checkup including blood work and general examination.',
 450.00, 
 'normal'),

('00000000-0000-0000-0000-000000000004', 
 (SELECT id FROM policies WHERE policy_number = 'POL-SAMPLE-003' LIMIT 1), 
 'CLM-SAMPLE-002', 
 'Dental Cleaning and Checkup', 
 'dental', 
 '2024-09-10 14:30:00', 
 'paid', 
 'Routine dental cleaning and oral health assessment.',
 180.00, 
 'normal'),

('00000000-0000-0000-0000-000000000004', 
 (SELECT id FROM policies WHERE policy_number = 'POL-SAMPLE-002' LIMIT 1), 
 'CLM-SAMPLE-003', 
 'Emergency Room Visit', 
 'medical', 
 '2024-11-20 22:15:00', 
 'under_review', 
 'Emergency room visit for chest pain evaluation. All tests came back normal.',
 1250.00, 
 'high')
ON CONFLICT (claim_number) DO NOTHING;

-- =============================================
-- Sample Insurance Quotes for Testing
-- =============================================
INSERT INTO insurance_quotes (user_id, type_id, provider_id, monthly_premium, coverage_amount, term_length, features) VALUES
('00000000-0000-0000-0000-000000000004', 1, 1, 125.00, 500000.00, 20, '["No Medical Exam", "Level Premium", "Convertible"]'),
('00000000-0000-0000-0000-000000000004', 1, 4, 135.00, 500000.00, 20, '["Medical Exam Required", "Level Premium", "Accidental Death Benefit"]'),
('00000000-0000-0000-0000-000000000004', 2, 2, 385.00, 7500.00, 1, '["PPO Network", "$1,000 Deductible", "Prescription Coverage"]'),
('00000000-0000-0000-0000-000000000004', 3, 3, 55.00, 2500.00, 1, '["Preventive Care", "Orthodontic Coverage", "No Waiting Period"]')
ON CONFLICT DO NOTHING;

COMMIT;

-- Verification
SELECT 'Sample data inserted successfully' as status,
       (SELECT count(*) FROM policies WHERE user_id = '00000000-0000-0000-0000-000000000004') as sample_policies,
       (SELECT count(*) FROM claims WHERE user_id = '00000000-0000-0000-0000-000000000004') as sample_claims,
       (SELECT count(*) FROM insurance_quotes WHERE user_id = '00000000-0000-0000-0000-000000000004') as sample_quotes;
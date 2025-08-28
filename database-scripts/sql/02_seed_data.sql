-- =====================================================
-- JustAskShel Insurance Platform - Seed Data
-- =====================================================
-- This script populates the database with initial data
-- including organizations, users, insurance types, providers,
-- and sample data for development and testing.
-- 
-- Execute after: 01_create_schema.sql
-- =====================================================

-- =====================================================
-- AGENT ORGANIZATIONS
-- =====================================================

INSERT INTO agent_organizations (
    name, display_name, description, website, phone, email,
    address, city, state, zip_code, primary_color, secondary_color,
    subscription_plan, subscription_status, max_agents, max_members
) VALUES
('demo_insurance_agency', 'Demo Insurance Agency', 'Full-service insurance agency providing comprehensive coverage solutions', 'https://demoinsurance.com', '(555) 123-4567', 'info@demoinsurance.com', '123 Insurance Blvd', 'New York', 'NY', '10001', '#0EA5E9', '#64748B', 'Professional', 'Active', 15, 500),
('abc_insurance_group', 'ABC Insurance Group', 'Leading provider of business and personal insurance solutions', 'https://abcinsurance.com', '(555) 987-6543', 'contact@abcinsurance.com', '456 Coverage Ave', 'Los Angeles', 'CA', '90210', '#10B981', '#374151', 'Enterprise', 'Active', 25, 1000),
('quickquote_insurance', 'QuickQuote Insurance', 'Fast and reliable insurance quotes for all your needs', 'https://quickquote.com', '(555) 456-7890', 'hello@quickquote.com', '789 Quote Street', 'Chicago', 'IL', '60601', '#8B5CF6', '#6B7280', 'Basic', 'Active', 10, 250);

-- =====================================================
-- ROLE DEFINITIONS
-- =====================================================

INSERT INTO roles (name, privilege_level, description, permissions, is_active) VALUES
('SuperAdmin', 0, 'System-wide administrator with full access across all tenants', '{"privileges": ["read", "write", "delete", "manage_users", "manage_system", "manage_roles", "view_all", "edit_all", "manage_organizations", "access_all_tenants"], "resources": ["all"]}', true),
('TenantAdmin', 1, 'Organization administrator with full access within their tenant', '{"privileges": ["read", "write", "delete", "manage_users", "manage_system", "manage_roles", "view_all", "edit_all"], "resources": ["all"]}', true),
('Agent', 2, 'Insurance agent with customer and policy management capabilities', '{"privileges": ["read", "write", "delete", "manage_claims", "manage_applications", "view_customer_data"], "resources": ["applications", "claims", "policies", "contacts", "quotes", "members"]}', true),
('Member', 3, 'Individual member with access to personal insurance data', '{"privileges": ["read", "write_own", "create_applications", "view_own_data"], "resources": ["own_policies", "own_applications", "own_claims", "own_quotes", "own_profile", "dependents"]}', true),
('Guest', 4, 'Guest user with limited access to public information', '{"privileges": ["read_limited", "create_account", "view_public"], "resources": ["public_content", "insurance_types", "quotes_request"]}', true),
('Visitor', 5, 'Public visitor with read-only access to public content', '{"privileges": ["read_public"], "resources": ["public_content", "insurance_types"]}', true);

-- =====================================================
-- SYSTEM USERS
-- =====================================================

-- SuperAdmin user
INSERT INTO users (
    id, email, first_name, last_name, password, role, privilege_level, 
    is_active, phone, address, city, state, zip_code
) VALUES
('superadmin-001', 'superadmin@justaskshel.com', 'Super', 'Admin', 
 '$2b$10$K8qvXzNFsYZ9X1Y2Y3Y4Y5Y6Y7Y8Y9Y0ABCDEFGHIJKLMNOPQRSTUVWXYZ', 
 'SuperAdmin', 0, true, '(555) 000-0001', 
 '1 Admin Plaza', 'System City', 'SY', '00001');

-- TenantAdmin users (one for each organization)
INSERT INTO users (
    id, email, first_name, last_name, password, role, privilege_level, 
    organization_id, is_active, phone, address, city, state, zip_code
) VALUES
('admin-001', 'admin1@justaskshel.com', 'Alice', 'Administrator', 
 '$2b$10$K8qvXzNFsYZ9X1Y2Y3Y4Y5Y6Y7Y8Y9Y0ABCDEFGHIJKLMNOPQRSTUVWXYZ', 
 'TenantAdmin', 1, 1, true, '(555) 111-0001', 
 '123 Admin St', 'New York', 'NY', '10001'),
('admin-002', 'admin2@justaskshel.com', 'Bob', 'Administrator', 
 '$2b$10$K8qvXzNFsYZ9X1Y2Y3Y4Y5Y6Y7Y8Y9Y0ABCDEFGHIJKLMNOPQRSTUVWXYZ', 
 'TenantAdmin', 1, 2, true, '(555) 111-0002', 
 '456 Admin Ave', 'Los Angeles', 'CA', '90210'),
('admin-003', 'admin3@justaskshel.com', 'Carol', 'Administrator', 
 '$2b$10$K8qvXzNFsYZ9X1Y2Y3Y4Y5Y6Y7Y8Y9Y0ABCDEFGHIJKLMNOPQRSTUVWXYZ', 
 'TenantAdmin', 1, 3, true, '(555) 111-0003', 
 '789 Admin Blvd', 'Chicago', 'IL', '60601');

-- Agent users (distributed across organizations)
INSERT INTO users (
    id, email, first_name, last_name, password, role, privilege_level, 
    organization_id, is_active, phone
) VALUES
('agent-001', 'agent1@justaskshel.com', 'David', 'Agent', '$2b$10$K8qvXzNFsYZ9X1Y2Y3Y4Y5Y6Y7Y8Y9Y0ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'Agent', 2, 1, true, '(555) 222-0001'),
('agent-002', 'agent2@justaskshel.com', 'Emma', 'Agent', '$2b$10$K8qvXzNFsYZ9X1Y2Y3Y4Y5Y6Y7Y8Y9Y0ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'Agent', 2, 1, true, '(555) 222-0002'),
('agent-003', 'agent3@justaskshel.com', 'Frank', 'Agent', '$2b$10$K8qvXzNFsYZ9X1Y2Y3Y4Y5Y6Y7Y8Y9Y0ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'Agent', 2, 2, true, '(555) 222-0003'),
('agent-004', 'agent4@justaskshel.com', 'Grace', 'Agent', '$2b$10$K8qvXzNFsYZ9X1Y2Y3Y4Y5Y6Y7Y8Y9Y0ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'Agent', 2, 2, true, '(555) 222-0004'),
('agent-005', 'agent5@justaskshel.com', 'Henry', 'Agent', '$2b$10$K8qvXzNFsYZ9X1Y2Y3Y4Y5Y6Y7Y8Y9Y0ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'Agent', 2, 3, true, '(555) 222-0005');

-- Member users (sample members)
INSERT INTO users (
    id, email, first_name, last_name, password, role, privilege_level, 
    organization_id, is_active, phone, date_of_birth
) VALUES
('member-001', 'member1@example.com', 'John', 'Member', '$2b$10$K8qvXzNFsYZ9X1Y2Y3Y4Y5Y6Y7Y8Y9Y0ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'Member', 3, 1, true, '(555) 333-0001', '1985-06-15'),
('member-002', 'member2@example.com', 'Jane', 'Member', '$2b$10$K8qvXzNFsYZ9X1Y2Y3Y4Y5Y6Y7Y8Y9Y0ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'Member', 3, 1, true, '(555) 333-0002', '1988-09-22'),
('member-003', 'member3@example.com', 'Michael', 'Member', '$2b$10$K8qvXzNFsYZ9X1Y2Y3Y4Y5Y6Y7Y8Y9Y0ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'Member', 3, 2, true, '(555) 333-0003', '1982-03-10'),
('member-004', 'member4@example.com', 'Sarah', 'Member', '$2b$10$K8qvXzNFsYZ9X1Y2Y3Y4Y5Y6Y7Y8Y9Y0ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'Member', 3, 2, true, '(555) 333-0004', '1990-12-05'),
('member-005', 'member5@example.com', 'Robert', 'Member', '$2b$10$K8qvXzNFsYZ9X1Y2Y3Y4Y5Y6Y7Y8Y9Y0ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'Member', 3, 3, true, '(555) 333-0005', '1987-07-18');

-- =====================================================
-- INSURANCE TYPES
-- =====================================================

INSERT INTO insurance_types (name, description, icon, color) VALUES
('Life Insurance', 'Provides financial protection for your loved ones with comprehensive life coverage options', 'Heart', '#dc2626'),
('Health Insurance', 'Complete health coverage including medical, preventive care, and wellness programs', 'Activity', '#16a34a'),
('Dental Insurance', 'Comprehensive dental coverage for routine care, treatments, and emergency procedures', 'Smile', '#0891b2'),
('Vision Insurance', 'Eye care coverage including exams, glasses, contacts, and vision correction procedures', 'Eye', '#7c3aed'),
('Hospital Indemnity', 'Financial protection for hospital stays and medical procedures with direct cash benefits', 'Building2', '#ea580c'),
('Discount Health Plans', 'Affordable health savings programs offering discounts on medical services and prescriptions', 'Percent', '#059669');

-- =====================================================
-- INSURANCE PROVIDERS
-- =====================================================

INSERT INTO insurance_providers (name, logo, rating) VALUES
('State Farm', '/images/providers/state-farm.png', 4.2),
('Allstate', '/images/providers/allstate.png', 4.1),
('GEICO', '/images/providers/geico.png', 4.3),
('Progressive', '/images/providers/progressive.png', 4.0),
('Aetna', '/images/providers/aetna.png', 4.4),
('Blue Cross Blue Shield', '/images/providers/bcbs.png', 4.5),
('UnitedHealthcare', '/images/providers/united.png', 4.3),
('Humana', '/images/providers/humana.png', 4.2),
('Cigna', '/images/providers/cigna.png', 4.1),
('MetLife', '/images/providers/metlife.png', 4.0),
('Prudential', '/images/providers/prudential.png', 4.2),
('Guardian Life', '/images/providers/guardian.png', 4.3),
('Mutual of Omaha', '/images/providers/mutual.png', 4.1),
('New York Life', '/images/providers/nyl.png', 4.4),
('Northwestern Mutual', '/images/providers/northwestern.png', 4.5);

-- =====================================================
-- SAMPLE INSURANCE QUOTES
-- =====================================================

-- Life Insurance Quotes
INSERT INTO insurance_quotes (
    user_id, type_id, provider_id, monthly_premium, annual_premium, 
    coverage_amount, term_length, medical_exam_required, features, rating
) VALUES
('member-001', 1, 1, 45.99, 551.88, 250000.00, 20, true, '["Level premiums", "Convertible to permanent", "Accelerated death benefit"]', 4.2),
('member-001', 1, 5, 52.99, 635.88, 250000.00, 20, true, '["Return of premium option", "Terminal illness benefit", "Waiver of premium"]', 4.4),
('member-002', 1, 10, 38.50, 462.00, 200000.00, 30, false, '["No medical exam required", "Simplified issue", "Guaranteed acceptance"]', 4.0),
('member-003', 1, 11, 65.75, 789.00, 500000.00, 20, true, '["Level premiums", "Dividend participation", "Paid-up additions"]', 4.2);

-- Health Insurance Quotes
INSERT INTO insurance_quotes (
    user_id, type_id, provider_id, monthly_premium, annual_premium, 
    coverage_amount, deductible, features, rating
) VALUES
('member-001', 2, 6, 285.50, 3426.00, 1000000.00, 2500.00, '["Preventive care covered", "Prescription drug coverage", "Mental health benefits"]', 4.5),
('member-002', 2, 7, 325.75, 3909.00, 2000000.00, 1500.00, '["Nationwide network", "Telehealth included", "Wellness programs"]', 4.3),
('member-003', 2, 8, 195.25, 2343.00, 500000.00, 5000.00, '["Bronze plan", "Essential health benefits", "Preventive care"]', 4.2);

-- Dental Insurance Quotes  
INSERT INTO insurance_quotes (
    user_id, type_id, provider_id, monthly_premium, annual_premium, 
    coverage_amount, deductible, features, rating
) VALUES
('member-001', 3, 2, 25.99, 311.88, 2500.00, 50.00, '["Preventive care 100%", "Basic procedures 80%", "Major procedures 50%"]', 4.1),
('member-002', 3, 9, 32.50, 390.00, 3000.00, 0.00, '["No deductible preventive", "Orthodontics included", "Annual maximum $3000"]', 4.1);

-- Vision Insurance Quotes
INSERT INTO insurance_quotes (
    user_id, type_id, provider_id, monthly_premium, annual_premium, 
    coverage_amount, features, rating
) VALUES
('member-001', 4, 3, 12.99, 155.88, 500.00, '["Annual eye exam", "$200 frame allowance", "Contact lens discount"]', 4.3),
('member-002', 4, 12, 18.75, 225.00, 750.00, '["Comprehensive exam", "$300 frame allowance", "LASIK discount"]', 4.3);

-- =====================================================
-- SAMPLE MEMBERS DATA
-- =====================================================

INSERT INTO members (
    user_id, organization_id, member_number, first_name, last_name, 
    email, date_of_birth, phone, address, city, state, zip_code,
    avatar_color, membership_status
) VALUES
('member-001', 1, 'MEM-001-001', 'John', 'Member', 'member1@example.com', '1985-06-15', '(555) 333-0001', '123 Member St', 'New York', 'NY', '10001', '#3B82F6', 'Active'),
('member-002', 1, 'MEM-001-002', 'Jane', 'Member', 'member2@example.com', '1988-09-22', '(555) 333-0002', '456 Member Ave', 'New York', 'NY', '10002', '#EF4444', 'Active'),
('member-003', 2, 'MEM-002-001', 'Michael', 'Member', 'member3@example.com', '1982-03-10', '(555) 333-0003', '789 Member Blvd', 'Los Angeles', 'CA', '90210', '#10B981', 'Active'),
('member-004', 2, 'MEM-002-002', 'Sarah', 'Member', 'member4@example.com', '1990-12-05', '(555) 333-0004', '321 Member Rd', 'Los Angeles', 'CA', '90211', '#8B5CF6', 'Active'),
('member-005', 3, 'MEM-003-001', 'Robert', 'Member', 'member5@example.com', '1987-07-18', '(555) 333-0005', '654 Member Dr', 'Chicago', 'IL', '60601', '#F59E0B', 'Active');

-- =====================================================
-- SAMPLE CONTACTS
-- =====================================================

INSERT INTO contacts (
    organization_id, type, first_name, last_name, email, phone, 
    company, address, city, state, zip_code, status, assigned_agent
) VALUES
(1, 'Lead', 'Tom', 'Wilson', 'tom.wilson@email.com', '(555) 444-0001', 'Wilson Enterprises', '123 Business St', 'New York', 'NY', '10001', 'Active', 'agent-001'),
(1, 'Customer', 'Lisa', 'Johnson', 'lisa.johnson@email.com', '(555) 444-0002', 'Johnson LLC', '456 Corp Ave', 'New York', 'NY', '10002', 'Active', 'agent-002'),
(2, 'Lead', 'Mark', 'Davis', 'mark.davis@email.com', '(555) 444-0003', 'Davis Industries', '789 Industry Blvd', 'Los Angeles', 'CA', '90210', 'Prospect', 'agent-003'),
(2, 'Customer', 'Anna', 'Brown', 'anna.brown@email.com', '(555) 444-0004', 'Brown & Associates', '321 Service Rd', 'Los Angeles', 'CA', '90211', 'Active', 'agent-004'),
(3, 'Lead', 'Steve', 'Miller', 'steve.miller@email.com', '(555) 444-0005', 'Miller Solutions', '654 Solution Dr', 'Chicago', 'IL', '60601', 'Active', 'agent-005');

-- =====================================================
-- SAMPLE POLICIES
-- =====================================================

INSERT INTO policies (
    user_id, quote_id, policy_number, status, start_date, end_date, 
    renewal_date, monthly_premium, annual_premium, coverage_amount, 
    payment_frequency, agent_id
) VALUES
('member-001', 1, 'POL-2024-001001', 'Active', '2024-01-15', '2044-01-15', '2025-01-15', 45.99, 551.88, 250000.00, 'Monthly', 'agent-001'),
('member-001', 5, 'POL-2024-001002', 'Active', '2024-02-01', '2025-02-01', '2025-02-01', 285.50, 3426.00, 1000000.00, 'Monthly', 'agent-001'),
('member-002', 3, 'POL-2024-002001', 'Active', '2024-03-10', '2054-03-10', '2025-03-10', 38.50, 462.00, 200000.00, 'Monthly', 'agent-002'),
('member-003', 4, 'POL-2024-003001', 'Pending', '2024-04-01', '2044-04-01', '2025-04-01', 65.75, 789.00, 500000.00, 'Monthly', 'agent-003');

-- =====================================================
-- SAMPLE CLAIMS
-- =====================================================

INSERT INTO claims (
    user_id, policy_id, claim_number, title, description, claim_type, 
    incident_date, amount, status, priority, assigned_agent
) VALUES
('member-001', 2, 'CLM-2024-001001', 'Emergency Room Visit', 'Emergency room visit due to chest pain', 'medical', '2024-08-15', 2500.00, 'under_review', 'high', 'agent-001'),
('member-002', 3, 'CLM-2024-002001', 'Routine Dental Cleaning', 'Annual dental cleaning and examination', 'dental', '2024-08-20', 150.00, 'approved', 'normal', 'agent-002'),
('member-003', 4, 'CLM-2024-003001', 'Vision Exam', 'Annual comprehensive eye examination', 'vision', '2024-08-25', 125.00, 'submitted', 'normal', 'agent-003');

-- =====================================================
-- POINTS & REWARDS SYSTEM
-- =====================================================

-- Points Rules
INSERT INTO points_rules (name, description, category, points, period_type, max_per_period) VALUES
('Policy Purchase', 'Points earned for purchasing a new policy', 'Policy Purchase', 500, 'Lifetime', 1),
('Profile Completion', 'Points for completing your profile', 'Profile Complete', 100, 'Lifetime', 1),
('Referral Bonus', 'Points for referring a new member', 'Referral', 250, 'Monthly', 10),
('Login Streak', 'Daily login bonus points', 'Login', 10, 'Daily', 1),
('Claim Submission', 'Points for submitting a claim', 'Claim Submission', 50, 'Monthly', 5);

-- Sample Rewards
INSERT INTO rewards (name, description, category, points_cost, value, is_active) VALUES
('$10 Gift Card', 'Amazon gift card worth $10', 'Gift Card', 1000, 10.00, true),
('Premium Discount', '5% discount on next premium payment', 'Insurance Credit', 500, 5.00, true),
('Health Checkup', 'Free annual health checkup', 'Premium Service', 2000, 200.00, true),
('$25 Gift Card', 'Amazon gift card worth $25', 'Gift Card', 2500, 25.00, true),
('Coffee Mug', 'JustAskShel branded coffee mug', 'Merchandise', 300, 15.00, true);

-- Sample Points Transactions and Summaries for Members
INSERT INTO points_transactions (user_id, transaction_type, points, description, category, balance_after) VALUES
('member-001', 'Earned', 500, 'New policy purchase bonus', 'Policy Purchase', 500),
('member-001', 'Earned', 100, 'Profile completion bonus', 'Profile Complete', 600),
('member-002', 'Earned', 500, 'New policy purchase bonus', 'Policy Purchase', 500),
('member-002', 'Earned', 250, 'Referral bonus for new member', 'Referral', 750),
('member-003', 'Earned', 100, 'Profile completion bonus', 'Profile Complete', 100);

INSERT INTO points_summary (user_id, total_earned, current_balance, lifetime_balance, tier_level, tier_progress, next_tier_threshold) VALUES
('member-001', 600, 600, 600, 'Silver', 100, 1000),
('member-002', 750, 750, 750, 'Silver', 250, 1000),
('member-003', 100, 100, 100, 'Bronze', 100, 500);

-- =====================================================
-- SAMPLE APPLICATIONS
-- =====================================================

INSERT INTO applications (
    application_number, user_id, contact_id, insurance_type_id, status,
    application_data, submitted_at
) VALUES
('APP-2024-001001', 'member-001', 1, 1, 'Submitted', '{"coverage_amount": 500000, "term_length": 20, "medical_exam": true}', '2024-08-01 10:00:00'),
('APP-2024-002001', 'member-002', 2, 2, 'Under Review', '{"plan_type": "Gold", "deductible": 1500, "family_coverage": true}', '2024-08-15 14:30:00'),
('APP-2024-003001', 'member-003', 3, 3, 'Draft', '{"plan_level": "Premium", "orthodontics": true}', '2024-08-20 09:15:00');

-- =====================================================
-- SAMPLE EXTERNAL QUOTE REQUESTS
-- =====================================================

INSERT INTO external_quote_requests (
    request_id, user_id, coverage_type, applicant_age, zip_code,
    coverage_amount, term_length, payment_frequency, status,
    total_quotes_received, successful_providers, failed_providers,
    processing_started_at, completed_at
) VALUES
('REQ-2024-001001', 'member-001', 'Life Insurance', 35, '10001', 250000.00, 20, 'Monthly', 'completed', 5, 3, 2, '2024-08-01 10:00:00', '2024-08-01 10:05:00'),
('REQ-2024-002001', 'member-002', 'Health Insurance', 32, '90210', 1000000.00, NULL, 'Monthly', 'completed', 8, 6, 2, '2024-08-15 14:30:00', '2024-08-15 14:35:00'),
('REQ-2024-003001', 'member-003', 'Dental Insurance', 38, '60601', 2500.00, NULL, 'Monthly', 'processing', 0, 0, 0, '2024-08-25 09:00:00', NULL);

-- =====================================================
-- DATA SEEDING COMPLETED
-- =====================================================

-- Update sequences to avoid conflicts
SELECT setval('agent_organizations_id_seq', (SELECT MAX(id) FROM agent_organizations));
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));
SELECT setval('insurance_types_id_seq', (SELECT MAX(id) FROM insurance_types));
SELECT setval('insurance_providers_id_seq', (SELECT MAX(id) FROM insurance_providers));
SELECT setval('insurance_quotes_id_seq', (SELECT MAX(id) FROM insurance_quotes));
SELECT setval('selected_quotes_id_seq', (SELECT MAX(id) FROM selected_quotes));
SELECT setval('wishlist_id_seq', (SELECT MAX(id) FROM wishlist));
SELECT setval('policies_id_seq', (SELECT MAX(id) FROM policies));
SELECT setval('claims_id_seq', (SELECT MAX(id) FROM claims));
SELECT setval('members_id_seq', (SELECT MAX(id) FROM members));
SELECT setval('contacts_id_seq', (SELECT MAX(id) FROM contacts));
SELECT setval('applications_id_seq', (SELECT MAX(id) FROM applications));
SELECT setval('points_transactions_id_seq', (SELECT MAX(id) FROM points_transactions));
SELECT setval('points_summary_id_seq', (SELECT MAX(id) FROM points_summary));
SELECT setval('rewards_id_seq', (SELECT MAX(id) FROM rewards));
SELECT setval('points_rules_id_seq', (SELECT MAX(id) FROM points_rules));
SELECT setval('external_quote_requests_id_seq', (SELECT MAX(id) FROM external_quote_requests));

-- Seed data insertion completed successfully
-- Database is now ready for use with sample data
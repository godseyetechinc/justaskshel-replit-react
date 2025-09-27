-- =============================================
-- Database Indexes Creation Script
-- =============================================
-- Description: Create performance indexes for frequently queried columns
-- Dependencies: All table creation scripts
-- Execution Order: 10
-- Idempotent: Yes

BEGIN;

-- =============================================
-- Session Management Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- =============================================
-- User and Authentication Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS IDX_users_email ON users(email);
CREATE INDEX IF NOT EXISTS IDX_users_role ON users(role);
CREATE INDEX IF NOT EXISTS IDX_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS IDX_users_person_id ON users(person_id);
CREATE INDEX IF NOT EXISTS IDX_users_active ON users(is_active) WHERE is_active = true;

-- =============================================
-- Person Entity Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS IDX_persons_email ON persons(primary_email);
CREATE INDEX IF NOT EXISTS IDX_persons_phone ON persons(primary_phone);
CREATE INDEX IF NOT EXISTS IDX_persons_name ON persons(last_name, first_name);
CREATE INDEX IF NOT EXISTS IDX_persons_full_name ON persons(full_name);
CREATE INDEX IF NOT EXISTS IDX_persons_created_at ON persons(created_at);

-- =============================================
-- Policy and Claims Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS IDX_policies_user_id ON policies(user_id);
CREATE INDEX IF NOT EXISTS IDX_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS IDX_policies_policy_number ON policies(policy_number);
CREATE INDEX IF NOT EXISTS IDX_policies_dates ON policies(start_date, end_date);

CREATE INDEX IF NOT EXISTS IDX_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS IDX_claims_policy_id ON claims(policy_id);
CREATE INDEX IF NOT EXISTS IDX_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS IDX_claims_claim_number ON claims(claim_number);
CREATE INDEX IF NOT EXISTS IDX_claims_type ON claims(claim_type);
CREATE INDEX IF NOT EXISTS IDX_claims_incident_date ON claims(incident_date);
CREATE INDEX IF NOT EXISTS IDX_claims_priority ON claims(priority);
CREATE INDEX IF NOT EXISTS IDX_claims_assigned_agent ON claims(assigned_agent);

-- =============================================
-- Insurance and Quote Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS IDX_insurance_quotes_user_id ON insurance_quotes(user_id);
CREATE INDEX IF NOT EXISTS IDX_insurance_quotes_type_id ON insurance_quotes(type_id);
CREATE INDEX IF NOT EXISTS IDX_insurance_quotes_provider_id ON insurance_quotes(provider_id);
CREATE INDEX IF NOT EXISTS IDX_insurance_quotes_external ON insurance_quotes(is_external);
CREATE INDEX IF NOT EXISTS IDX_insurance_quotes_expires_at ON insurance_quotes(expires_at);

-- =============================================
-- Association Table Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS IDX_person_users_person_id ON person_users(person_id);
CREATE INDEX IF NOT EXISTS IDX_person_users_user_id ON person_users(user_id);

CREATE INDEX IF NOT EXISTS IDX_person_members_person_id ON person_members(person_id);
CREATE INDEX IF NOT EXISTS IDX_person_members_member_id ON person_members(member_id);
CREATE INDEX IF NOT EXISTS IDX_person_members_organization_id ON person_members(organization_id);

CREATE INDEX IF NOT EXISTS IDX_person_contacts_person_id ON person_contacts(person_id);
CREATE INDEX IF NOT EXISTS IDX_person_contacts_contact_id ON person_contacts(contact_id);

-- =============================================
-- Organization Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS IDX_agent_organizations_status ON agent_organizations(status);
CREATE INDEX IF NOT EXISTS IDX_agent_organizations_subscription ON agent_organizations(subscription_status);

-- =============================================
-- Claims Workflow Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS IDX_claim_documents_claim_id ON claim_documents(claim_id);
CREATE INDEX IF NOT EXISTS IDX_claim_documents_type ON claim_documents(document_type);
CREATE INDEX IF NOT EXISTS IDX_claim_documents_status ON claim_documents(status);

CREATE INDEX IF NOT EXISTS IDX_claim_communications_claim_id ON claim_communications(claim_id);
CREATE INDEX IF NOT EXISTS IDX_claim_communications_type ON claim_communications(message_type);

CREATE INDEX IF NOT EXISTS IDX_claim_workflow_steps_claim_id ON claim_workflow_steps(claim_id);
CREATE INDEX IF NOT EXISTS IDX_claim_workflow_steps_status ON claim_workflow_steps(status);
CREATE INDEX IF NOT EXISTS IDX_claim_workflow_steps_assigned_to ON claim_workflow_steps(assigned_to);

COMMIT;

-- Verification
SELECT 'Database indexes created successfully' as status,
       count(*) as total_indexes
FROM pg_indexes 
WHERE schemaname = 'public';
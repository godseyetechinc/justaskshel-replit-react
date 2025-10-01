# Overview
JustAskShel is an enterprise-grade insurance comparison and management platform designed to simplify finding, comparing, and managing various insurance policies (life, health, dental, vision, hospital indemnity). It offers quote comparison tools, policy management dashboards, claims assistance, and wishlist functionality. The platform supports comprehensive multi-tenancy for agent organizations with a SuperAdmin default organization architecture, enabling advanced user and member management, agent directory systems, client relationship management, and robust role-based access control. It also features a comprehensive points and rewards loyalty program with advanced administrative controls and analytics, alongside detailed agent performance tracking and organizational analytics.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side uses React and TypeScript, built with Vite, Wouter for routing, and TanStack Query for server state management. UI components are built with shadcn/ui (based on Radix UI primitives) and styled using Tailwind CSS for consistent and responsive designs.

## Backend Architecture
The server-side uses Express.js with TypeScript, following a RESTful API design. It features modular separation for routing, authentication, database operations, and storage. Middleware handles request logging, error handling, and session management, utilizing a PostgreSQL-backed session store.

## Authentication System
The application employs a dual authentication system supporting traditional username/password login and Replit OAuth/OpenID Connect. It includes secure session management, user profile storage, and role-based route protection with a 6-tier role system: SuperAdmin (0), TenantAdmin (1), Agent (2), Member (3), Guest (4), Visitor (5).

## Database Design
The data layer utilizes Drizzle ORM with PostgreSQL. It features a unified `persons` entity model as a single source of truth for identity data, linked to role-specific tables (`person_users`, `person_members`, `person_contacts`). It supports multi-tenancy by agent organization, ensuring data isolation and role-based access control. Critical enhancements include `client_assignments`, `policy_transfers`, and `agent_commissions` tables, and enriched `policies` table for agent-policy relationships and commission tracking.

## State Management
Client-side server state is managed by TanStack Query for caching, background refetching, and optimistic updates. Local component state uses React hooks, and form state uses React Hook Form with Zod for shared client/server validation.

## UI Component System
The frontend uses a design system based on shadcn/ui components, themed with CSS custom properties, providing reusable, accessible, and responsive elements.

## Points & Rewards System
The loyalty program includes core automation for point awarding and tier progression (Bronze to Diamond), user engagement features like achievements, WebSocket notifications, and a referral system. Administrative tools provide CRUD operations for rules, redemption management, and bulk operations. Analytics dashboards offer insights into points metrics, reward popularity, and tier distribution.

## Multi-Tenant Architecture
The system supports comprehensive multi-tenancy with a SuperAdmin default organization architecture (ID: 0, Privilege Level 0). It ensures complete data separation between organizations and implements role-based access control. A `resolveDataScope()` helper function determines access level (global for SuperAdmin, organization-specific for others) for data types like Agents, Members, Analytics, and Client Assignments. This pattern is applied across various API endpoints with performance optimizations like database indexing, pagination, and caching.

## Agent-Policy Relationship Enhancement

### Phase 1: Database Schema Updates ✅ COMPLETED (October 1, 2025)
Established complete database infrastructure for agent-policy relationships, commission tracking, and policy lifecycle management:
- **New Tables**: client_assignments (16 columns), policy_transfers (9 columns), agent_commissions (15 columns)
- **Enhanced policies table**: Added 9 agent relationship fields (selling_agent_id, servicing_agent_id, organization_id, commission tracking fields)
- **Performance indexes**: 13 indexes on agent and organization foreign keys for optimal query performance
- **Full referential integrity**: 12 foreign key constraints ensuring data consistency

### Phase 2: Policy-Agent Association Logic ✅ COMPLETED (October 1, 2025)
Implemented automatic agent assignment system and comprehensive query capabilities:
- **Auto-Assignment**: POST /api/policies enhanced with 4-tier agent determination logic (explicit override → current agent → assigned agent → org default)
- **Smart Routing**: Policy creation automatically assigns selling agent, servicing agent, organization, and tracks policy source
- **Query Methods**: 5 new storage methods for agent-policy queries (getAgentPolicies, getOrganizationPolicies, getPolicyWithAgentDetails, getActiveClientAssignment, getOrganizationDefaultAgent)
- **API Endpoints**: 3 new REST endpoints with role-based authorization
  - GET /api/agents/:agentId/policies?type=selling|servicing
  - GET /api/organizations/:orgId/policies
  - GET /api/policies/:id/agent-details

### Phase 3: Policy Transfer & Reassignment ✅ COMPLETED & VALIDATED (October 1, 2025)
Implemented policy transfer functionality and complete audit trail system with comprehensive validation:
- **Storage Methods**: transferPolicyServicing() for agent reassignment, getPolicyTransferHistory() for audit retrieval
- **API Endpoints**: 2 new REST endpoints with strict authorization
  - PUT /api/policies/:id/transfer-servicing (Admin-only with org scope validation)
  - GET /api/policies/:id/transfer-history (Policy owner and Admin access)
- **Authorization**: SuperAdmin (privilege 0) and TenantAdmin (privilege 1) only, with TenantAdmin restricted to own organization
- **Audit Trail**: Complete transfer history with from/to agents, reason, timestamp, and transferred_by user tracking
- **Validation (100% Pass Rate)**: Database infrastructure (9 columns, 4 indexes, 4 FK constraints), storage methods operational, API endpoints authenticated/authorized, privilege restrictions enforced, 100% organization integrity, performance <100ms, security controls verified
- **Test Case**: Policy 351 transfer from agent1@justaskshel.com to agent2@justaskshel.com successfully validated with complete audit trail

### Phase 4: Commission & Performance Tracking ✅ COMPLETED & VALIDATED (October 1, 2025)
Implemented comprehensive commission tracking system with automatic calculation and payment workflow with 100% validation pass rate:
- **Storage Methods**: 5 new methods (createPolicyCommission, getAgentCommissions, getCommissionById, updateCommissionStatus, getOrganizationCommissions)
- **API Endpoints**: 4 new REST endpoints with role-based authorization
  - GET /api/agents/:agentId/commissions (with filters: status, startDate, endDate)
  - GET /api/commissions/:id
  - PUT /api/commissions/:id/approve (Admin-only)
  - PUT /api/commissions/:id/mark-paid (Admin-only with payment details)
- **Commission Workflow**: Pending → Approved → Paid status progression with complete payment tracking
- **Authorization**: Agents view own commissions, admins view/manage all (org-scoped for TenantAdmin), SuperAdmin (0) and TenantAdmin (1) approve/pay
- **Database Infrastructure**: 15 columns, 5 performance indexes (primary key + 4 on agent_id, policy_id, payment_status, payment_date), foreign keys to users/policies/organizations
- **Validation (100% Pass Rate)**: All 5 storage methods operational, all 4 API endpoints authenticated and functional, authorization controls enforced (privilege level restrictions), complete commission lifecycle validated (creation → approval → payment), filter operations working (status, date range), 100% organization integrity maintained for TenantAdmin, zero errors in production
- **Test Cases**: Commission ID 2 ($500 on policy 351 at 10% rate), Commission ID 3 ($375 on policy 352 at 12.5% rate with full workflow: creation → pending → approved → paid with payment details Wire Transfer/REF-2025-TEST-003), system metrics (2 commissions, $875 total, $437.50 avg)

### Phase 5: API Endpoint Enhancements ✅ COMPLETED & VALIDATED (October 1, 2025)
Implemented analytics and summary endpoints for dashboard-ready aggregated metrics with 100% operational validation:
- **Storage Methods**: 2 new aggregation methods (getAgentPoliciesSummary, getOrganizationPoliciesSummary)
- **API Endpoints**: 2 new summary REST endpoints with role-based authorization
  - GET /api/agents/:agentId/policies/summary (agent policy & commission analytics)
  - GET /api/organizations/:id/policies/summary (organization-wide policy & commission metrics)
- **Enhanced Response**: POST /api/policies now returns enriched data with full selling/servicing agent objects (id, email, profile) and organization object (id, name, displayName)
- **Data Aggregation**: Policy counts (total, active, inactive, selling, servicing), commission metrics (total, pending, approved, paid), recent transfer activity, active agent counts
- **Authorization**: Agents view own summaries, admins view any (org-scoped for TenantAdmin), organization summaries restricted to privilegeLevel ≤ 1
- **Validation (100% Pass Rate)**: Agent summary validated (2 policies all active, $875 commissions all paid), Organization summary validated (2 policies, $875 commissions 100% paid), enhanced policy response verified with agent/org object enrichment, zero Phase 5 errors

### Pending Phases (6-7)
Frontend UI Updates, Data Migration/Backfill. Details: `docs/AGENT_POLICY_RELATIONSHIP_ENHANCEMENT_PLAN.md`

# External Dependencies

## Database Services
- **Neon Serverless PostgreSQL**: Cloud-hosted PostgreSQL database.
- **Drizzle ORM**: Type-safe database toolkit.

## Authentication & Session Management
- **Replit OAuth/OpenID Connect**: Integrated authentication system.
- **connect-pg-simple**: PostgreSQL session store for Express.

## UI Framework & Styling
- **Radix UI**: Unstyled, accessible UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.

## Development & Build Tools
- **Vite**: Fast build tool and development server.
- **TypeScript**: Static type checking.

## Form Handling & Validation
- **React Hook Form**: Performant form library.
- **Zod**: Schema validation library.
- **@hookform/resolvers**: Integration for React Hook Form and Zod.
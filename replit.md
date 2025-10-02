# Overview
JustAskShel is an enterprise-grade insurance comparison and management platform simplifying finding, comparing, and managing various insurance policies (life, health, dental, vision, hospital indemnity). It offers quote comparison tools, policy management dashboards, claims assistance, and wishlist functionality. The platform supports comprehensive multi-tenancy for agent organizations with a SuperAdmin default organization architecture, enabling advanced user and member management, agent directory systems, client relationship management, and robust role-based access control. It also features a comprehensive points and rewards loyalty program with advanced administrative controls and analytics, alongside detailed agent performance tracking and organizational analytics.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
The client-side uses React and TypeScript, built with Vite, Wouter for routing, and TanStack Query for server state management. UI components are built with shadcn/ui (based on Radix UI primitives) and styled using Tailwind CSS.

## Backend
The server-side uses Express.js with TypeScript, following a RESTful API design. It features modular separation for routing, authentication, database operations, and storage. Middleware handles request logging, error handling, and session management.

## Authentication
The application employs a dual authentication system supporting traditional username/password login and Replit OAuth/OpenID Connect. It includes secure session management, user profile storage, and role-based route protection with a 6-tier role system (SuperAdmin, TenantAdmin, Agent, Member, Guest, Visitor). A two-stage authentication process separates credential validation from organization selection, including an `organization_access_requests` system for managing user requests to join organizations. All 5 phases completed (October 2, 2025): Phase 1 (Backend infrastructure), Phase 2 (Frontend refactoring), Phase 3 (Admin UI and organization visibility features including dashboard header badge and user profile section), Phase 4 (Comprehensive testing with 100% pass rate), and Phase 5 (Production deployment with zero downtime). System live and operational with enhanced backend integration including organization data in user sessions.

## Database
The data layer utilizes Drizzle ORM with PostgreSQL. It features a unified `persons` entity model linked to role-specific tables. Multi-tenancy is supported by agent organization, ensuring data isolation and role-based access control. Key tables include `client_assignments`, `policy_transfers`, and `agent_commissions`, with an enriched `policies` table for agent-policy relationships and commission tracking.

### Database Scripts (Updated: October 02, 2025)
Comprehensive SQL scripts maintained in `database-scripts/` folder:
- **COMPLETE_SCHEMA_EXPORT.sql**: Full schema with all 75 tables, organized by section with detailed documentation
- **DROP_ALL_TABLES.sql**: Safe drop script with proper reverse dependency order
- **Seed Scripts**: Three comprehensive seed files (01_seed_core_data.sql, 02_seed_insurance_data.sql, 03_seed_points_data.sql) for organizations, roles, insurance types/providers, achievements, and rewards catalog
- **Indexes Script**: Performance indexes for all major tables (10_create_indexes.sql)
All scripts are idempotent and include proper dependency management.

## State Management
Client-side server state is managed by TanStack Query. Local component state uses React hooks, and form state uses React Hook Form with Zod for shared client/server validation.

## UI Component System
The frontend uses a design system based on shadcn/ui components, themed with CSS custom properties.

## Points & Rewards System
A loyalty program includes automated point awarding, tier progression, user engagement features (achievements, WebSocket notifications, referral system), and administrative tools for rules, redemption, and bulk operations. Analytics dashboards provide insights into points metrics and reward popularity.

## Multi-Tenant Architecture
The system supports comprehensive multi-tenancy with a SuperAdmin default organization (ID: 0). It ensures data separation and implements role-based access control with a `resolveDataScope()` helper function for data access.

## Agent-Policy Relationship Management
The platform includes a comprehensive system for managing agent-policy relationships, commission tracking, and policy lifecycle. This involves dedicated database tables for assignments, transfers, and commissions, along with enhanced policy data. Automated agent assignment logic, policy transfer functionality with audit trails, and a commission tracking system (from pending to paid) are integrated. API endpoints provide querying capabilities for agent and organization policies, summaries, and commission management, all with role-based authorization. Frontend UI supports agent and admin dashboards for managing policies and commissions.

# External Dependencies

## Database Services
- Neon Serverless PostgreSQL
- Drizzle ORM

## Authentication & Session Management
- Replit OAuth/OpenID Connect
- connect-pg-simple

## UI Framework & Styling
- Radix UI
- Tailwind CSS
- Lucide React

## Development & Build Tools
- Vite
- TypeScript

## Form Handling & Validation
- React Hook Form
- Zod
- @hookform/resolvers
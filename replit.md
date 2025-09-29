# Overview
JustAskShel is an enterprise-grade insurance comparison and management platform that simplifies finding, comparing, and managing various insurance policies (life, health, dental, vision, hospital indemnity). It provides quote comparison tools, policy management dashboards, claims assistance, and wishlist functionality. The platform features comprehensive multi-tenancy for agent organizations with SuperAdmin default organization architecture, offering advanced user and member management, agent directory systems, client relationship management, and robust role-based access control. It also features a comprehensive points and rewards loyalty program with advanced administrative controls and analytics, plus detailed agent performance tracking and organizational analytics.

# Phase 2 Multi-Tenant Agent Organization Enhancement (Completed)

## Phase 2 Achievements
Successfully implemented comprehensive enterprise-grade multi-tenant capabilities including:

### Phase 2.1: SuperAdmin Default Organization Architecture
- ✅ **System Organization (ID: 0)**: Created SYSTEM_PLATFORM organization as SuperAdmin default organization
- ✅ **Privilege Level 0**: SuperAdmin users assigned to privilege level 0 for system-wide access
- ✅ **Multi-Tenant Foundation**: Complete separation between system administration and tenant organizations

### Agent Directory and Collaboration System
- ✅ **Comprehensive Agent Profiles**: 6 detailed agent profiles with specializations, performance ratings, years of experience
- ✅ **Agent Search and Discovery**: Advanced search capabilities within organizations
- ✅ **Performance Ratings**: Agent rating system from 4.4 to 4.9 stars
- ✅ **Specialization Tracking**: Rich specialization data (Life Insurance, Business Insurance, Digital Insurance, etc.)
- ✅ **Collaboration Features**: Agent-to-agent communication and referral systems

### Client Assignment and Relationship Management
- ✅ **Client Assignment System**: Comprehensive backend storage methods for client-agent relationships
- ✅ **Assignment Types**: Support for "primary", "secondary", and "referral" assignment types
- ✅ **Client Transfers**: Seamless client reassignment between agents within organizations
- ✅ **Relationship Tracking**: Complete history of client-agent interactions and assignments
- ✅ **Assignment Analytics**: Client workload distribution and assignment performance metrics

### Advanced Organization Analytics
- ✅ **KPI Dashboards**: Revenue tracking, client acquisition metrics, policy conversion rates
- ✅ **Agent Workload Analysis**: Even distribution monitoring and capacity management
- ✅ **Client Lifecycle Tracking**: New client onboarding, retention, and churn analytics
- ✅ **Comparative Analytics**: Cross-organization performance benchmarking
- ✅ **Performance Insights**: Detailed organizational health metrics and alerts

### Agent Performance Tracking and Reporting
- ✅ **Performance History**: 6-month historical performance tracking with monthly breakdowns
- ✅ **Goals and Targets**: Monthly goal setting with achievement percentage tracking
- ✅ **Productivity Metrics**: Daily quote averages, response times, productivity scoring
- ✅ **Comprehensive Reports**: Detailed agent assessment with performance ratings and recommendations
- ✅ **Organization Rankings**: Enhanced agent ranking system across organizations

### Multi-Tenant Architecture Results
- ✅ **3 Active Organizations**: demo-org, abc-insurance, quick-quote
- ✅ **14 Agents Distributed**: 10 agents in demo-org, 2 in abc-insurance, 2 in quick-quote
- ✅ **Proper Isolation**: Complete data separation between organizations
- ✅ **Role-Based Access**: Secure privilege-level access control throughout system

# SuperAdmin Cross-Organization Access (All Phases 1-5 Completed)

## Implementation Summary
Successfully implemented comprehensive SuperAdmin cross-organization access system across all major data types (Agents, Members, Analytics, Client Assignments) with backend infrastructure, API layer, advanced frontend UI features, and performance optimizations, enabling system-wide visibility while maintaining strict data isolation for regular users.

### Phase 1: Backend Infrastructure ✅ COMPLETED
- ✅ **Data Scope Resolution System**: Centralized `resolveDataScope()` helper function determines access level based on user privilege
- ✅ **Enhanced Agent Query Methods**: New scope-aware methods (`getAgents()`, `searchAgentsWithContext()`) support cross-organization queries
- ✅ **Organization Metadata**: All agent responses include organization information (id, name, displayName)
- ✅ **Backward Compatibility**: Legacy endpoints maintained while new functionality added

### Phase 2: API Layer ✅ COMPLETED
- ✅ **New Scope-Aware Endpoint**: `GET /api/agents` automatically returns all orgs for SuperAdmin, user's org for others
- ✅ **User Context Resolution**: Session-based user context extraction with privilege level awareness
- ✅ **Authentication Integration**: Seamless integration with existing authentication system

### Phase 3: Frontend UI Enhancements ✅ COMPLETED
- ✅ **Organization Badge Component**: Created `OrganizationBadge` component with color coding and icon support
- ✅ **Organization Filter Dropdown**: SuperAdmin-only filter to select specific organization or view all
- ✅ **Grouping Toggle**: Switch between flat list and organization-grouped sections with visual icons
- ✅ **Enhanced Agent Cards**: Conditional organization display for SuperAdmin users
- ✅ **Agent Directory Updated**: Complete UI overhaul with advanced filtering capabilities
- ✅ **React Query Integration**: Simplified query logic with automatic scope handling

### Phase 4: Performance Optimization ✅ COMPLETED
- ✅ **Database Indexes**: Added performance indexes on users table (organizationId, role, privilegeLevel)
- ✅ **Pagination Support**: Implemented pagination for `/api/agents` endpoint with limit/offset parameters
  - Default limit: 50 agents per page (max 100)
  - Pagination metadata: page, limit, total, totalPages, hasMore
- ✅ **React Query Caching**: Optimized cache strategy with 5-minute garbage collection time
- ✅ **HTTP Cache Headers**: Added response caching with Cache-Control and Vary headers
  - Cache-Control: private, max-age=300 (5 minutes)
  - Vary: Cookie (varies by authentication)

### Phase 5: Extended Cross-Organization Access ✅ COMPLETED
- ✅ **Members Management**: `/api/members-scope` endpoint with cross-organization member visibility and pagination
- ✅ **Analytics Dashboard**: `/api/analytics-scope` endpoint with system-wide aggregated analytics and organization breakdown
- ✅ **Client Assignments**: `/api/client-assignments-scope` endpoint with global client-agent relationship tracking and pagination
- ✅ **Storage Methods**: Added `getMembersWithScope()`, `getAnalyticsWithScope()`, `getClientAssignmentsWithScope()` in server/storage.ts
- ✅ **Consistent Pattern**: All Phase 5 endpoints follow established `resolveDataScope()` architecture pattern
- ✅ **System-Wide Reporting**: SuperAdmin analytics include organization breakdown and system totals
- ✅ **Audit Trails**: Server-side logging tracks all cross-organization access requests

### Technical Implementation

**Data Scope Logic:**
- SuperAdmin (privilege level 0) → `isGlobal: true` → queries all organizations
- All other users → `isGlobal: false` → queries only their organization
- Automatic scope resolution based on user session context

**Response Structure:**
```typescript
{
  id: string,
  email: string,
  role: string,
  organization: {
    id: number,
    name: string,
    displayName: string
  },
  profile: { ... }
}
```

**UI Features:**
- Organization filter dropdown (SuperAdmin only)
- Flat list vs grouped view toggle
- Color-coded organization badges
- Conditional rendering based on privilege level

### Security & Performance
- ✅ **Data Isolation**: Regular users cannot access cross-organization data
- ✅ **Privilege Validation**: Multi-layer privilege checking ensures security
- ✅ **Efficient Queries**: Optimized database queries with proper organization joins and performance indexes
- ✅ **Session-Based Access**: Secure session-based user context resolution
- ✅ **TypeScript Safety**: Full type safety with null checks and proper type definitions
- ✅ **Pagination**: Efficient data loading with configurable page sizes (default 50, max 100)
- ✅ **Response Caching**: HTTP cache headers for improved performance (5-minute cache)
- ✅ **Client-Side Caching**: React Query garbage collection optimization

### System Architecture Pattern
The proven `resolveDataScope()` pattern is now established across all major data types:
1. **User Context Extraction**: Extract userId, privilegeLevel, and organizationId from session
2. **Scope Resolution**: Determine global vs organization-scoped access based on privilege level
3. **Query Execution**: Apply appropriate filters and include organization metadata
4. **Response Enhancement**: Return paginated data with cache headers
5. **Security Validation**: Multi-layer privilege checking ensures data isolation

### Available Scope-Aware Endpoints
- `GET /api/agents` - Agent directory with organization metadata
- `GET /api/members-scope` - Members management with organization metadata
- `GET /api/analytics-scope` - System-wide or organization-scoped analytics
- `GET /api/client-assignments-scope` - Client-agent relationships with organization context

### Future Enhancements
- Frontend UI for Members, Analytics, and Client Assignments scope-aware views
- Advanced data export capabilities across organizations
- Enhanced audit trail visualization and reporting

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with React and TypeScript, using Vite, Wouter for routing, and TanStack Query for server state management. UI components are built with shadcn/ui (based on Radix UI primitives) and styled using Tailwind CSS for consistent and responsive designs.

## Backend Architecture
The server-side uses Express.js with TypeScript, following a RESTful API design. It features modular separation for routing, authentication, database operations, and storage. Middleware handles request logging, error handling, and session management, utilizing a PostgreSQL-backed session store.

## Authentication System
The application uses a dual authentication system supporting traditional username/password login and Replit OAuth/OpenID Connect. It includes secure session management, user profile storage, and role-based route protection with a 6-tier role system: SuperAdmin (0), TenantAdmin (1), Agent (2), Member (3), Guest (4), Visitor (5).

## Database Design
The data layer uses Drizzle ORM with PostgreSQL. It features a unified `persons` entity model as a single source of truth for identity data, linked to role-specific tables (`person_users`, `person_members`, `person_contacts`). It supports multi-tenancy by agent organization, ensuring data isolation and role-based access control.

## State Management
Client-side server state is managed by TanStack Query for caching, background refetching, and optimistic updates. Local component state uses React hooks, and form state uses React Hook Form with Zod for shared client/server validation.

## UI Component System
The frontend uses a design system based on shadcn/ui components, themed with CSS custom properties, providing reusable, accessible, and responsive elements.

## Points & Rewards System
The loyalty program includes:
- **Core Automation**: Automatic points awarding for key activities and dynamic 5-tier progression (Bronze to Diamond) based on lifetime points.
- **User Engagement**: Achievement system with milestone, streak, and activity categories; real-time WebSocket notifications; and a referral system with code generation and reward processing.
- **Administrative Tools**: CRUD operations for points rules, redemption management with status workflows, and bulk operations for mass point awards and reward distribution.
- **Analytics & Insights**: Admin dashboard with interactive visualizations for points metrics, reward popularity, and tier distribution; personal user insights for balance, tier progress, and recommendations.

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
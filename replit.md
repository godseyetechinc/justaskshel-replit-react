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

# SuperAdmin Cross-Organization Access (Phase 1 Completed)

## Phase 1 Implementation Summary
Successfully implemented backend infrastructure and API layer for SuperAdmin cross-organization data access, enabling system-wide visibility while maintaining strict data isolation for regular users.

### Phase 1 Achievements

#### Backend Infrastructure ✅ COMPLETED
- ✅ **Data Scope Resolution System**: Centralized `resolveDataScope()` helper function determines access level based on user privilege
- ✅ **Enhanced Agent Query Methods**: New scope-aware methods (`getAgents()`, `searchAgentsWithContext()`) support cross-organization queries
- ✅ **Organization Metadata**: All agent responses include organization information (id, name, displayName)
- ✅ **Backward Compatibility**: Legacy endpoints maintained while new functionality added

#### API Layer ✅ COMPLETED
- ✅ **New Scope-Aware Endpoint**: `GET /api/agents` automatically returns all orgs for SuperAdmin, user's org for others
- ✅ **User Context Resolution**: Session-based user context extraction with privilege level awareness
- ✅ **Authentication Integration**: Seamless integration with existing authentication system

#### Frontend Integration ✅ PARTIALLY COMPLETED
- ✅ **Agent Directory Updated**: Modified to use new `/api/agents` endpoint
- ✅ **Organization Display**: SuperAdmin users see organization name for each agent
- ✅ **React Query Integration**: Simplified query logic with automatic scope handling
- ⏳ **Advanced Filtering**: Organization filter dropdown and grouping toggle pending

### Technical Implementation Details

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

### Security & Performance
- ✅ **Data Isolation**: Regular users cannot access cross-organization data
- ✅ **Privilege Validation**: Multi-layer privilege checking ensures security
- ✅ **Efficient Queries**: Optimized database queries with proper organization joins
- ✅ **Session-Based Access**: Secure session-based user context resolution

### Next Steps
- Implement advanced filtering options (organization dropdown, grouping toggle)
- Extend pattern to other data types (members, analytics, client assignments)
- Performance optimization for large-scale cross-organization queries
- Comprehensive system-wide testing

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
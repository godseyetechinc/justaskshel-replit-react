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
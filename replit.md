# Overview

JustAskShel is an insurance comparison and management platform designed to help users find, compare, and manage various types of insurance policies (life, health, dental, vision, hospital indemnity). It offers quote comparison tools, policy management dashboards, claims assistance, and wishlist functionality, aiming to simplify the insurance shopping and management experience. The platform supports multi-tenancy for agent organizations and provides comprehensive user and member management with robust role-based access control.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with React and TypeScript, using Vite as the build tool. It employs Wouter for routing and TanStack Query for server state management. The UI is constructed with shadcn/ui components (built on Radix UI primitives) and styled using Tailwind CSS for consistent and responsive designs.

## Backend Architecture
The server-side uses Express.js with TypeScript, following a RESTful API design. It features modular separation for routing, authentication, database operations, and storage. Middleware handles request logging, error handling, and session management, utilizing a PostgreSQL-backed session store.

## Authentication System
The application utilizes a dual authentication system supporting both traditional username/password login and Replit OAuth/OpenID Connect. It includes secure session management, user profile storage, and role-based route protection. A 6-tier role system is implemented: SuperAdmin (0), TenantAdmin (1), Agent (2), Member (3), Guest (4), Visitor (5), with hierarchical privilege levels and a JSON permissions structure.

## Database Design
The data layer uses Drizzle ORM with PostgreSQL. Key features include:

### Unified Person Entity Model
A central `persons` table acts as the single source of truth for individual identity data, eliminating data duplication. Association tables (`person_users`, `person_members`, `person_contacts`) link person entities to role-specific data. This model consolidated records and removed redundant columns, enhancing data integrity.

### Multi-Tenant Agent Organization System
The database supports multi-tenancy by agent organization, allowing for organization-specific user and member assignment, and tenant isolation for data access control. SuperAdmins have cross-tenant access, while TenantAdmins are restricted to their associated organization.

The database design ensures complex relationships, robust role-based security, and performance optimization through indexing.

## State Management
Client-side state is managed by TanStack Query for server state, offering caching, background refetching, and optimistic updates. Local component state is handled with React hooks, and form state uses React Hook Form with Zod for shared client/server validation.

## UI Component System
The frontend uses a design system based on shadcn/ui components, themed with CSS custom properties. The component library provides reusable, accessible, and responsive elements for forms, data display, navigation, and feedback.

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
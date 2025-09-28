# Overview
JustAskShel is an insurance comparison and management platform that simplifies finding, comparing, and managing various insurance policies (life, health, dental, vision, hospital indemnity). It provides quote comparison tools, policy management dashboards, claims assistance, and wishlist functionality. The platform supports multi-tenancy for agent organizations, offering comprehensive user and member management with robust role-based access control. It also features a comprehensive points and rewards loyalty program with advanced administrative controls and analytics.

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
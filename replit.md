# Overview

InsureScope is a comprehensive insurance comparison and management platform that helps users find, compare, and manage insurance policies across multiple types including life, health, dental, vision, and hospital indemnity insurance. The platform provides quote comparison tools, policy management dashboards, claims assistance, and wishlist functionality to streamline the insurance shopping and management experience.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with React and TypeScript, utilizing a modern component-based architecture with Vite as the build tool. The application uses Wouter for lightweight client-side routing and TanStack Query for server state management. The UI is implemented with shadcn/ui components built on top of Radix UI primitives and styled with Tailwind CSS for consistent design and responsive layouts.

## Backend Architecture
The server-side follows a RESTful API design using Express.js with TypeScript. The architecture separates concerns with dedicated modules for routing, authentication, database operations, and storage abstractions. The server implements middleware for request logging, error handling, and session management with PostgreSQL-backed session storage.

## Authentication System
The application integrates with Replit's OAuth system using OpenID Connect for user authentication. The authentication flow includes session management with secure cookies, user profile storage, and route protection middleware. The system supports automatic token refresh and provides user context throughout the application.

## Database Design
The data layer uses Drizzle ORM with PostgreSQL as the primary database. The schema includes tables for users, insurance types, providers, quotes, policies, claims, dependents, wishlists, and session storage. The database design supports complex relationships between entities and includes proper indexing for performance optimization.

## State Management
Client-side state is managed through TanStack Query for server state synchronization, with built-in caching, background refetching, and optimistic updates. Local component state is handled with React hooks, while form state utilizes React Hook Form with Zod validation schemas shared between client and server.

## UI Component System
The frontend implements a design system using shadcn/ui components with consistent theming through CSS custom properties. The component library includes reusable elements for forms, data display, navigation, and feedback, all built with accessibility considerations and responsive design patterns.

# External Dependencies

## Database Services
- **Neon Serverless PostgreSQL**: Cloud-hosted PostgreSQL database with serverless scaling capabilities
- **Drizzle ORM**: Type-safe database toolkit for schema definition, migrations, and queries

## Authentication & Session Management
- **Replit OAuth/OpenID Connect**: Integrated authentication system for user login and profile management
- **connect-pg-simple**: PostgreSQL session store for Express sessions with automatic cleanup

## UI Framework & Styling
- **Radix UI**: Unstyled, accessible UI primitives for complex components
- **Tailwind CSS**: Utility-first CSS framework for responsive design and theming
- **Lucide React**: Icon library providing consistent iconography throughout the application

## Development & Build Tools
- **Vite**: Fast build tool and development server with hot module replacement
- **TypeScript**: Static type checking for enhanced development experience and code reliability
- **Replit Development Plugins**: Cartographer and runtime error overlay for enhanced development experience

## Form Handling & Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: Schema validation library used for both client and server-side validation
- **@hookform/resolvers**: Integration layer between React Hook Form and Zod schemas
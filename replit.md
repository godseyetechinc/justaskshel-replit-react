# Overview

JustAskShel is a comprehensive insurance comparison and management platform that helps users find, compare, and manage insurance policies across multiple types including life, health, dental, vision, and hospital indemnity insurance. The platform provides quote comparison tools, policy management dashboards, claims assistance, and wishlist functionality to streamline the insurance shopping and management experience.

## Recent Updates (August 2025)
- **Complete User Management and Tenant Access Management System (Latest)**: Implemented comprehensive user management system with full CRUD operations, advanced UI with role-based permissions and filtering, multi-tenant access control with SuperAdmin and TenantAdmin separation, user creation/editing/deletion with proper privilege checking, user statistics dashboard with activity tracking and status management, role-based access system with organization-specific user management, backend APIs for complete user lifecycle management, and integrated form validation with password management and user status controls. SuperAdmin has full access to all users across all organizations while TenantAdmin is limited to managing users within their organization.
- **SuperAdmin Role System with Multi-Tenant Access Control**: Created SuperAdmin role with privilege level 0 for cross-tenant access and renamed Admin role to TenantAdmin. SuperAdmin users have unrestricted access to all tenant data and organization management. TenantAdmin users are restricted to their associated tenant organization only. Updated database schema, role permissions, and dashboard components. Created superadmin@justaskshel.com user for system-wide administration.
- **Multi-Tenant Agent Organization System**: Implemented comprehensive multi-tenancy by agent organization with database schema updates, organization management backend APIs, and organization management UI. Features include agent organizations table with subscription plans (Basic/Professional/Enterprise), organization-specific user and member assignment, organization management dashboard for TenantAdmin users, and tenant isolation for data access control. Successfully migrated existing users and members to organization-based structure with 3 demo organizations (Demo Insurance Agency, ABC Insurance Group, QuickQuote Insurance).
- **Comprehensive Member Profile Management System**: Created advanced member profile management interface for Admin users under Dashboard 'Members' menu. Features include detailed member listing with table/grid views, advanced search and filtering by status, comprehensive member profile dialogs with tabbed information (Personal, Contact, Preferences, Activity), avatar display system with custom colors and types, member status management (Active/Inactive/Suspended), and full CRUD operations. Admins can now view detailed member information including bio, emergency contacts, preferences, and membership history.
- **Insurance Needs Analysis Calculator**: Implemented sophisticated insurance needs calculator with multi-step form (personal, financial, health, coverage information), DIME method calculations, risk assessment scoring, and personalized recommendations with priority levels and cost estimates.
- **Member Profile System for Individual Members**: Enhanced member schema with avatar customization options and created "My Profile" menu item for Member role users to manage their own profiles with avatar management, personal information, and emergency contacts.
- **Authentication System Streamlined**: Removed Replit OAuth implementation and streamlined to traditional username/password authentication only. Fixed authentication routing conflicts by adding redirect logic for authenticated users accessing login/signup pages. Simplified session management and eliminated user ID conflicts between OAuth and traditional sessions.
- **Dual Authentication System Implementation**: Successfully implemented comprehensive dual authentication supporting both traditional username/password login and existing Replit OAuth. Includes login/signup pages, session management, logout functionality, enhanced navigation with proper authentication flows, and seamless integration with existing role-based authorization system
- **Database Seeding with Role-Based User Distribution**: Successfully seeded database with 5 admins, 10 agents, 200 members (evenly distributed among agents), and 1000 total contacts with proper role-based relationships and comprehensive user authentication system
- **Comprehensive Role-Based Authorization**: Implemented robust 5-tier role system with Admin, Agent, Member, Guest, Visitor roles using privilege levels 1-5, with detailed permissions matrix, database schema updates, and enhanced useRoleAuth hook with privilege-based access control
- **Database Schema Enhancement**: Added roles table with JSON permissions, updated users table with privilegeLevel field, and created comprehensive ROLE_PERMISSIONS constants for fine-grained access control
- **Enhanced Permission System**: Developed sophisticated permission checking with resource-specific access control, ownership validation, and privilege level hierarchies for secure multi-role access management
- **Visual Enhancement with Themed Images**: Added strategically placed, professionally themed placeholder images across all coverage pages (life, health, dental, vision, hospital indemnity, discount health) to enhance visual appeal and user engagement
- **Hero Section Image Integration**: Implemented visually appealing two-column grid layouts with images on coverage pages for better user experience
- **Application Rebranding**: Renamed application from "InsureScope" to "JustAskShel" with updated branding throughout the platform
- **Terminology Consistency**: Updated all references from "Insurance Types" to "Coverage Types" across the application for improved clarity
- **Header Menu Styling**: Applied consistent dashboard-style header menu styling across all pages for unified user experience
- **Dashboard Button Styling**: Updated Dashboard navigation link with outlined button styling and Settings icon for consistent visual hierarchy
- **Documentation Synchronization**: Created comprehensive README.md from replit.md content with established synchronization process
- **Default Admin User**: Created system administrator account (admin@insurescope.com) with full system access
- **Comprehensive CRUD Operations**: Implemented full create, read, update, delete functionality for all database entities with role-based access control
- **Enhanced User Profile Management**: Added profile editing page with comprehensive user information fields (phone, address, date of birth, etc.)
- **Contact Management System**: Created complete contact database with CRM-style functionality linked to user data
- **Advanced Claims Workflow**: Implemented sophisticated claims assistance system with document management, messaging, and status tracking
- **Dashboard Navigation**: Added seamless navigation between public site and dashboard with role-based menu filtering
- **Complete Entity Management**: Added CRUD interfaces for applications, policies, wishlist, loyalty points, dependents, and applicants with proper permissions

# User Preferences

Preferred communication style: Simple, everyday language.

# Documentation Management

## README.md Synchronization
The project maintains both `replit.md` (internal development context) and `README.md` (public Git repository documentation). These files should be kept synchronized:

- **replit.md**: Contains detailed development context, user preferences, and technical architecture specific to Replit environment
- **README.md**: Public-facing documentation with project overview, setup instructions, and contribution guidelines
- **Sync Process**: When major updates occur to project features, architecture, or user preferences, both files should be updated to maintain consistency
- **Content Focus**: README.md emphasizes setup and usage instructions, while replit.md focuses on development context and preferences

# System Architecture

## Frontend Architecture
The client-side is built with React and TypeScript, utilizing a modern component-based architecture with Vite as the build tool. The application uses Wouter for lightweight client-side routing and TanStack Query for server state management. The UI is implemented with shadcn/ui components built on top of Radix UI primitives and styled with Tailwind CSS for consistent design and responsive layouts.

## Backend Architecture
The server-side follows a RESTful API design using Express.js with TypeScript. The architecture separates concerns with dedicated modules for routing, authentication, database operations, and storage abstractions. The server implements middleware for request logging, error handling, and session management with PostgreSQL-backed session storage.

## Authentication System
The application integrates with Replit's OAuth system using OpenID Connect for user authentication. The authentication flow includes session management with secure cookies, user profile storage, and route protection middleware. The system supports automatic token refresh and provides user context throughout the application.

## Database Design
The data layer uses Drizzle ORM with PostgreSQL as the primary database. The schema includes comprehensive tables for users, roles, insurance types, providers, quotes, policies, claims, dependents, wishlists, and session storage. 

### Role-Based Authorization Schema
- **Roles Table**: Defines 6 privilege levels (0=SuperAdmin, 1=TenantAdmin, 2=Agent, 3=Member, 4=Guest, 5=Visitor) with JSON permissions structure
- **Users Table**: Enhanced with role field and privilegeLevel for hierarchical access control
- **Permission System**: Resource-based access control with ownership validation, privilege-level comparison, and tenant isolation
- **Database Constraints**: Role enumeration validation ensuring data integrity across the authorization system
- **Multi-Tenant Access Control**: SuperAdmin (privilege 0) has cross-tenant access, TenantAdmin (privilege 1) restricted to associated organization

The database design supports complex relationships between entities, implements robust role-based security, and includes proper indexing for performance optimization.

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
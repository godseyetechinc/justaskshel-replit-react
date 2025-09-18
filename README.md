# JustAskShel - Insurance Marketplace Platform

JustAskShel is a comprehensive insurance comparison and management platform that helps users find, compare, and manage insurance policies across multiple types including life, health, dental, vision, and hospital indemnity insurance. The platform provides quote comparison tools, policy management dashboards, claims assistance, and wishlist functionality to streamline the insurance shopping and management experience.

## Recent Updates (September 2025)
*Last updated: September 2025*

### Latest Major Updates
- **Phase 1: Core Multi-Tenant Integration** (Latest): Implemented foundation for ProviderApiClient integration with multi-tenant capabilities. Features include:
  - **Multi-Tenant Provider Orchestration**: Organization-aware provider selection and configuration scaffolding
  - **Basic Error Handling**: Provider timeout handling and mock mode support
  - **WebSocket Infrastructure**: Real-time quote update infrastructure (basic implementation)
  - **Caching Foundation**: Organization-specific cache key structure with basic TTL
  - **Quote Aggregation**: Concurrent provider calls with combined internal/external results
  - **Provider Configuration**: Enhanced provider config structure with organization override support

- **Comprehensive Provider Management System**: Implemented complete SuperAdmin-only provider management system with full CRUD operations for insurance provider configurations. Features include:
  - **Provider Configuration Management**: Full editing interface for API settings, coverage types, priority levels, rate limiting, and retry configurations
  - **Real-time Statistics Dashboard**: Performance metrics showing success rates, request counts, and provider status with visual progress indicators
  - **API Testing & Monitoring**: One-click provider connectivity testing with response time tracking and detailed error reporting
  - **Advanced Provider Settings**: Support for authentication headers, timeout configuration, mock mode toggle, and burst limit controls
  - **Comprehensive UI**: Tabbed interface with Statistics, Provider Management, and Quote Requests sections accessible via Dashboard → Provider Management

- **SuperAdmin Role System with Multi-Tenant Access Control**: Created SuperAdmin role with privilege level 0 for cross-tenant access and renamed Admin role to TenantAdmin. SuperAdmin users have unrestricted access to all tenant data and organization management. TenantAdmin users are restricted to their associated tenant organization only. Updated database schema, role permissions, and dashboard components. Created superadmin@justaskshel.com user for system-wide administration.

- **Multi-Tenant Agent Organization System**: Implemented comprehensive multi-tenancy by agent organization with database schema updates, organization management backend APIs, and organization management UI. Features include agent organizations table with subscription plans (Basic/Professional/Enterprise), organization-specific user and member assignment, organization management dashboard for TenantAdmin users, and tenant isolation for data access control. Successfully migrated existing users and members to organization-based structure with 3 demo organizations (Demo Insurance Agency, ABC Insurance Group, QuickQuote Insurance).

- **Comprehensive Member Profile Management System**: Created advanced member profile management interface for TenantAdmin users under Dashboard 'Members' menu. Features include detailed member listing with table/grid views, advanced search and filtering by status, comprehensive member profile dialogs with tabbed information (Personal, Contact, Preferences, Activity), avatar display system with custom colors and types, member status management (Active/Inactive/Suspended), and full CRUD operations. Admins can now view detailed member information including bio, emergency contacts, preferences, and membership history.

### Previous Updates
- **Application Rebranding**: Renamed application from "InsureScope" to "JustAskShel" with updated branding throughout the platform
- **Terminology Consistency**: Updated all references from "Insurance Types" to "Coverage Types" across the application for improved clarity
- **Header Menu Styling**: Applied consistent dashboard-style header menu styling across all pages for unified user experience
- **Default Admin User**: Created system administrator account (admin@insurescope.com) with full system access
- **Comprehensive CRUD Operations**: Implemented full create, read, update, delete functionality for all database entities with role-based access control
- **Enhanced User Profile Management**: Added profile editing page with comprehensive user information fields (phone, address, date of birth, etc.)
- **Contact Management System**: Created complete contact database with CRM-style functionality linked to user data
- **Advanced Claims Workflow**: Implemented sophisticated claims assistance system with document management, messaging, and status tracking
- **Dashboard Navigation**: Added seamless navigation between public site and dashboard with role-based menu filtering
- **Complete Entity Management**: Added CRUD interfaces for applications, policies, wishlist, loyalty points, dependents, and applicants with proper permissions

## Features

### Core Platform Features
- **Quote Comparison**: Compare insurance quotes across multiple providers and coverage types
- **Policy Management**: Comprehensive dashboard for managing existing policies
- **Claims Assistance**: Streamlined claims filing and tracking system
- **Wishlist Functionality**: Save and organize desired insurance products
- **User Authentication**: Secure login system with role-based access control
- **Responsive Design**: Optimized for desktop and mobile devices

### Coverage Types
- Life Insurance
- Health Insurance
- Dental Insurance
- Vision Insurance
- Hospital Indemnity Insurance
- Discount Health Plans

### User Roles & Multi-Tenant Access Control
- **SuperAdmin** (Privilege Level 0): Full cross-tenant system access, manage all organizations and users across all tenants, complete provider management system access
- **TenantAdmin** (Privilege Level 1): Full administrative access restricted to their assigned organization only
- **Agent** (Privilege Level 2): Access to client management, policy tools, and applications within their organization
- **Member** (Privilege Level 3): Standard user access to quotes, policies, and personal data within their organization
- **Guest** (Privilege Level 4): Limited authenticated access to basic features
- **Visitor** (Privilege Level 5): Public access to general information and quote requests

### SuperAdmin Exclusive Features
- **Provider Management**: Complete control over insurance provider API configurations, testing, and monitoring
- **Cross-Tenant Analytics**: System-wide performance metrics and provider statistics
- **API Configuration**: Rate limiting, retry policies, timeout settings, and authentication management
- **Provider Testing**: Real-time connectivity testing and performance monitoring

## Technical Architecture

### Frontend
- **React + TypeScript**: Modern component-based architecture
- **Vite**: Fast build tool and development server
- **Wouter**: Lightweight client-side routing
- **TanStack Query**: Server state management with caching
- **shadcn/ui + Tailwind CSS**: Component library and styling
- **Radix UI**: Accessible UI primitives

### Backend
- **Express.js + TypeScript**: RESTful API server
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Primary database with Neon serverless hosting
- **Replit OAuth**: Authentication via OpenID Connect
- **Session Management**: PostgreSQL-backed sessions

### Database Design
- **Multi-Tenant Architecture**: Organizations table with tenant-specific user and member assignment
- **Role-Based Access Control**: 6-tier privilege system (0=SuperAdmin, 1=TenantAdmin, 2=Agent, 3=Member, 4=Guest, 5=Visitor)
- **Comprehensive Entities**: Users, insurance types, providers, quotes, policies, claims, applications
- **Provider Configuration System**: Complete provider settings with API configurations, rate limiting, and performance tracking
- **External Quote Request Tracking**: Comprehensive logging of provider API calls with success/failure metrics
- **Member Management**: Advanced member profiles with avatars, preferences, and organizational assignment
- **Claims Workflow**: Document storage, messaging, and status tracking
- **Loyalty System**: Points, rewards, redemptions with tier-based progression
- **Contact CRM**: Lead and customer management with agent assignment
- **Proper Relationships**: Foreign keys, indexing, and data integrity constraints

## Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Replit environment (recommended)

### Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (DATABASE_URL, SESSION_SECRET)
4. Run database migrations: `npm run db:push`
5. Start development server: `npm run dev`

### Test Accounts
- **SuperAdmin**: superadmin@justaskshel.com (password: password123)
- **TenantAdmin**: admin1@justaskshel.com (password: password123)
- **Agent**: agent1@justaskshel.com (password: password123)
- **Member**: Various member accounts available (password: password123)

## Multi-Tenant Organization Structure

The platform includes 3 demo organizations for testing:

1. **Demo Insurance Agency** (ID: 1)
   - 3 Agents assigned
   - Professional subscription plan
   - 67 Members

2. **ABC Insurance Group** (ID: 2)  
   - 3 Agents assigned
   - Enterprise subscription plan
   - 67 Members

3. **QuickQuote Insurance** (ID: 3)
   - 4 Agents assigned
   - Basic subscription plan
   - 67 Members

### Access Control Features
- **SuperAdmin**: Can view and manage all organizations, cross-tenant data access
- **TenantAdmin**: Restricted to their assigned organization only
- **Agents**: Handle applications, policies, and members within their organization
- **Members**: Access personal data and organization-specific services

### Environment Variables
```
DATABASE_URL=postgresql://...
SESSION_SECRET=your-session-secret
REPL_ID=your-repl-id
REPLIT_DOMAINS=your-domain.replit.dev
```

## Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components and routes
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions and configurations
├── server/                 # Express backend application
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
│   ├── db.ts              # Database connection
│   └── replitAuth.ts      # Authentication setup
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema definitions
└── README.md              # Project documentation
```

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Initiate login flow
- `GET /api/logout` - Logout user

### Insurance Data & Quote Aggregation
- `GET /api/insurance-types` - List all coverage types
- `GET /api/providers` - List insurance providers
- `GET /api/quotes/search` - **Public endpoint** - Multi-tenant quote search with real-time provider aggregation (no authentication required)
- `GET /api/quotes/:id` - Get specific quote details
- `WS /ws/quotes` - WebSocket endpoint for real-time quote updates

#### Quote Search Authentication Details
The `/api/quotes/search` endpoint is **publicly accessible** and does not require user authentication. However, it provides enhanced functionality for authenticated users:

- **Anonymous users**: Can access basic quote search and provider aggregation
- **Authenticated users**: Receive enhanced results with organization-specific provider configurations, priorities, and commission rates
- **Multi-tenant aware**: Organization context automatically applied when user is logged in
- **Graceful fallback**: Functions normally for unauthenticated requests without organization-specific features

### Provider Management (SuperAdmin Only)
- `GET /api/admin/provider-configs` - List all provider configurations with statistics
- `PUT /api/admin/provider-configs/:id` - Update provider configuration settings
- `POST /api/admin/provider-configs/:id/test` - Test provider API connectivity
- `GET /api/admin/provider-stats` - Get comprehensive provider performance statistics
- `GET /api/admin/external-quote-requests` - List external quote request logs with filtering

### User Management
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Claims and Policies
- `GET /api/claims` - User claims
- `POST /api/claims` - Create claim
- `GET /api/policies` - User policies
- `POST /api/policies` - Create policy

## Deployment

The application is designed for deployment on Replit with automatic scaling and built-in database hosting. The platform handles:

- Automatic SSL/TLS certificates
- Environment variable management
- Database provisioning and backups
- CDN and static asset delivery

## Contributing

1. Follow the established code style and patterns
2. Ensure type safety with TypeScript
3. Write comprehensive tests for new features
4. Update documentation for API changes
5. Follow the existing database schema patterns

## User Preferences

- Communication style: Simple, everyday language
- Focus on user-friendly interfaces and clear navigation
- Maintain consistent branding and terminology throughout

## License

This project is proprietary software developed for JustAskShel insurance marketplace platform.

---

*Last updated: September 2025*
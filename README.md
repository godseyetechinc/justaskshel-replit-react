# JustAskShel - Insurance Marketplace Platform

JustAskShel is a comprehensive insurance comparison and management platform that helps users find, compare, and manage insurance policies across multiple types including life, health, dental, vision, and hospital indemnity insurance. The platform provides quote comparison tools, policy management dashboards, claims assistance, and wishlist functionality to streamline the insurance shopping and management experience.

## Recent Updates (August 2025)
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

### User Roles
- **Admin**: Full system access and user management
- **Agent**: Access to client management and policy tools
- **Member**: Standard user access to quotes and policies
- **Visitor**: Limited access to public information

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
- Users, insurance types, providers, quotes, policies
- Claims management with document storage
- Dependents, wishlists, and loyalty points
- Contact management and applicant tracking
- Proper relationships and indexing

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

### Insurance Data
- `GET /api/insurance-types` - List all coverage types
- `GET /api/providers` - List insurance providers
- `GET /api/quotes` - Get and create quotes

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

*Last updated: August 2025*
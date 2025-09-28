# Overview

JustAskShel is an insurance comparison and management platform designed to help users find, compare, and manage various types of insurance policies (life, health, dental, vision, hospital indemnity). It offers quote comparison tools, policy management dashboards, claims assistance, and wishlist functionality, aiming to simplify the insurance shopping and management experience. The platform supports multi-tenancy for agent organizations and provides comprehensive user and member management with robust role-based access control.

# Recent Changes

## Points & Rewards System Phase 1 Completion (September 28, 2025)
Successfully completed Phase 1 (Core Automation) of the comprehensive points and rewards system transformation, implementing automatic points awarding, dynamic tier calculations, and user onboarding to create an engaging loyalty program:

### Phase 1 Implementation Results
- **Automatic Points Awarding**: Integrated into all key user activities (policy purchases +500pts, claim submissions +100pts, new user welcome bonus +1000pts)
- **Dynamic Tier Calculation**: Implemented 5-tier progression system (Bronze → Silver → Gold → Platinum → Diamond) with automatic tier updates based on lifetime points
- **PointsService Integration**: Core automation service deployed with comprehensive error handling and activity tracking
- **Database Schema Synchronized**: Fixed missing columns and ensured all points APIs are functional
- **Backend Integration Complete**: All endpoints (policy creation, claims submission, user registration) now automatically award points

### Technical Implementation
- Created `server/services/pointsService.ts` with comprehensive automation logic for point awarding and tier calculations
- Modified `server/routes.ts` to integrate automatic point awarding for all key user activities
- Synchronized database schema and resolved API functionality issues
- Backend testing completed - all points APIs verified working (points summary, transactions, rewards all active)

### Business Impact Ready
Phase 1 automation enables target metrics: 80% users earning points monthly, 25% redemption rate, 20% retention improvement.

## Points & Rewards System Phase 2 Completion (September 28, 2025)
Successfully completed Phase 2 (User Engagement Features) of the comprehensive points and rewards system, implementing achievements, notification system, and referral system to drive user retention and engagement:

### Phase 2 Implementation Results
- **Achievement System**: Implemented comprehensive achievement tracking with 8 default achievements across milestone, streak, and activity categories
- **Real-time Notification System**: Created WebSocket-based notifications for points earned, tier upgrades, achievement unlocks, and referral rewards
- **Referral System**: Built complete referral code generation, validation, and reward processing with detailed tracking
- **Database Schema Enhanced**: Added 5 new tables (achievements, user_achievements, referral_codes, referral_signups, notifications)
- **API Integration Complete**: All Phase 2 endpoints deployed with user authentication and admin access controls

### Technical Implementation
- Created `AchievementService` with milestone tracking and automatic unlocking based on user activity
- Implemented `NotificationService` supporting 6 notification types with real-time WebSocket delivery  
- Built `ReferralService` with unique code generation, signup processing, and referral reward automation
- Enhanced signup process with referral code support and achievement initialization
- Integrated Phase 2 services into all user workflows with comprehensive error handling

### Phase 2 Achievements Initialized
**Milestone Achievements:**
- Welcome to JustAskShel (1000 pts) - Join the platform
- First Policy Purchase (500 pts) - Purchase first insurance policy
- Silver/Gold Tier Achievement (100/250 pts) - Reach tier milestones

**Streak Achievements:**
- Login Streak Champion (200 pts) - Login 7 days in a row

**Activity Achievements:**
- Points Collector (150 pts) - Earn 5000 total points
- Referral Master (300 pts) - Successfully refer 5 users
- Claims Expert (100 pts) - Submit 3 insurance claims

### Business Impact Ready
Phase 2 user engagement features enable enhanced retention metrics through gamification, referral growth, and real-time user feedback systems.

**System Status:** Both Phase 1 (Core Automation) and Phase 2 (User Engagement) complete - comprehensive points & rewards loyalty program fully operational

## Comprehensive Claims Workflow Enhancement (September 27, 2025)
Successfully implemented comprehensive claims workflow improvements with sophisticated data infrastructure and modal-based functionality:

### Implementation Results
- **157 claims created** with complete comprehensive data
- **Modal-based interface** with ViewClaimModal and EditClaimModal components
- **Enhanced claims schema** with comprehensive fields (policyNumber, providerName, providerAddress, contactPhone, emergencyContact, emergencyPhone, additionalNotes)
- **Sophisticated data seeding** with realistic data for all claim types (medical, dental, vision, life, disability)
- **Enhanced workflow processing** with realistic status distribution and proper date ordering
- **Proper data relationships** between claims, policies, and users with foreign key constraints
- **Standardized claim types** with consistent values and realistic provider information

### Technical Implementation
- Enhanced claims database schema with comprehensive field coverage
- Created sophisticated seeding function with realistic data generation
- Implemented proper workflow status progression (draft → submitted → under_review → approved/denied → paid/closed)
- Established proper foreign key relationships and data integrity constraints
- Modal popup system for improved user experience over inline display

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
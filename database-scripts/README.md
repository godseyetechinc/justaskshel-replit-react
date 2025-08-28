# JustAskShel Database Scripts

This directory contains comprehensive SQL scripts for managing the JustAskShel Insurance Platform database schema and data.

## Overview

The JustAskShel platform uses a PostgreSQL database with a comprehensive schema supporting multi-tenant insurance operations, including user management, policy administration, claims processing, and loyalty programs.

## File Structure

```
database-scripts/
└── sql/
    ├── 01_create_schema.sql    # Complete database schema creation
    ├── 02_seed_data.sql        # Initial data population
    ├── 03_drop_schema.sql      # Complete schema removal
    └── 04_utility_queries.sql  # Monitoring and maintenance queries
```

## Database Architecture

### Core Components

- **Multi-Tenant Architecture**: Support for multiple insurance organizations
- **Role-Based Access Control**: 6-tier privilege system (SuperAdmin to Visitor)
- **Comprehensive Insurance Management**: Quotes, policies, claims, and applications
- **External Provider Integration**: Real-time quote aggregation from multiple providers
- **Loyalty & Rewards System**: Points, tiers, and redemption management
- **Advanced Claims Processing**: Document management and workflow tracking

### Key Tables

| Category | Tables | Purpose |
|----------|--------|---------|
| **Authentication** | sessions, users, roles | User management and session handling |
| **Organizations** | agent_organizations | Multi-tenant organization structure |
| **Insurance Core** | insurance_types, insurance_providers | Coverage types and provider data |
| **Quotes & Policies** | insurance_quotes, policies, selected_quotes | Quote management and policy tracking |
| **External Integration** | external_quote_requests | API quote request tracking |
| **Claims** | claims, claim_documents, claim_communications | Claims processing and documentation |
| **Members** | members, contacts, dependents | Customer and relationship management |
| **Applications** | applications, applicants, applicant_dependents | Insurance application processing |
| **Loyalty Program** | points_transactions, rewards, points_summary | Customer loyalty and rewards |

## Usage Instructions

### 1. Initial Database Setup

Create a fresh database with complete schema and seed data:

```bash
# Step 1: Create all tables and indexes
psql -d your_database -f sql/01_create_schema.sql

# Step 2: Populate with initial data
psql -d your_database -f sql/02_seed_data.sql
```

### 2. Database Reset

Complete database cleanup and recreation:

```bash
# Step 1: Drop all existing tables and data (DESTRUCTIVE!)
psql -d your_database -f sql/03_drop_schema.sql

# Step 2: Recreate schema
psql -d your_database -f sql/01_create_schema.sql

# Step 3: Repopulate with seed data
psql -d your_database -f sql/02_seed_data.sql
```

### 3. Monitoring and Maintenance

Run analytics and maintenance queries:

```bash
# Execute utility queries for monitoring
psql -d your_database -f sql/04_utility_queries.sql
```

## Initial Data Included

### Organizations
- **Demo Insurance Agency** (Professional plan, 15 agents, 500 members)
- **ABC Insurance Group** (Enterprise plan, 25 agents, 1000 members)
- **QuickQuote Insurance** (Basic plan, 10 agents, 250 members)

### Users
- **1 SuperAdmin**: Cross-tenant system administrator
- **3 TenantAdmins**: One per organization
- **5 Agents**: Distributed across organizations
- **5 Members**: Sample customer accounts

### System Data
- **6 Insurance Types**: Life, Health, Dental, Vision, Hospital Indemnity, Discount Plans
- **15 Insurance Providers**: Major insurance companies with ratings
- **Sample Quotes**: Various coverage types and amounts
- **Active Policies**: Live policies with payment schedules
- **Sample Claims**: Different claim types and statuses
- **Loyalty System**: Points rules, rewards catalog, and member balances

## Security Features

- **Password Hashing**: All passwords use bcrypt encryption
- **Role-Based Permissions**: Detailed JSON permission structures
- **Multi-Tenant Isolation**: Organization-based data segregation
- **Secure Session Management**: PostgreSQL-backed session storage

## Performance Optimizations

- **Strategic Indexing**: Optimized indexes on frequently queried columns
- **Foreign Key Relationships**: Proper referential integrity
- **Query Optimization**: Efficient table structures for common operations
- **Connection Pooling**: Ready for connection pool configurations

## Environment Integration

These scripts are designed to work with:

- **Production Environment**: Neon PostgreSQL serverless database
- **Development Environment**: Local PostgreSQL installations
- **Testing Environment**: Isolated test database instances

## Backup and Recovery

The utility queries include:
- **Data integrity checks**
- **Backup verification queries**
- **Orphaned record identification**
- **Performance monitoring**

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure database user has CREATE, INSERT, UPDATE, DELETE permissions
2. **Foreign Key Violations**: Run scripts in the specified order
3. **Sequence Conflicts**: Seed data script includes sequence reset commands
4. **Missing Extensions**: pgcrypto extension required for UUID generation

### Verification Queries

After setup, verify installation:

```sql
-- Check table creation
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Verify seed data
SELECT 'users' as table_name, count(*) as records FROM users
UNION ALL
SELECT 'policies', count(*) FROM policies
UNION ALL  
SELECT 'claims', count(*) FROM claims;
```

## Development Notes

- Scripts are compatible with PostgreSQL 12+
- All timestamps use UTC timezone
- JSON columns use JSONB for performance
- Sequences are properly managed to avoid conflicts

## Support

For issues or questions regarding the database schema:

1. Check the utility queries for diagnostic information
2. Verify all scripts ran successfully in order
3. Review PostgreSQL logs for specific error messages
4. Ensure proper database permissions and connectivity

---

**⚠️ Important**: Always backup your database before running drop or modification scripts. The `03_drop_schema.sql` script permanently removes all data.
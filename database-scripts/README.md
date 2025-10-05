# JustAskShel Database Scripts

This directory contains organized SQL scripts for managing the JustAskShel database schema, seeding data, and database operations.

## Directory Structure

```
database-scripts/
├── README.md                  # This documentation
├── run_scripts.sh            # Master execution script
├── schema/                   # Schema lifecycle scripts
│   ├── 00_init.sql          # Database initialization
│   ├── 01_create_schema.sql # Complete schema creation
│   └── 99_drop_schema.sql   # Schema cleanup (DESTRUCTIVE)
├── tables/                   # Table DDL scripts
│   ├── 10_create_core_tables.sql        # Core authentication tables
│   ├── 20_create_insurance_tables.sql   # Insurance domain tables
│   ├── 30_create_policy_claims_tables.sql # Policies and claims
│   ├── 40_create_association_tables.sql # Member/contact associations
│   └── 90_drop_all_tables.sql          # Drop all tables (DESTRUCTIVE)
├── seed/                     # Data seeding scripts
│   ├── 10_base_seed.sql     # Essential reference data
│   ├── 20_test_accounts_seed.sql # Test user accounts
│   └── 30_sample_data_seed.sql   # Sample policies and claims
└── objects/                  # Database objects (indexes, views, etc.)
    └── 10_create_indexes.sql # Performance indexes
```

## Execution Order

Scripts are numbered to ensure correct execution order:

1. **Schema (00-09)**: Database initialization and schema creation
2. **Tables (10-49)**: Table creation in dependency order
3. **Objects (10-19)**: Indexes, views, triggers, constraints
4. **Seed (10-39)**: Data seeding in logical order
5. **Drop (90-99)**: Cleanup scripts (executed in reverse order)

## Usage

### Using the Master Script (Recommended)

The `run_scripts.sh` provides a safe, automated way to execute scripts:

```bash
# Create complete database with data
./run_scripts.sh development create

# Drop all database objects (DESTRUCTIVE)
./run_scripts.sh development drop

# Show help
./run_scripts.sh help
```

## Test Accounts

The scripts create these test accounts for development:

| Email | Password | Role | Privilege Level |
|-------|----------|------|----------------|
| superadmin@justaskshel.com | password123 | SuperAdmin | 0 |
| admin1@justaskshel.com | password123 | TenantAdmin | 1 |
| agent1@justaskshel.com | password123 | Agent | 2 |
| member1@justaskshel.com | password123 | Member | 3 |

## Safety Features

- **Idempotent Scripts**: All scripts can be run multiple times safely
- **Transaction Wrapping**: Critical operations are wrapped in transactions
- **Confirmation Prompts**: Destructive operations require explicit confirmation
- **Environment Checks**: Production operations require additional confirmation
- **Dependency Validation**: Scripts verify prerequisites before execution

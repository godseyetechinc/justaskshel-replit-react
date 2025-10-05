# JustAskShel Database Scripts

This directory contains organized SQL scripts for managing the JustAskShel database schema, seeding data, and database operations.

## Directory Structure

```
database-scripts/
├── README.md                       # This documentation
├── COMPLETE_SCHEMA_EXPORT.sql     # Complete database schema export (all tables)
├── DROP_ALL_TABLES.sql            # Drop all tables in correct order (DESTRUCTIVE)
├── run_scripts.sh                 # Master execution script
├── schema/                        # Schema lifecycle scripts
│   ├── 00_init.sql               # Database initialization
│   ├── 01_create_schema.sql      # Complete schema creation
│   └── 99_drop_schema.sql        # Schema cleanup (DESTRUCTIVE)
├── tables/                        # Table DDL scripts
│   ├── 10_create_core_tables.sql             # Core authentication tables
│   ├── 15_create_authentication_tables.sql   # Phase 2 auth enhancements (NEW)
│   ├── 20_create_insurance_tables.sql        # Insurance domain tables
│   ├── 30_create_policy_claims_tables.sql    # Policies and claims
│   ├── 40_create_association_tables.sql      # Member/contact associations
│   └── 90_drop_all_tables.sql               # Drop all tables (DESTRUCTIVE)
├── seed/                          # Data seeding scripts
│   ├── 01_seed_core_data.sql     # Core organizations and roles
│   ├── 02_seed_insurance_data.sql # Insurance types and providers
│   ├── 03_seed_points_data.sql   # Points, achievements, rewards
│   ├── 04_seed_sample_users.sql  # Sample user accounts
│   ├── 05_seed_mfa_config.sql    # MFA default configuration (NEW)
│   ├── 10_base_seed.sql          # Essential reference data
│   ├── 20_test_accounts_seed.sql # Test user accounts
│   └── 30_sample_data_seed.sql   # Sample policies and claims
└── objects/                       # Database objects (indexes, views, etc.)
    └── 10_create_indexes.sql     # Performance indexes (includes Phase 2)
```

## Execution Order

Scripts are numbered to ensure correct execution order:

1. **Schema (00-09)**: Database initialization and schema creation
2. **Tables (10-49)**: Table creation in dependency order
   - 10: Core tables (users, organizations, sessions)
   - 15: Authentication enhancements (Phase 2: MFA, lockouts, password reset)
   - 20: Insurance domain tables
   - 30: Policies and claims
   - 40: Association and relationship tables
3. **Objects (10-19)**: Indexes, views, triggers, constraints
4. **Seed (01-39)**: Data seeding in logical order
   - 01-05: Core system data (organizations, roles, MFA config)
   - 10-39: Sample and test data
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

## Phase 2 Authentication Enhancements (October 2025)

The following new tables and features were added for enhanced security:

### New Tables
- **account_lockouts**: Tracks failed login attempts and lockout status
- **password_reset_tokens**: Crypto-secure password reset tokens
- **mfa_settings**: User MFA/2FA configuration (TOTP, backup codes)
- **mfa_verification_attempts**: Audit trail of MFA verifications
- **login_history**: Comprehensive login activity tracking
- **mfa_config**: System-wide MFA enforcement configuration
- **organization_access_requests**: User requests to join organizations

### New Scripts
- `tables/15_create_authentication_tables.sql`: Creates all Phase 2 auth tables
- `seed/05_seed_mfa_config.sql`: Initializes MFA configuration with defaults
- Updated `objects/10_create_indexes.sql`: Added indexes for Phase 2 tables
- Updated `COMPLETE_SCHEMA_EXPORT.sql`: Full schema with Phase 2 tables
- Updated `DROP_ALL_TABLES.sql`: Includes Phase 2 tables in drop order

### Features
- Account lockout after 5 failed login attempts (15-minute duration)
- Crypto-secure password reset with 1-hour token expiration
- TOTP-based MFA with authenticator apps
- 8 backup recovery codes per user
- Complete login history with IP, device, browser tracking
- Configurable MFA enforcement modes (disabled, optional, required_admins, required_all)

## Safety Features

- **Idempotent Scripts**: All scripts can be run multiple times safely
- **Transaction Wrapping**: Critical operations are wrapped in transactions
- **Confirmation Prompts**: Destructive operations require explicit confirmation
- **Environment Checks**: Production operations require additional confirmation
- **Dependency Validation**: Scripts verify prerequisites before execution
- **Proper Drop Order**: Tables dropped in reverse dependency order to avoid foreign key errors

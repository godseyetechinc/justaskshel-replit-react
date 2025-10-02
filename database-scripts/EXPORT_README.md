# JustAskShel Database SQL Export Scripts

**Last Updated:** October 2, 2025  
**Database:** PostgreSQL 15+  
**Total Tables:** 66  
**Schema Version:** 2.0 (includes Agent-Policy Relationship Enhancement)

## 📂 Directory Structure

```
database-scripts/
├── COMPLETE_SCHEMA_EXPORT.sql    # Complete database schema (all 66 tables)
├── DROP_ALL_TABLES.sql           # Safely drops all tables
├── EXPORT_README.md              # This file
├── schema/
│   ├── 00_init.sql              # Database initialization
│   ├── 01_create_schema.sql     # Schema creation (original)
│   └── 99_drop_schema.sql       # Schema drop
├── tables/
│   ├── create/                  # Table creation scripts
│   ├── drop/                    # Table drop scripts
│   ├── 10_create_core_tables.sql
│   ├── 20_create_insurance_tables.sql
│   ├── 30_create_policy_claims_tables.sql
│   └── 40_create_association_tables.sql
├── seed/
│   ├── 01_seed_core_data.sql
│   ├── 02_seed_insurance_data.sql
│   ├── 03_seed_points_data.sql
│   ├── 04_seed_sample_users.sql
│   ├── 10_base_seed.sql
│   ├── 20_test_accounts_seed.sql
│   └── 30_sample_data_seed.sql
├── objects/
│   └── 10_create_indexes.sql
└── maintenance/
    ├── backup.sql
    └── cleanup.sql
```

## 🚀 Quick Start

### Complete Database Setup
```bash
# 1. Create fresh database with complete schema
psql -U postgres -d justaskshel -f COMPLETE_SCHEMA_EXPORT.sql

# 2. Seed with sample data (optional)
psql -U postgres -d justaskshel -f seed/10_base_seed.sql
psql -U postgres -d justaskshel -f seed/20_test_accounts_seed.sql
psql -U postgres -d justaskshel -f seed/30_sample_data_seed.sql
```

### Drop All Tables (DESTRUCTIVE)
```bash
# WARNING: This deletes ALL data
psql -U postgres -d justaskshel -f DROP_ALL_TABLES.sql
```

## 📊 Database Schema Overview

### Core Tables (Identity & Auth)
- **sessions** - Session storage for authentication
- **persons** - Central person identity table (single source of truth)
- **users** - User accounts with role-based authentication
- **roles** - Role definitions with privilege levels
- **agent_organizations** - Multi-tenant organization structure

### Insurance Domain Tables
- **insurance_types** - Life, health, dental, vision, etc.
- **insurance_providers** - Insurance companies
- **insurance_quotes** - Quote comparisons (internal & external)
- **external_quote_requests** - Real-time API quote tracking
- **policies** - User insurance policies
- **claims** - Insurance claims management

### Agent-Policy Relationship Tables (Phase 1-5 Completed)
- **client_assignments** (16 columns) - Agent-to-client assignments
- **policy_transfers** (9 columns) - Policy servicing agent reassignments
- **agent_commissions** (15 columns) - Commission tracking & payment
- **agent_profiles** - Agent directory & specializations
- **agent_performance** - Performance metrics & analytics
- **agent_collaborations** - Agent knowledge sharing
- **client_activities** - Client interaction history
- **organization_analytics** - Organization-wide metrics

### Points & Rewards System
- **points_transactions** - Points earning/redemption
- **points_summary** - User point balances & tiers
- **points_rules** - Earning rules configuration
- **rewards** - Redeemable rewards catalog
- **reward_redemptions** - Redemption tracking
- **achievements** - Achievement system
- **user_achievements** - User achievement unlocks

### Social & Engagement Features
- **friendships** - Friend connections
- **social_activities** - Activity feed
- **activity_likes** - Likes & reactions
- **activity_comments** - Comments system
- **social_referrals** - Social media referrals
- **referral_codes** - Referral program
- **leaderboard_rankings** - Competitive rankings

### Organization Features
- **organization_invitations** - Email invitations to join orgs
- **organization_knowledge_base** - Shared resources
- **members** - Organization members
- **contacts** - Lead & contact management

## 🔑 Key Indexes

### Performance-Critical Indexes
- **Users**: organization_id, role, privilege_level, org+privilege composite
- **Policies**: selling_agent_id, servicing_agent_id, organization_id
- **Commissions**: agent_id, policy_id, payment_status, payment_date
- **Transfers**: policy_id, from_agent_id, to_agent_id
- **Notifications**: user_id, type, is_read

## 📋 Table Counts by Category

| Category | Tables | Description |
|----------|--------|-------------|
| Core Identity & Auth | 5 | sessions, persons, users, roles, person_users |
| Organizations | 7 | agent_organizations, members, contacts, invitations, etc. |
| Insurance | 7 | types, providers, quotes, policies, claims, documents |
| Agent-Policy System | 8 | assignments, transfers, commissions, profiles, analytics |
| Points & Rewards | 11 | transactions, summary, rules, rewards, redemptions, etc. |
| Social Features | 10 | friendships, activities, comments, likes, referrals |
| Achievements | 6 | achievements, user achievements, seasonal, campaigns |
| Notifications & Misc | 12 | notifications, documents, payments, amendments |

**Total: 66 Tables**

## 🛠️ Maintenance Scripts

### Backup Database
```bash
pg_dump -U postgres justaskshel > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
psql -U postgres justaskshel < backup_20251002.sql
```

### Verify Schema
```sql
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: 66 tables
```

## 📝 Notes

### SuperAdmin Organization
- **Organization ID 0** is reserved for SuperAdmin (SYSTEM_PLATFORM)
- This is a system organization with is_system_organization=true
- SuperAdmins have global access across all organizations

### Privilege Levels
0. **SuperAdmin** - Global system access
1. **TenantAdmin** - Organization administrator
2. **Agent** - Insurance agent
3. **Member** - Organization member
4. **Guest** - Limited access user
5. **Visitor** - Public/minimal access

### Foreign Key Relationships
- All tables maintain proper referential integrity
- CASCADE deletes configured where appropriate
- Indexes on all foreign keys for performance

### Data Migration History
- **Phase 7 Completed (Oct 1, 2025)**: 127 policies backfilled with agent assignments
- 127 commission records created ($12,700 total estimated value)
- 100% policy coverage achieved (129/129 policies have agents)

## 🔒 Security Considerations

1. **Password Storage**: Passwords are hashed using bcrypt
2. **SSN Encryption**: SSN fields support encryption at application layer
3. **Session Security**: Session tokens in sessions table with expiry
4. **Role-Based Access**: Privilege levels enforce data access boundaries
5. **Multi-Tenancy**: Organization-level data isolation

## 📚 Related Documentation

- **Agent-Policy Enhancement Plan**: `docs/AGENT_POLICY_RELATIONSHIP_ENHANCEMENT_PLAN.md`
- **Login Flow Improvement Plan**: `docs/LOGIN_FLOW_IMPROVEMENT_PLAN.md`
- **Main README**: `README.md`
- **Schema Definitions**: `shared/schema.ts`

## ⚠️ Important Warnings

1. **DROP Scripts**: The DROP_ALL_TABLES.sql script is DESTRUCTIVE. Only use in development.
2. **Production Safety**: Never run drop scripts against production databases.
3. **Backup First**: Always backup before running major schema changes.
4. **Test Environment**: Test all scripts in development before production use.

---

**Generated by:** Drizzle Kit v0.x  
**For:** JustAskShel Insurance Platform  
**Database:** PostgreSQL 15+  
**Charset:** UTF8

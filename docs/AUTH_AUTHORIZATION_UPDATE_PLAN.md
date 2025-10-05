# Authentication & Authorization System Update Plan
**JustAskShel Insurance Platform**

**Document Version:** 4.0  
**Last Updated:** October 5, 2025  
**Status:** Phase 2 COMPLETE - All authentication enhancements implemented and operational

---

## Executive Summary

### ✅ Phase 1 Completion Summary (October 5, 2025)

**Achievements:**
- ✅ **Terminology Standardization:** Replaced all "LandlordAdmin" references with "TenantAdmin" across the entire codebase (13 files updated, 1 database record migrated, schema constraint updated)
- ✅ **Code Quality Improvement:** Replaced 70+ hardcoded privilege level checks with `ROLE_PRIVILEGE_LEVELS` constants for better maintainability and readability
- ✅ **Zero Breaking Changes:** All functionality preserved, application running successfully with no compilation errors
- ✅ **Database Migration:** Successfully updated database schema constraints and migrated existing user records

**Impact:**
- Self-documenting code: `privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin` vs `privilegeLevel === 0`
- Consistent professional terminology aligned with insurance industry standards
- Easier future maintenance if privilege system needs to evolve
- Better IDE support with autocomplete for role constants

**Next Steps:** Phase 2 API endpoints and frontend implementation

### ✅ Phase 2 COMPLETE - Authentication Enhancements (October 5, 2025)

**All Features Implemented & Operational:**

#### 1. Account Lockout System
- ✅ **Backend:** Automatic lockout after 5 failed login attempts for 15 minutes
- ✅ **Integration:** Integrated into `/api/auth/login` endpoint with IP/user agent tracking
- ✅ **Database:** `account_lockouts` table with automatic expiration handling
- ✅ **User Experience:** Clear error messages with lockout duration information

#### 2. Password Reset Functionality
- ✅ **Backend API:** 
  - `POST /api/auth/forgot-password` - Generate reset token with email
  - `POST /api/auth/reset-password` - Validate token and reset password
- ✅ **Security:** Crypto-secure tokens (`crypto.randomBytes(32)`), 1-hour expiration, one-time use
- ✅ **Frontend UI:**
  - `/forgot-password` - Email submission page with success confirmation
  - `/reset-password` - Token validation and password reset page
  - Link from login page for easy access
- ✅ **Database:** `password_reset_tokens` table with token tracking and usage prevention

#### 3. Multi-Factor Authentication (MFA/2FA)
- ✅ **Backend API:**
  - `POST /api/auth/mfa/setup` - Generate TOTP secret and QR code
  - `POST /api/auth/mfa/verify-setup` - Verify setup and enable MFA
  - `POST /api/auth/mfa/verify` - Verify MFA code during login
- ✅ **TOTP Implementation:** Using `otplib` with backup codes support (8 codes)
- ✅ **Login Integration:** Seamless MFA verification stage in authentication flow
- ✅ **Frontend UI:**
  - `/dashboard/mfa-setup` - Complete setup wizard with QR code display
  - MFA verification step in login flow with backup code support
  - Backup code management and display
- ✅ **Database:** `mfa_settings`, `mfa_verification_attempts`, `mfa_config` tables
- ✅ **Organization Handling:** Proper auto-assignment for SuperAdmin and single-org users post-MFA

#### 4. Login History Tracking
- ✅ **Backend API:** `GET /api/auth/login-history` - Retrieve user login attempts
- ✅ **Tracking:** Captures all login attempts (success/failure) with IP, user agent, timestamps
- ✅ **Frontend UI:** `/dashboard/login-history` - User-friendly dashboard showing:
  - Recent login activity with success/failure indicators
  - Device and browser information
  - IP addresses and timestamps
  - Security tips and recommendations
- ✅ **Database:** `login_history` table with comprehensive logging

#### 5. Storage Layer & Database Schema
- ✅ **6 New Tables:** All with proper indexes, constraints, and relationships
- ✅ **21 Storage Methods:** Complete CRUD operations for all Phase 2 features
- ✅ **Zero Breaking Changes:** All existing functionality preserved and operational

**Security Enhancements:**
- Cryptographically secure token generation for password resets
- TOTP-based MFA with industry-standard authenticator app support
- Comprehensive audit trail via login history tracking
- Rate limiting on authentication endpoints (⚠️ trust proxy configuration warning - see security notes)
- IP address and user agent tracking for suspicious activity detection
- Automatic account lockout to prevent brute force attacks

**Architecture Review:**
- ✅ Architect review completed with critical fixes implemented
- ✅ MFA login flow properly handles organization selection for all user types
- ✅ Session management secure with temporary session for MFA verification
- ✅ All API endpoints follow existing patterns and security best practices

**Known Security Notes:**
- ⚠️ **Trust Proxy Configuration:** Express rate-limit reports permissive trust proxy setting. This allows potential IP-based rate limiting bypass. For production deployment, configure trust proxy settings per Express documentation or disable if not behind a proxy.
- **Recommendation:** Review and configure `app.set('trust proxy', ...)` based on infrastructure setup before production deployment.

**Migration Notes:**
- ⚠️ **Database Push Workflow:** The `npm run db:push` command may require manual interaction due to unrelated table changes. All Phase 2 tables exist and are functional in the current database.
- **Workaround:** Phase 2 tables verified operational. For fresh deployments, tables can be created via SQL scripts or by resolving conflicts individually.

---

### System Overview

This document provides a detailed analysis of the current authentication and authorization implementation for JustAskShel, including recommendations for enhancement, security improvements, and system optimization. The platform currently implements a sophisticated two-stage authentication flow with multi-tenant architecture and comprehensive role-based access control (RBAC).

**Current System Status:**
- ✅ Two-stage authentication flow (credentials → organization selection)
- ✅ 6-tier role hierarchy (SuperAdmin to Visitor)
- ✅ Multi-tenant data isolation with SuperAdmin cross-organization access
- ✅ Organization access request workflow
- ✅ Session-based authentication with secure cookie management
- ✅ Points/rewards integration on successful login
- ✅ Rate limiting on API and authentication endpoints
- ✅ Base64-encoded organization ID obfuscation with salt

---

## Table of Contents

1. [Current Architecture Overview](#current-architecture-overview)
2. [Authentication System Analysis](#authentication-system-analysis)
3. [Authorization System Analysis](#authorization-system-analysis)
4. [Multi-Tenant Architecture Analysis](#multi-tenant-architecture-analysis)
5. [Access Request System Analysis](#access-request-system-analysis)
6. [Security Considerations](#security-considerations)
7. [Recommended Improvements](#recommended-improvements)
8. [Implementation Roadmap](#implementation-roadmap)

---

## 1. Current Architecture Overview

### 1.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Two-Stage Authentication                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 1: Credential Validation                               │
│ POST /api/auth/login                                         │
│                                                              │
│ Input:                                                       │
│  - email                                                     │
│  - password                                                  │
│                                                              │
│ Process:                                                     │
│  1. Find user by email                                       │
│  2. Validate password (bcrypt)                               │
│  3. Check account active status                              │
│  4. Create temporary session (no org set)                    │
│  5. Determine organization requirements                      │
│                                                              │
│ Output Scenarios:                                            │
│  A. SuperAdmin → Auto-assign org 0, redirect to dashboard    │
│  B. Single org user → Auto-assign org, redirect to dashboard │
│  C. Multi-org user → Return available orgs for selection     │
│  D. No org access → Show access request option               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 2: Organization Selection (if required)                │
│ POST /api/auth/session/organization                          │
│                                                              │
│ Input:                                                       │
│  - organizationId (obfuscated)                               │
│                                                              │
│ Process:                                                     │
│  1. Validate user authentication                             │
│  2. Deobfuscate organizationId                               │
│  3. Verify organization access (except SuperAdmin)           │
│  4. Set organizationId in session                            │
│  5. Award daily login points                                 │
│                                                              │
│ Output:                                                      │
│  - Organization details                                      │
│  - Redirect to dashboard                                     │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Role Hierarchy

| Role | Privilege Level | Description | Access Scope |
|------|----------------|-------------|--------------|
| **SuperAdmin** | 0 | Platform administrator | All organizations, all data |
| **TenantAdmin** | 1 | Organization administrator | Own organization only |
| **Agent** | 2 | Insurance agent | Assigned clients & policies |
| **Member** | 3 | Standard user/client | Own data only |
| **Guest** | 4 | Limited access user | Restricted features |
| **Visitor** | 5 | Unauthenticated user | Public content only |

### 1.3 Key Components

**Backend Components:**
- `server/routes.ts`: Authentication endpoints and middleware
- `server/storage.ts`: User and organization data access
- `shared/schema.ts`: Database schema with role definitions

**Frontend Components:**
- `client/src/hooks/useAuth.ts`: Authentication state management
- `client/src/hooks/useRoleAuth.ts`: Role-based permission checks
- `client/src/pages/dashboard/access-requests.tsx`: Access request UI

**Database Tables:**
- `users`: User accounts with role and organization assignments
- `roles`: Role definitions with privilege levels and permissions
- `agent_organizations`: Organization/tenant definitions
- `organization_access_requests`: Access request workflow tracking
- `sessions`: Secure session storage (PostgreSQL-backed)

---

## 2. Authentication System Analysis

### 2.1 Current Implementation Strengths

#### ✅ Two-Stage Authentication Flow
**Location:** `server/routes.ts` lines 248-408

**Strengths:**
- Clean separation between credential validation and organization selection
- Supports multiple organization memberships per user
- Graceful handling of edge cases (SuperAdmin, single org, no access)
- Proper session regeneration for security

**Implementation Details:**
```typescript
// Stage 1: Credential validation only (no org required)
app.post("/api/auth/login", async (req, res) => {
  // 1. Validate credentials
  // 2. Check account status
  // 3. Create temporary session
  // 4. Determine org requirements
  // 5. Return appropriate response
});

// Stage 2: Organization selection
app.post("/api/auth/session/organization", auth, async (req, res) => {
  // 1. Validate authentication
  // 2. Verify organization access
  // 3. Set organization in session
  // 4. Award points and redirect
});
```

#### ✅ Password Security
**Implementation:**
- bcrypt hashing with secure defaults
- Password never exposed in responses
- Separate handling for OAuth vs password users

#### ✅ Session Management
**Technology:** `connect-pg-simple` with PostgreSQL
**Features:**
- Server-side session storage (secure)
- Session regeneration on login (prevents fixation)
- Proper session cleanup on logout
- HTTPOnly cookies (prevents XSS)

#### ✅ Points Integration
**Location:** `server/routes.ts` lines 214-219, 322-326, 347-352

**Implementation:**
- Daily login points automatically awarded
- Non-blocking (doesn't fail auth on points error)
- Integrated into both auto-assign and manual org selection flows

### 2.2 Identified Issues & Risks

#### ✅ VERIFIED: Session Security Configuration

**Status:** IMPLEMENTED
**Location:** `server/replitAuth.ts` lines 25-46

**Current Implementation:**
```typescript
export function createSessionConfig(databaseUrl: string) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: databaseUrl,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true, // ✅ Prevents XSS
      secure: process.env.NODE_ENV === 'production', // ✅ HTTPS in prod
      sameSite: 'lax', // ✅ CSRF protection (allows navigation)
      maxAge: sessionTtl, // ✅ 1 week expiry
    },
  });
}
```

**Assessment:** 
- ✅ Session stored in PostgreSQL (secure server-side storage)
- ✅ HTTPOnly cookies prevent XSS attacks
- ✅ Secure flag enabled in production (HTTPS only)
- ✅ SameSite 'lax' provides CSRF protection while allowing normal navigation
- ⚠️ Could consider changing `sameSite: 'lax'` to `'strict'` for maximum security (trade-off: UX impact)
- ⚠️ Could consider adding `rolling: true` to refresh session on activity

**Recommendation:** Minor optimization only
```typescript
// Optional enhancement:
cookie: {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict', // Maximum CSRF protection (evaluate UX impact)
  maxAge: sessionTtl,
},
rolling: true, // Refresh session expiry on each request
```

#### 🟡 MEDIUM: Incomplete Password Validation

**Issue:** Password strength not validated on login
**Location:** `server/routes.ts` line 252-276
**Risk Level:** MEDIUM

**Current State:**
- Only checks if password exists
- No complexity requirements enforcement
- No password history check

**Recommendation:**
- Enforce password strength on signup/change
- Consider implementing password history
- Add account lockout after failed attempts

#### ✅ VERIFIED: Rate Limiting Implementation

**Status:** IMPLEMENTED
**Location:** `server/index.ts` lines 28-46

**Current Implementation:**
```typescript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many API requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
```

**Assessment:**
- ✅ General API rate limiting (100 req/15 min)
- ✅ Strict auth rate limiting (5 req/15 min)
- ✅ Standard headers for rate limit info
- ✅ Applied to both login and signup endpoints
- ⚠️ IP-based limiting may affect users behind NAT/proxies
- ⚠️ Could enhance with `skipSuccessfulRequests: true` on authLimiter

**Recommendation:** Minor optimization
```typescript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // Only count failed attempts
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

#### ✅ VERIFIED: Organization ID Obfuscation

**Status:** IMPLEMENTED  
**Location:** `server/routes.ts` lines 68-79

**Current Implementation:**
```typescript
function obfuscateOrgId(id: number): string {
  // Base64 encoding with salt
  const salted = `org_${id}_salt`;
  return Buffer.from(salted).toString("base64");
}

function deobfuscateOrgId(obfuscated: string): number | null {
  try {
    const decoded = Buffer.from(obfuscated, "base64").toString("utf8");
    const match = decoded.match(/^org_(\d+)_salt$/);
    return match ? parseInt(match[1]) : null;
  } catch (error) {
    return null;
  }
}
```

**Assessment:**
- ✅ Base64 encoding with salt pattern
- ✅ Validation pattern prevents arbitrary input
- ✅ Error handling for invalid input
- ⚠️ Base64 is encoding, not encryption (reversible)
- ⚠️ Salt is static, not per-organization

**Security Analysis:**
- Primary security comes from authorization checks, not obfuscation
- Obfuscation prevents casual URL manipulation
- Backend always validates organization access before allowing operations
- **Conclusion:** Adequate for current needs, as authorization is properly enforced

**Optional Enhancement (Low Priority):**
- Use JWT tokens with signature verification
- Or implement proper encryption with rotating keys
- Current approach is acceptable given strong authorization enforcement

#### 🟢 LOW: Error Message Information Disclosure

**Issue:** Different errors for "user not found" vs "wrong password"
**Location:** `server/routes.ts` line 259-261, 274-276
**Risk Level:** LOW

**Current State:**
```typescript
if (!user) {
  return res.status(401).json({ message: "Invalid email or password" });
}
// ... later ...
if (!isValidPassword) {
  return res.status(401).json({ message: "Invalid email or password" });
}
```

**Assessment:** ✅ **Already using generic error messages** - This is correct and secure.

### 2.3 Missing Features

#### 1. Multi-Factor Authentication (MFA)

**Priority:** HIGH  
**Complexity:** MEDIUM  
**Impact:** Significantly improves security

**Recommended Implementation:**
- TOTP-based (Time-based One-Time Password)
- SMS backup option
- Recovery codes for account recovery
- Optional for Member/Guest, required for Agent+

**Tables Needed:**
```sql
CREATE TABLE mfa_settings (
  user_id VARCHAR PRIMARY KEY REFERENCES users(id),
  mfa_enabled BOOLEAN DEFAULT false,
  totp_secret VARCHAR(255), -- Encrypted
  backup_codes JSONB, -- Array of hashed codes
  recovery_email VARCHAR(255),
  enabled_at TIMESTAMP,
  last_verified_at TIMESTAMP
);

CREATE TABLE mfa_verification_attempts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  attempt_type VARCHAR(20), -- 'totp', 'sms', 'recovery'
  success BOOLEAN,
  ip_address VARCHAR(45),
  user_agent TEXT,
  attempted_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Account Lockout Mechanism

**Priority:** MEDIUM  
**Complexity:** LOW  
**Impact:** Prevents brute force attacks

**Recommended Implementation:**
```typescript
// Add to users table
lockout_until: timestamp("lockout_until"),
failed_login_attempts: integer("failed_login_attempts").default(0),
last_failed_login: timestamp("last_failed_login")

// Login logic
if (user.lockout_until && user.lockout_until > new Date()) {
  return res.status(423).json({ 
    message: "Account temporarily locked. Try again later.",
    lockoutUntil: user.lockout_until 
  });
}

// After failed login
await storage.incrementFailedLoginAttempts(user.id);
if (user.failed_login_attempts >= 5) {
  await storage.lockoutUser(user.id, 30); // 30 minutes
}

// After successful login
await storage.resetFailedLoginAttempts(user.id);
```

#### 3. Login Activity Tracking

**Priority:** MEDIUM  
**Complexity:** LOW  
**Impact:** Audit trail and suspicious activity detection

**Tables Needed:**
```sql
CREATE TABLE login_history (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  login_type VARCHAR(20), -- 'password', 'oauth', 'mfa'
  ip_address VARCHAR(45),
  user_agent TEXT,
  location_country VARCHAR(2),
  location_city VARCHAR(100),
  organization_id INTEGER REFERENCES agent_organizations(id),
  success BOOLEAN,
  failure_reason VARCHAR(100),
  session_id VARCHAR(255),
  logged_in_at TIMESTAMP DEFAULT NOW(),
  logged_out_at TIMESTAMP
);
```

#### 4. Password Reset Flow

**Priority:** HIGH  
**Complexity:** MEDIUM  
**Impact:** Essential user experience feature

**Currently Missing:** No password reset endpoint observed

**Recommended Implementation:**
```typescript
// Request password reset
POST /api/auth/password-reset/request
{
  email: string
}

// Reset password with token
POST /api/auth/password-reset/confirm
{
  token: string,
  newPassword: string
}

// Table for reset tokens
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. Session Management UI

**Priority:** LOW  
**Complexity:** LOW  
**Impact:** Improved user security control

**Features:**
- View active sessions
- Revoke specific sessions
- "Log out all devices" option

---

## 3. Authorization System Analysis

### 3.1 Current Implementation Strengths

#### ✅ Comprehensive Role-Based Access Control
**Location:** `client/src/hooks/useRoleAuth.ts`

**Features:**
- 6-tier privilege system (0=highest, 5=lowest)
- Fine-grained permission checking
- Multiple helper functions for common checks
- SuperAdmin bypass for all permissions

**Available Checks:**
```typescript
// Role checks
hasRole(requiredRole: UserRole): boolean
hasAnyRole(requiredRoles: UserRole[]): boolean
hasMinimumPrivilegeLevel(requiredLevel: number): boolean

// Permission checks
canRead(resource: string, isOwn?: boolean): boolean
canWrite(resource: string, isOwn?: boolean): boolean
canDelete(resource: string, isOwn?: boolean): boolean
canManageUsers(): boolean
canManageSystem(): boolean
canManageRoles(): boolean
canViewAllData(): boolean

// Convenience flags
isSuperAdmin, isTenantAdmin, isAgent, isMember, isGuest, isVisitor
hasSuperAdminPrivileges, hasTenantAdminPrivileges, hasAgentPrivileges
```

#### ✅ Multi-Tenant Data Isolation
**Implementation:** Data scoping by organizationId

**Pattern:**
```typescript
// SuperAdmin can access all organizations
if (user.privilegeLevel === 0) {
  // Return all data
} else {
  // Filter by user.organizationId
}
```

### 3.2 Identified Issues & Risks

#### 🔴 CRITICAL: Inconsistent Backend Authorization

**Issue:** Backend endpoints have varying levels of authorization enforcement
**Risk Level:** HIGH

**Current State:**
- Some endpoints check privilege level explicitly
- Others rely on session organization filtering
- Inconsistent validation patterns

**Example - Good Authorization:**
```typescript
// server/routes.ts lines 541-553
app.get("/api/organizations/:orgId/access-requests", auth, async (req, res) => {
  // ✅ Checks privilege level
  if (user.privilegeLevel > 1) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  
  // ✅ TenantAdmin restricted to own org
  if (user.privilegeLevel === 1 && user.organizationId !== realOrgId) {
    return res.status(403).json({ 
      message: "You can only view requests for your own organization" 
    });
  }
});
```

**Example - Needs Improvement:**
```typescript
// Generic auth middleware (lines 187-194)
const auth = async (req: any, res: any, next: any) => {
  if (req.session && req.session.userId) {
    req.user = { claims: { sub: req.session.userId } };
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
// ⚠️ Only checks if user is logged in, not their permissions
```

**Recommendation:** Create role-specific middleware

```typescript
// server/middleware/authorization.ts
export const requireRole = (minPrivilegeLevel: number) => {
  return async (req: any, res: any, next: any) => {
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (user.privilegeLevel > minPrivilegeLevel) {
      return res.status(403).json({ 
        message: "Insufficient privileges",
        required: minPrivilegeLevel,
        actual: user.privilegeLevel
      });
    }
    
    req.user = user;
    next();
  };
};

export const requireOwnOrgOrSuperAdmin = async (req: any, res: any, next: any) => {
  const user = req.user;
  const orgId = req.params.orgId || req.body.organizationId;
  
  // SuperAdmin bypass
  if (user.privilegeLevel === 0) {
    return next();
  }
  
  // Check organization match
  if (user.organizationId !== deobfuscateOrgId(orgId)) {
    return res.status(403).json({ 
      message: "Access denied to this organization" 
    });
  }
  
  next();
};

// Usage:
app.get("/api/organizations/:orgId/access-requests", 
  auth,
  requireRole(1), // TenantAdmin or higher
  requireOwnOrgOrSuperAdmin,
  async (req, res) => {
    // Authorization already verified
  }
);
```

#### 🟡 MEDIUM: Resource-Level Permissions Not Fully Implemented

**Issue:** `canRead()`, `canWrite()`, `canDelete()` functions have placeholder logic
**Location:** `client/src/hooks/useRoleAuth.ts` lines 30-60
**Risk Level:** MEDIUM

**Current State:**
```typescript
const canRead = (resource: string, isOwn: boolean = false): boolean => {
  if (!isAuthenticated && resource !== "public_content" && resource !== "insurance_types") {
    return false;
  }
  if (privilegeLevel === 0) return true;
  
  // ⚠️ For now, allow basic access for authenticated users
  return true;
};

const canWrite = (resource: string, isOwn: boolean = false): boolean => {
  if (!isAuthenticated || !user) return false;
  if (privilegeLevel === 0) return true;
  
  // ⚠️ Allow write access based on privilege level
  return privilegeLevel <= 2; // TenantAdmin and Agent can write
};
```

**Recommendation:** Implement resource-specific permission matrix

```typescript
// shared/permissions.ts
export const RESOURCE_PERMISSIONS = {
  policies: {
    read: { minLevel: 3, ownOnly: true }, // Members can read own
    write: { minLevel: 2, ownOnly: false }, // Agents can write all
    delete: { minLevel: 1, ownOnly: false }, // TenantAdmin can delete
  },
  claims: {
    read: { minLevel: 3, ownOnly: true },
    write: { minLevel: 3, ownOnly: true },
    delete: { minLevel: 2, ownOnly: false },
  },
  users: {
    read: { minLevel: 1, ownOnly: false },
    write: { minLevel: 1, ownOnly: false },
    delete: { minLevel: 0, ownOnly: false }, // Only SuperAdmin
  },
  organizations: {
    read: { minLevel: 1, ownOnly: true },
    write: { minLevel: 0, ownOnly: false },
    delete: { minLevel: 0, ownOnly: false },
  },
  // ... more resources
};

// Enhanced permission check
const canWrite = (resource: string, isOwn: boolean = false): boolean => {
  if (!isAuthenticated || !user) return false;
  if (privilegeLevel === 0) return true; // SuperAdmin bypass
  
  const resourcePerms = RESOURCE_PERMISSIONS[resource];
  if (!resourcePerms) return false;
  
  const writePerms = resourcePerms.write;
  if (privilegeLevel > writePerms.minLevel) return false;
  
  // If resource requires ownership and user doesn't own it
  if (writePerms.ownOnly && !isOwn) return false;
  
  return true;
};
```

#### 🟡 MEDIUM: No Audit Trail for Authorization Failures

**Issue:** Failed authorization attempts not logged
**Risk Level:** MEDIUM

**Recommendation:**
```typescript
// Create authorization_audit table
CREATE TABLE authorization_audit (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  resource VARCHAR(100),
  action VARCHAR(20), -- 'read', 'write', 'delete'
  success BOOLEAN,
  reason VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  attempted_at TIMESTAMP DEFAULT NOW()
);

// Log authorization failures
const canWrite = (resource: string, isOwn: boolean = false): boolean => {
  const result = /* ... permission check logic ... */;
  
  if (!result) {
    logAuthorizationFailure({
      userId: user.id,
      resource,
      action: 'write',
      reason: 'Insufficient privileges'
    });
  }
  
  return result;
};
```

### 3.3 Missing Features

#### 1. Permission Inheritance & Overrides

**Priority:** LOW  
**Complexity:** MEDIUM  
**Impact:** More flexible authorization

**Concept:**
- Base permissions from role
- Organization-specific overrides
- User-specific exceptions

**Implementation:**
```sql
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id),
  resource VARCHAR(100),
  action VARCHAR(20),
  allowed BOOLEAN DEFAULT true
);

CREATE TABLE user_permission_overrides (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  resource VARCHAR(100),
  action VARCHAR(20),
  allowed BOOLEAN,
  granted_by VARCHAR REFERENCES users(id),
  reason TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Dynamic Role Assignment

**Priority:** LOW  
**Complexity:** HIGH  
**Impact:** Flexible team management

**Features:**
- Multiple roles per user
- Context-based role switching
- Temporary role elevation

---

## 4. Multi-Tenant Architecture Analysis

### 4.1 Current Implementation Strengths

#### ✅ SuperAdmin Default Organization (ID: 0)
**Design:** Special organization with platform-wide access

**Implementation:**
- Organization ID 0 reserved for SuperAdmin
- SuperAdmin auto-assigned to org 0 on login (line 317-339)
- Bypasses all organization restrictions

#### ✅ Data Scoping Pattern
**Pattern:** Filter data by organizationId with SuperAdmin bypass

**Common Implementation:**
```typescript
// Example pattern found throughout codebase
if (user.privilegeLevel === 0) {
  // SuperAdmin: Return all data
  return await storage.getAllData();
} else {
  // Others: Filter by organization
  return await storage.getDataByOrganization(user.organizationId);
}
```

#### ✅ Organization Access Validation
**Location:** Access request endpoints (lines 522-689)

**Features:**
- Users can request access to organizations
- TenantAdmin can approve/reject for their org
- SuperAdmin can approve/reject for any org
- Proper privilege checking

### 4.2 Identified Issues & Risks

#### 🟡 MEDIUM: Missing `resolveDataScope()` Helper

**Issue:** Data scoping logic duplicated across endpoints
**Risk Level:** MEDIUM

**Current State:**
- Each endpoint implements own organization filtering
- Code duplication increases maintenance burden
- Risk of inconsistent scoping implementation

**Recommendation:** Create centralized helper function

```typescript
// server/utils/dataScope.ts
export interface DataScopeOptions {
  user: any;
  organizationId?: number | null;
  allowCrossOrg?: boolean;
}

export function resolveDataScope(options: DataScopeOptions): {
  organizationId: number | null;
  canAccessAllOrgs: boolean;
} {
  const { user, organizationId, allowCrossOrg = false } = options;
  
  // SuperAdmin can access all organizations
  if (user.privilegeLevel === 0) {
    return {
      organizationId: organizationId ?? null,
      canAccessAllOrgs: true
    };
  }
  
  // TenantAdmin restricted to own organization
  if (user.privilegeLevel === 1) {
    // If requesting different org and not allowed
    if (organizationId && organizationId !== user.organizationId && !allowCrossOrg) {
      throw new Error('Access denied to this organization');
    }
    
    return {
      organizationId: user.organizationId,
      canAccessAllOrgs: false
    };
  }
  
  // Other roles: own organization only
  return {
    organizationId: user.organizationId,
    canAccessAllOrgs: false
  };
}

// Usage example:
app.get("/api/policies", auth, async (req, res) => {
  try {
    const { organizationId, canAccessAllOrgs } = resolveDataScope({ 
      user: req.user 
    });
    
    const policies = canAccessAllOrgs
      ? await storage.getAllPolicies()
      : await storage.getPoliciesByOrganization(organizationId);
    
    res.json(policies);
  } catch (error) {
    if (error.message === 'Access denied to this organization') {
      return res.status(403).json({ message: error.message });
    }
    throw error;
  }
});
```

#### 🟢 LOW: Organization Context Not Always in Session

**Issue:** Some operations may not have activeOrganizationId set
**Risk Level:** LOW

**Current State:**
- Session has both `organizationId` and `activeOrganizationId`
- Unclear when each is used
- Potential for inconsistency

**Recommendation:**
- Standardize on single property (`organizationId`)
- Remove `activeOrganizationId` unless serving specific purpose
- Document clearly if both needed

### 4.3 Missing Features

#### 1. Organization Switching for Multi-Org Users

**Priority:** MEDIUM  
**Complexity:** LOW  
**Impact:** Improved UX for multi-org users

**Currently:** Users must log out and back in to switch organizations

**Recommended Implementation:**
```typescript
POST /api/auth/session/switch-organization
{
  organizationId: string // obfuscated
}

// Verify user has access to org
// Update session organizationId
// Return new organization context
```

#### 2. Organization Invitation System

**Priority:** MEDIUM  
**Complexity:** MEDIUM  
**Impact:** Streamlined onboarding

**Currently:** Access request system requires approval before joining

**Recommended Addition:**
```sql
CREATE TABLE organization_invitations (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES agent_organizations(id),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50),
  invited_by VARCHAR REFERENCES users(id),
  invitation_token VARCHAR(255) UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, expired, revoked
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. Organization Hierarchy

**Priority:** LOW  
**Complexity:** HIGH  
**Impact:** Support for franchises/branch offices

**Features:**
- Parent/child organization relationships
- Inherited permissions
- Aggregated reporting

---

## 5. Access Request System Analysis

### 5.1 Current Implementation Strengths

#### ✅ Complete Workflow
**Endpoints:**
- `POST /api/organizations/access-requests` - Create request
- `GET /api/organizations/:orgId/access-requests` - List requests
- `PUT /api/organizations/access-requests/:id/approve` - Approve
- `PUT /api/organizations/access-requests/:id/reject` - Reject

#### ✅ Proper Privilege Validation
**Implementation:**
- Only authenticated users can create requests
- Only TenantAdmin+ can view/approve/reject
- TenantAdmin limited to own organization
- SuperAdmin can access all organizations

#### ✅ User Profile Update on Approval
**Location:** `server/routes.ts` lines 622-629

**Process:**
1. Approve access request
2. Update user's `organizationId`
3. Assign requested role (or default "Member")
4. Update `privilegeLevel` based on role

### 5.2 Identified Issues & Risks

#### 🟡 MEDIUM: No Notification System

**Issue:** Users not notified when requests approved/rejected
**Risk Level:** MEDIUM
**Impact:** Poor user experience

**Recommendation:**
```typescript
// After approval
await notificationService.sendAccessRequestApproved({
  userId: request.userId,
  organizationName: org.displayName,
  role: request.desiredRole || 'Member'
});

// After rejection
await notificationService.sendAccessRequestRejected({
  userId: request.userId,
  organizationName: org.displayName,
  reason: reviewNotes
});
```

#### 🟡 MEDIUM: No Expiration on Pending Requests

**Issue:** Requests can sit in pending state indefinitely
**Risk Level:** LOW-MEDIUM

**Recommendation:**
```typescript
// Add expiration field
access_requests.expires_at = timestamp("expires_at")
  .default(sql`NOW() + INTERVAL '30 days'`);

// Background job to auto-expire old requests
async function expireOldRequests() {
  await storage.db.update(organizationAccessRequests)
    .set({ 
      status: 'expired',
      reviewedAt: new Date()
    })
    .where(
      and(
        eq(organizationAccessRequests.status, 'pending'),
        lt(organizationAccessRequests.expiresAt, new Date())
      )
    );
}
```

#### 🟢 LOW: Duplicate Request Prevention Only Checks Pending

**Issue:** Users can spam requests after rejection
**Location:** `server/routes.ts` lines 490-499
**Risk Level:** LOW

**Current State:**
```typescript
const pendingRequest = existingRequests.find(
  (req) => req.organizationId === realOrgId && req.status === "pending"
);
```

**Recommendation:**
```typescript
// Check for recent rejected requests too
const recentRequest = existingRequests.find(
  (req) => 
    req.organizationId === realOrgId && 
    (
      req.status === "pending" ||
      (req.status === "rejected" && 
       req.reviewedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 days
    )
);

if (recentRequest) {
  if (recentRequest.status === 'pending') {
    return res.status(409).json({
      message: "You already have a pending request for this organization"
    });
  } else {
    return res.status(429).json({
      message: "Please wait 7 days before resubmitting a request to this organization",
      canReapplyAt: new Date(recentRequest.reviewedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    });
  }
}
```

### 5.3 Missing Features

#### 1. Request History for Users

**Priority:** LOW  
**Complexity:** LOW  
**Impact:** User transparency

**Endpoint:**
```typescript
GET /api/users/me/access-requests

// Returns user's request history across all organizations
```

#### 2. Batch Approval/Rejection

**Priority:** LOW  
**Complexity:** LOW  
**Impact:** Admin efficiency

**Endpoint:**
```typescript
POST /api/organizations/:orgId/access-requests/bulk-action
{
  action: 'approve' | 'reject',
  requestIds: number[],
  reviewNotes?: string
}
```

---

## 6. Security Considerations

### 6.1 Authentication Security

| Aspect | Current State | Recommendation | Priority |
|--------|--------------|----------------|----------|
| **Password Storage** | ✅ bcrypt hashing | Maintain current | N/A |
| **Session Storage** | ✅ PostgreSQL with secure cookies | ✅ Implemented correctly | N/A |
| **HTTPS Enforcement** | ✅ Enabled in production | Maintain current | N/A |
| **Rate Limiting** | ✅ Implemented (5/15min auth, 100/15min API) | Optional: Add skipSuccessfulRequests | LOW |
| **MFA** | ❌ Not implemented | Implement TOTP | HIGH |
| **Password Reset** | ❌ Not implemented | Add secure flow | HIGH |
| **Account Lockout** | ❌ Not implemented | Implement | MEDIUM |
| **Login History** | ❌ Not implemented | Add audit trail | MEDIUM |

### 6.2 Authorization Security

| Aspect | Current State | Recommendation | Priority |
|--------|--------------|----------------|----------|
| **Privilege Checking** | ⚠️ Inconsistent | Standardize middleware | HIGH |
| **Resource Permissions** | ⚠️ Placeholder logic | Implement matrix | MEDIUM |
| **Data Scoping** | ✅ Implemented | Add helper function | MEDIUM |
| **Audit Logging** | ❌ Not implemented | Log auth failures | MEDIUM |
| **CSRF Protection** | ✅ SameSite cookies | Maintain current | N/A |
| **XSS Prevention** | ✅ HTTPOnly cookies | Maintain current | N/A |

### 6.3 Multi-Tenant Security

| Aspect | Current State | Recommendation | Priority |
|--------|--------------|----------------|----------|
| **Data Isolation** | ✅ By organizationId | Maintain + test | HIGH |
| **SuperAdmin Access** | ✅ Proper bypass | Audit regularly | HIGH |
| **Cross-Org Access** | ✅ Prevented | Add audit logging | MEDIUM |
| **Org Switching** | ❌ Not implemented | Add with validation | MEDIUM |

### 6.4 Session Security Checklist

```typescript
// Recommended session configuration
{
  name: 'justaskshel.sid', // Custom name (don't use default)
  secret: process.env.SESSION_SECRET, // Strong secret from env
  resave: false,
  saveUninitialized: false,
  rolling: true, // Refresh expiry on activity
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    httpOnly: true, // Prevent XSS access
    sameSite: 'strict', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: process.env.COOKIE_DOMAIN, // Set appropriately
  },
  store: new PostgresStore({
    conObject: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    },
    tableName: 'sessions',
    pruneSessionInterval: 60 * 15, // Cleanup every 15 minutes
  })
}
```

---

## 7. Recommended Improvements

### 7.1 Phase 1: Critical Security (1-2 weeks)

#### Task 1.1: Enhance Rate Limiting (Optional)
**Priority:** LOW  
**Effort:** 0.5 day

**Note:** ✅ Rate limiting already implemented. This is optional enhancement only.

**Current State:**
- ✅ API rate limiting: 100 requests per 15 minutes
- ✅ Auth rate limiting: 5 attempts per 15 minutes
- ✅ Applied to /api/auth/login and /api/auth/signup

**Optional Enhancement:**
```typescript
// Add skipSuccessfulRequests to only count failed login attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // ← Add this
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

#### Task 1.2: Optimize Session Configuration (Optional)
**Priority:** LOW  
**Effort:** 0.5 day

**Note:** ✅ Session security already implemented correctly. This is optional optimization only.

**Current State:**
- ✅ PostgreSQL session storage
- ✅ HTTPOnly cookies (XSS protection)
- ✅ Secure flag in production (HTTPS only)
- ✅ SameSite 'lax' (CSRF protection)

**Optional Enhancements:**
1. Consider `sameSite: 'strict'` for maximum CSRF protection (evaluate UX impact)
2. Add `rolling: true` to refresh session on activity
3. Add session rotation on privilege escalation

#### Task 1.3: Implement Account Lockout
**Priority:** HIGH  
**Effort:** 2 days

**Actions:**
1. Add lockout fields to users table
2. Implement lockout logic in login endpoint
3. Create unlock mechanism (time-based + admin override)
4. Add notification on account lockout

#### Task 1.4: Add Authorization Middleware
**Priority:** CRITICAL  
**Effort:** 3 days

**Actions:**
1. Create `requireRole()` middleware
2. Create `requireOwnOrgOrSuperAdmin()` middleware
3. Refactor all endpoints to use new middleware
4. Write comprehensive tests

### 7.2 Phase 2: Essential Features (2-3 weeks)

#### Task 2.1: Implement Password Reset
**Priority:** HIGH  
**Effort:** 3 days

**Components:**
1. Password reset request endpoint
2. Reset token generation and storage
3. Email sending integration
4. Reset confirmation endpoint
5. Frontend UI flow

#### Task 2.2: Multi-Factor Authentication (MFA)
**Priority:** HIGH  
**Effort:** 5 days

**Components:**
1. TOTP secret generation
2. QR code generation for setup
3. MFA verification endpoint
4. Backup recovery codes
5. Frontend UI integration
6. Optional enforcement by role
7. Development deployment configuration
8. Runtime configuration system

**Development & Runtime Configuration:**

**Environment Variables:**
- `ENABLE_MFA` - Master toggle for MFA functionality (default: `true` in production, `false` in development)
- `MFA_ENFORCEMENT_MODE` - Controls enforcement level:
  - `disabled` - MFA completely disabled (development/testing)
  - `optional` - Users can enable MFA but not required (staging)
  - `required_admins` - Required for SuperAdmin/TenantAdmin only (default)
  - `required_all` - Required for all authenticated users (strict mode)
- `MFA_BYPASS_EMAILS` - Comma-separated list of emails exempt from MFA (for testing/emergency access)

**Development Deployment Strategy:**
1. **Default Disabled in Development**: MFA should be disabled by default when `NODE_ENV=development`
2. **Environment Detection**: Automatically detect environment and apply appropriate MFA settings
3. **Testing Mode**: Provide a testing mode with mock MFA codes for automated testing
4. **Feature Flag**: Implement feature flag that can be toggled without code deployment

**Implementation Considerations:**
- Create `server/config/mfa-config.ts` with environment-based configuration loading
- Add MFA status check in authentication middleware (skip if disabled)
- Frontend should detect MFA availability via `/api/auth/mfa/status` endpoint
- Hide MFA UI components when disabled
- Log MFA enforcement mode on server startup for visibility
- Provide admin override capability for emergency access

**Configuration Examples:**

Development (`.env.development`):
```
ENABLE_MFA=false
MFA_ENFORCEMENT_MODE=disabled
```

Staging (`.env.staging`):
```
ENABLE_MFA=true
MFA_ENFORCEMENT_MODE=optional
MFA_BYPASS_EMAILS=test@example.com,demo@example.com
```

Production (`.env.production`):
```
ENABLE_MFA=true
MFA_ENFORCEMENT_MODE=required_admins
# No bypass emails in production
```

**Testing Strategy:**
- Unit tests should run with MFA disabled by default
- Integration tests should have separate test suites for MFA enabled/disabled scenarios
- E2E tests should test both configurations
- Provide seed data with pre-configured MFA for testing enabled scenarios

#### Task 2.3: Login Activity Tracking
**Priority:** MEDIUM  
**Effort:** 2 days

**Components:**
1. Create login_history table
2. Log all login attempts (success/failure)
3. Capture IP, user agent, location
4. Create user-facing activity page
5. Email notifications on suspicious activity

#### Task 2.4: Resource Permission Matrix
**Priority:** MEDIUM  
**Effort:** 3 days

**Components:**
1. Define permission matrix in shared schema
2. Implement permission checking logic
3. Update `useRoleAuth` hook
4. Add backend validation
5. Write tests for all resources

### 7.3 Phase 3: Optimization & UX (1-2 weeks)

#### Task 3.1: Data Scope Helper Function
**Priority:** MEDIUM  
**Effort:** 2 days

**Actions:**
1. Implement `resolveDataScope()` helper
2. Refactor existing endpoints to use helper
3. Add comprehensive tests
4. Document usage patterns

#### Task 3.2: Organization Switching
**Priority:** MEDIUM  
**Effort:** 2 days

**Components:**
1. Organization switch endpoint
2. Session update logic
3. Frontend UI component
4. Audit logging for switches

#### Task 3.3: Access Request Improvements
**Priority:** LOW  
**Effort:** 2 days

**Features:**
1. Email notifications on status changes
2. Request expiration (30 days)
3. Rate limiting for resubmissions
4. User request history page
5. Batch approval UI

#### Task 3.4: Organization Invitation System
**Priority:** MEDIUM  
**Effort:** 3 days

**Components:**
1. Create invitation table
2. Invite creation endpoint
3. Invitation acceptance flow
4. Email integration
5. Frontend invitation UI

### 7.4 Phase 4: Advanced Features (2-3 weeks)

#### Task 4.1: Authorization Audit Trail
**Priority:** LOW  
**Effort:** 3 days

**Components:**
1. Create authorization_audit table
2. Log all permission checks (failures especially)
3. Analytics dashboard for security team
4. Alerting on suspicious patterns

#### Task 4.2: Permission Inheritance System
**Priority:** LOW  
**Effort:** 5 days

**Components:**
1. Role permissions table
2. User permission overrides table
3. Permission resolution logic
4. Admin UI for permission management
5. Temporary permission elevation

#### Task 4.3: Session Management UI
**Priority:** LOW  
**Effort:** 2 days

**Components:**
1. Active sessions list page
2. Session revocation endpoint
3. "Log out all devices" feature
4. Session details (IP, location, device)

---

## 8. Implementation Roadmap

### Phase 1: Immediate Actions (Week 1) - ✅ COMPLETED

**Goal:** Standardize terminology and improve code quality

**Completion Date:** October 5, 2025

**Status Update:** ✅ Phase 1 completed successfully!
- ✅ Rate limiting: Already active (5 attempts/15min for auth, 100 requests/15min for API)
- ✅ Session security: Already configured correctly (PostgreSQL storage, HTTPOnly, secure cookies)
- ✅ Terminology standardization: "LandlordAdmin" → "TenantAdmin" completed
- ✅ Code quality: Hardcoded privilege levels replaced with constants

**Completed Work:**
1. ✅ **Phase 1.1:** Replaced "LandlordAdmin" with "TenantAdmin" throughout codebase
   - Updated all TypeScript/JavaScript files (server, client, shared)
   - Updated all database scripts (SQL files)
   - Updated documentation (README files)
   - Updated database constraint and existing records
2. ✅ **Phase 1.2:** Replaced hardcoded privilege levels with ROLE_PRIVILEGE_LEVELS constants
   - Replaced ~70+ hardcoded privilege checks (0, 1, 2) with semantic constants
   - Added ROLE_PRIVILEGE_LEVELS imports to 5 files
   - Verified TypeScript compilation (no errors)
   - Application running successfully

**Deliverables Achieved:**
- ✅ Consistent "TenantAdmin" terminology across entire codebase
- ✅ Self-documenting code with ROLE_PRIVILEGE_LEVELS constants
- ✅ Improved code maintainability and readability
- ✅ Zero breaking changes - all functionality preserved
- ✅ Database schema and data updated successfully

**Next Phase:** Phase 2 - Short-Term Goals (Account lockout, Password reset, MFA)

#### Phase 1.1: Terminology Update: LandlordAdmin → TenantAdmin

**Priority:** HIGH  
**Effort:** 0.5 day  
**Impact:** Code consistency and clarity

**Background:**
The codebase currently uses inconsistent terminology for organization administrators. The role is referred to as both "LandlordAdmin" and "TenantAdmin". We need to standardize on "TenantAdmin" as it:
- Better reflects the insurance industry context
- Aligns with tenant/organization ownership model
- Is more professional and industry-appropriate

**Files Requiring Updates:**

The following files contain "LandlordAdmin" references that need to be replaced:

1. **Backend Files:**
   - `server/routes.ts` - API route handlers and role checks
   - `server/seed-users.ts` - User seeding scripts
   - `shared/schema.ts` - Role definitions and types

2. **Frontend Files:**
   - `client/src/pages/dashboard.tsx` - Main dashboard
   - `client/src/pages/dashboard/members.tsx` - Member management
   - `client/src/pages/dashboard/organizations.tsx` - Organization management
   - `client/src/pages/dashboard/user-management.tsx` - User management
   - `client/src/hooks/useRoleAuth.ts` - Role authorization hook

3. **Database Scripts:**
   - `database-scripts/schema/01_create_schema.sql` - Schema definitions
   - `database-scripts/tables/10_create_core_tables.sql` - Table creation
   - `database-scripts/seed/10_base_seed.sql` - Base data seeding
   - `database-scripts/seed/20_test_accounts_seed.sql` - Test account creation

4. **Documentation:**
   - `README.md` - Project documentation
   - `database-scripts/README.md` - Database documentation

**Step-by-Step Implementation:**

**Step 1: Verify Current References**
```bash
# Search for all LandlordAdmin references
grep -r "LandlordAdmin" --exclude-dir=node_modules --exclude-dir=.git .

# Expected count: ~50-60 occurrences across 13 files
```

**Step 2: Update TypeScript/JavaScript Files**
```bash
# Update shared schema
sed -i "s/LandlordAdmin/TenantAdmin/g" shared/schema.ts

# Update server files
sed -i "s/LandlordAdmin/TenantAdmin/g" server/routes.ts
sed -i "s/LandlordAdmin/TenantAdmin/g" server/seed-users.ts

# Update client files
sed -i "s/LandlordAdmin/TenantAdmin/g" client/src/pages/dashboard.tsx
sed -i "s/LandlordAdmin/TenantAdmin/g" client/src/pages/dashboard/members.tsx
sed -i "s/LandlordAdmin/TenantAdmin/g" client/src/pages/dashboard/organizations.tsx
sed -i "s/LandlordAdmin/TenantAdmin/g" client/src/pages/dashboard/user-management.tsx
sed -i "s/LandlordAdmin/TenantAdmin/g" client/src/hooks/useRoleAuth.ts
```

**Step 3: Update Database Scripts**
```bash
# Update schema and table scripts
sed -i "s/LandlordAdmin/TenantAdmin/g" database-scripts/schema/01_create_schema.sql
sed -i "s/LandlordAdmin/TenantAdmin/g" database-scripts/tables/10_create_core_tables.sql

# Update seed scripts
sed -i "s/LandlordAdmin/TenantAdmin/g" database-scripts/seed/10_base_seed.sql
sed -i "s/LandlordAdmin/TenantAdmin/g" database-scripts/seed/20_test_accounts_seed.sql
```

**Step 4: Update Documentation**
```bash
# Update README files
sed -i "s/LandlordAdmin/TenantAdmin/g" README.md
sed -i "s/LandlordAdmin/TenantAdmin/g" database-scripts/README.md
```

**Step 5: Update Database Data**
```sql
-- Update existing role records in database
UPDATE roles 
SET role_name = 'TenantAdmin' 
WHERE role_name = 'LandlordAdmin';

-- Verify no references remain
SELECT * FROM roles WHERE role_name LIKE '%Landlord%';
-- Should return 0 rows
```

**Step 6: Verification Checklist**
```bash
# 1. Check no LandlordAdmin references remain in code
grep -r "LandlordAdmin" --exclude-dir=node_modules --exclude-dir=.git .
# Should return: no matches

# 2. Verify TypeScript compilation
npm run build
# Should complete without errors

# 3. Check database consistency
psql $DATABASE_URL -c "SELECT DISTINCT role_name FROM roles ORDER BY role_name;"
# Should show: Agent, Guest, Member, SuperAdmin, TenantAdmin, Visitor

# 4. Test application startup
npm run dev
# Should start without errors

# 5. Verify role authorization still works
# - Log in as different role types
# - Check that TenantAdmin has correct privileges
# - Verify UI displays "TenantAdmin" correctly
```

**Step 7: Commit Changes**
```bash
git add -A
git commit -m "refactor: Replace LandlordAdmin with TenantAdmin terminology

- Updated all code references from LandlordAdmin to TenantAdmin
- Updated database scripts and seed data
- Updated documentation
- Verified role authorization still functions correctly

Affected files:
- Backend: routes.ts, seed-users.ts, schema.ts
- Frontend: dashboard pages, useRoleAuth hook
- Database: schema, tables, seed scripts
- Documentation: README files"
```

**Testing Post-Update:**

1. **Authentication Flow:**
   - Create new TenantAdmin account
   - Verify login works correctly
   - Check organization assignment

2. **Authorization Checks:**
   - Test TenantAdmin can manage their organization
   - Verify TenantAdmin cannot access other organizations
   - Confirm SuperAdmin retains cross-org access

3. **UI Display:**
   - Check role badges show "TenantAdmin"
   - Verify user management tables display correctly
   - Confirm navigation permissions work

4. **Database Integrity:**
   - Verify all users previously with LandlordAdmin role now have TenantAdmin
   - Check foreign key relationships intact
   - Confirm no orphaned role references

**Rollback Plan (if needed):**
```bash
# Revert all changes
git revert HEAD

# Or manually revert database only
UPDATE roles 
SET role_name = 'LandlordAdmin' 
WHERE role_name = 'TenantAdmin';
```

**Estimated Time:** 2-4 hours
**Risk Level:** LOW (simple find-replace with verification)
**Dependencies:** None
**Breaking Changes:** None (internal terminology only)

#### Phase 1.2: Code Quality: Replace Hardcoded Privilege Levels with Constants

**Priority:** MEDIUM  
**Effort:** 1 day  
**Impact:** Code maintainability, readability, and type safety

**Background:**
The codebase currently uses hardcoded numeric privilege levels (0, 1, 2, 3, 4, 5) throughout authorization checks. While the `ROLE_PRIVILEGE_LEVELS` constants are defined in `shared/schema.ts`, many parts of the code don't use them, leading to:
- **Magic numbers** that are hard to understand
- **Maintenance risk** if privilege levels ever need to change
- **Inconsistency** between files that use constants and those that don't
- **Poor readability** - `privilegeLevel === 0` vs `privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin`

**Current Constants (shared/schema.ts lines 1645-1651):**
```typescript
export const ROLE_PRIVILEGE_LEVELS = {
  SuperAdmin: 0,
  TenantAdmin: 1,
  Agent: 2,
  Member: 3,
  Guest: 4,
  Visitor: 5,
} as const;
```

**Problem Examples:**

**Current (Hard to understand):**
```typescript
if (user.privilegeLevel === 0) {
  // What does 0 mean?
}

if (currentUser.privilegeLevel <= 1) {
  // TenantAdmin and SuperAdmin, but not obvious
}

if (user.privilegeLevel > 2) {
  // Excludes Agent and above, but requires mental mapping
}
```

**Better (Self-documenting):**
```typescript
if (user.privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin) {
  // Crystal clear: SuperAdmin only
}

if (currentUser.privilegeLevel <= ROLE_PRIVILEGE_LEVELS.TenantAdmin) {
  // Clear: TenantAdmin and SuperAdmin
}

if (user.privilegeLevel > ROLE_PRIVILEGE_LEVELS.Agent) {
  // Clear: Below Agent level (Member, Guest, Visitor)
}
```

**Files Requiring Updates:**

Based on grep analysis, the following files contain hardcoded privilege level comparisons:

1. **Backend Files (High Priority):**
   - `server/routes.ts` - **~50+ occurrences** (CRITICAL)
   - `server/storage.ts` - Multiple privilege checks
   - `server/seed-users.ts` - Default privilege levels
   - `server/simple-seed.ts` - Test data privilege levels

2. **Frontend Files (Medium Priority):**
   - `client/src/hooks/useRoleAuth.ts` - **~20 occurrences** (already partially uses constants)
   - `client/src/pages/admin-provider-management.tsx` - Admin checks
   - `client/src/pages/role-test.tsx` - Role testing page
   - `client/src/pages/dashboard/access-requests.tsx` - Permission checks
   - `client/src/pages/dashboard/agents.tsx` - Agent management
   - `client/src/components/policy-transfer-dialog.tsx` - Transfer authorization
   - `client/src/components/organization-selector.tsx` - Org selection logic

3. **Database Scripts (Low Priority - Documentation Only):**
   - Comments in SQL files can reference constants but SQL will still use numbers

**Step-by-Step Implementation:**

**Step 1: Import Constants Where Needed**

For each file that needs updating, ensure the constant is imported:

```typescript
// Add to imports at top of file
import { ROLE_PRIVILEGE_LEVELS } from '@shared/schema';
// Or for server files:
import { ROLE_PRIVILEGE_LEVELS } from '../shared/schema';
```

**Step 2: Update server/routes.ts (CRITICAL - ~50 occurrences)**

This is the most important file to update. Common patterns to replace:

**Pattern 1: Exact equality checks**
```typescript
// BEFORE
if (user.privilegeLevel === 0) {
  
// AFTER
if (user.privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin) {
```

**Pattern 2: Less-than-or-equal (minimum privilege)**
```typescript
// BEFORE - TenantAdmin and above
if (user.privilegeLevel <= 1) {

// AFTER
if (user.privilegeLevel <= ROLE_PRIVILEGE_LEVELS.TenantAdmin) {

// BEFORE - Agent and above
if (user.privilegeLevel <= 2) {

// AFTER
if (user.privilegeLevel <= ROLE_PRIVILEGE_LEVELS.Agent) {
```

**Pattern 3: Greater-than (below certain privilege)**
```typescript
// BEFORE - Below TenantAdmin (excludes SuperAdmin and TenantAdmin)
if (user.privilegeLevel > 1) {

// AFTER
if (user.privilegeLevel > ROLE_PRIVILEGE_LEVELS.TenantAdmin) {

// BEFORE - Below Agent (Member, Guest, Visitor)
if (user.privilegeLevel > 2) {

// AFTER  
if (user.privilegeLevel > ROLE_PRIVILEGE_LEVELS.Agent) {
```

**Pattern 4: Complex conditions**
```typescript
// BEFORE
if (currentUser.privilegeLevel === 0 || 
    targetAgent.organizationId === currentUser.organizationId) {

// AFTER
if (currentUser.privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin || 
    targetAgent.organizationId === currentUser.organizationId) {
```

**Step 3: Update client/src/hooks/useRoleAuth.ts**

This file already uses constants in some places but still has hardcoded values:

```typescript
// BEFORE
if (privilegeLevel === 0) return true;

// AFTER
if (privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin) return true;

// BEFORE
return privilegeLevel <= 1;

// AFTER
return privilegeLevel <= ROLE_PRIVILEGE_LEVELS.TenantAdmin;

// BEFORE
return privilegeLevel <= 2;

// AFTER
return privilegeLevel <= ROLE_PRIVILEGE_LEVELS.Agent;
```

**Step 4: Update Other Client Files**

For each component file, replace hardcoded checks with constants.

**Example for client/src/pages/dashboard/access-requests.tsx:**
```typescript
// Add import
import { ROLE_PRIVILEGE_LEVELS } from '@shared/schema';

// Replace checks
if (user?.privilegeLevel <= ROLE_PRIVILEGE_LEVELS.TenantAdmin) {
  // Show admin features
}
```

**Step 5: Add Helper Functions (Optional Enhancement)**

Consider adding semantic helper functions to make code even more readable:

```typescript
// In shared/schema.ts or new shared/auth-helpers.ts
export const canManageOrganization = (privilegeLevel: number): boolean => {
  return privilegeLevel <= ROLE_PRIVILEGE_LEVELS.TenantAdmin;
};

export const canAssignPolicies = (privilegeLevel: number): boolean => {
  return privilegeLevel <= ROLE_PRIVILEGE_LEVELS.Agent;
};

export const isSuperAdmin = (privilegeLevel: number): boolean => {
  return privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin;
};

// Usage becomes even clearer:
if (isSuperAdmin(user.privilegeLevel)) {
  // SuperAdmin-only logic
}

if (canManageOrganization(currentUser.privilegeLevel)) {
  // TenantAdmin and SuperAdmin logic
}
```

**Step 6: Create Automated Find-Replace Script**

To make this safer and faster, create a script:

**scripts/replace-hardcoded-privileges.sh:**
```bash
#!/bin/bash

# Backup files first
git add -A
git commit -m "checkpoint: Before privilege level constant replacement"

# Replace privilegeLevel === 0 with constant
find server client -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i 's/privilegeLevel === 0/privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin/g' {} \;

# Replace privilegeLevel <= 1 with constant
find server client -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i 's/privilegeLevel <= 1/privilegeLevel <= ROLE_PRIVILEGE_LEVELS.TenantAdmin/g' {} \;

# Replace privilegeLevel === 1 with constant
find server client -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i 's/privilegeLevel === 1/privilegeLevel === ROLE_PRIVILEGE_LEVELS.TenantAdmin/g' {} \;

# Replace privilegeLevel > 1 with constant
find server client -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i 's/privilegeLevel > 1/privilegeLevel > ROLE_PRIVILEGE_LEVELS.TenantAdmin/g' {} \;

# Replace privilegeLevel <= 2 with constant
find server client -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i 's/privilegeLevel <= 2/privilegeLevel <= ROLE_PRIVILEGE_LEVELS.Agent/g' {} \;

# Replace privilegeLevel === 2 with constant
find server client -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i 's/privilegeLevel === 2/privilegeLevel === ROLE_PRIVILEGE_LEVELS.Agent/g' {} \;

# Replace privilegeLevel > 2 with constant
find server client -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i 's/privilegeLevel > 2/privilegeLevel > ROLE_PRIVILEGE_LEVELS.Agent/g' {} \;

echo "✓ Automated replacements complete"
echo "⚠ Next steps:"
echo "  1. Add ROLE_PRIVILEGE_LEVELS imports to files that need them"
echo "  2. Run: npm run build"
echo "  3. Fix any TypeScript errors"
echo "  4. Test thoroughly"
```

**Step 7: Add Imports Automatically**

After running the replacement script, add imports where needed:

```bash
# Find files that use ROLE_PRIVILEGE_LEVELS but don't import it
for file in $(grep -rl "ROLE_PRIVILEGE_LEVELS" server client --include="*.ts" --include="*.tsx"); do
  if ! grep -q "import.*ROLE_PRIVILEGE_LEVELS" "$file"; then
    echo "Missing import in: $file"
    # Determine correct import path based on file location
    if [[ $file == server/* ]]; then
      # Add import at top of file (after other imports)
      sed -i "1i import { ROLE_PRIVILEGE_LEVELS } from '../shared/schema';" "$file"
    elif [[ $file == client/* ]]; then
      sed -i "1i import { ROLE_PRIVILEGE_LEVELS } from '@shared/schema';" "$file"
    fi
  fi
done
```

**Step 8: Verification Checklist**

```bash
# 1. Check for remaining hardcoded privilege levels
# Look for suspicious patterns (but be careful of false positives)
grep -rn "privilegeLevel.*[=<>].*[0-5]" server client --include="*.ts" --include="*.tsx" \
  | grep -v "ROLE_PRIVILEGE_LEVELS" \
  | grep -v "// " \
  | grep -v "default(4)" \
  | grep -v "privilege_level"

# Should only show false positives like:
# - Database schema definitions (privilegeLevel: integer("privilege_level").default(4))
# - Comments explaining the system
# - SQL queries with numeric values

# 2. Verify imports are correct
grep -r "ROLE_PRIVILEGE_LEVELS" server client --include="*.ts" --include="*.tsx" \
  | grep -v "import.*ROLE_PRIVILEGE_LEVELS" \
  | grep -v "export const ROLE_PRIVILEGE_LEVELS"

# Each file should have a corresponding import

# 3. TypeScript compilation
npm run build
# Should complete with no errors

# 4. Check for proper constant usage
grep -r "ROLE_PRIVILEGE_LEVELS\." server client --include="*.ts" --include="*.tsx" | head -20
# Should show patterns like:
# - ROLE_PRIVILEGE_LEVELS.SuperAdmin
# - ROLE_PRIVILEGE_LEVELS.TenantAdmin
# - ROLE_PRIVILEGE_LEVELS.Agent
```

**Step 9: Manual Review of Complex Cases**

Some patterns may require manual review:

**Complex conditions with multiple comparisons:**
```typescript
// May need manual adjustment for clarity
if (user.privilegeLevel >= 2 && user.privilegeLevel <= 4) {
  // Agent through Guest (but not Visitor)
}

// Could become:
if (user.privilegeLevel >= ROLE_PRIVILEGE_LEVELS.Agent && 
    user.privilegeLevel <= ROLE_PRIVILEGE_LEVELS.Guest) {
  // Much clearer!
}
```

**Arithmetic operations:**
```typescript
// Review these carefully
const requiresOrganization = user.privilegeLevel <= 2;

// Should become:
const requiresOrganization = user.privilegeLevel <= ROLE_PRIVILEGE_LEVELS.Agent;
```

**Step 10: Testing Post-Update**

1. **Unit/Integration Tests:**
   - Run existing test suite: `npm test`
   - Verify all authorization tests pass
   - Check no regression in role-based access

2. **Manual Testing:**
   - Log in as each role type (SuperAdmin, TenantAdmin, Agent, Member, Guest)
   - Verify permissions work identically to before
   - Check all privilege-gated features function correctly

3. **Code Review Checklist:**
   - [ ] All hardcoded 0, 1, 2 privilege checks replaced
   - [ ] All files using constants have proper imports
   - [ ] No TypeScript compilation errors
   - [ ] Code is more readable than before
   - [ ] Functionality unchanged (same behavior)

**Step 11: Documentation Update**

Update inline comments to match the new clarity:

```typescript
// BEFORE
// Only SuperAdmin (0) and TenantAdmin (1) can approve
if (user.privilegeLevel > 1) {

// AFTER
// Only SuperAdmin and TenantAdmin can approve
if (user.privilegeLevel > ROLE_PRIVILEGE_LEVELS.TenantAdmin) {
```

**Step 12: Commit Changes**

```bash
git add -A
git commit -m "refactor: Replace hardcoded privilege levels with ROLE_PRIVILEGE_LEVELS constants

Improves code maintainability and readability by replacing magic numbers
with semantic constants from shared/schema.ts.

Changes:
- Replaced ~50+ hardcoded privilege checks in server/routes.ts
- Updated ~20 checks in client/src/hooks/useRoleAuth.ts
- Added ROLE_PRIVILEGE_LEVELS imports where needed
- Updated component files to use constants
- No functional changes - behavior identical to before

Benefits:
- Self-documenting code (SuperAdmin vs 0)
- Easier to maintain if privilege system changes
- Better IDE autocomplete and type checking
- Consistent with existing constants definition

Files modified:
- server/routes.ts
- server/storage.ts
- client/src/hooks/useRoleAuth.ts
- client/src/pages/dashboard/*.tsx
- client/src/components/*.tsx"
```

**Benefits After Completion:**

1. **Readability:** Code clearly shows which role is being checked
2. **Maintainability:** Changing privilege levels requires updating only one place
3. **Type Safety:** TypeScript can help catch errors with constants
4. **Consistency:** All code uses the same pattern
5. **Self-Documentation:** New developers understand code faster
6. **IDE Support:** Better autocomplete and refactoring support

**Before/After Comparison:**

**Before (Hard to understand):**
```typescript
if (user.privilegeLevel > 1) {
  return res.status(403).json({
    message: "Insufficient permissions",
  });
}
```

**After (Crystal clear):**
```typescript
if (user.privilegeLevel > ROLE_PRIVILEGE_LEVELS.TenantAdmin) {
  return res.status(403).json({
    message: "Insufficient permissions to approve requests",
  });
}
```

**Estimated Time:** 6-8 hours
- 1 hour: Planning and script creation
- 2 hours: Automated replacements and import additions
- 2 hours: Manual review of complex cases
- 2 hours: Testing and verification
- 1 hour: Documentation and commit

**Risk Level:** LOW-MEDIUM
- No functional changes, only code clarity improvements
- Risk of introducing bugs if replacements are incorrect
- Mitigated by: thorough testing, git checkpoints, automated script

**Dependencies:** 
- Must complete after Phase 1.1 (terminology update)
- Should complete before creating new authorization middleware (Phase 1.3)

**Breaking Changes:** None (purely internal refactoring)

### Phase 2: Short-Term Goals (Weeks 2-4) - 🚧 INFRASTRUCTURE COMPLETE

**Goal:** Complete essential authentication features with flexible deployment configuration

**Completion Date:** October 5, 2025 (Infrastructure Layer)

**Status Update:** ✅ Phase 2 infrastructure completed successfully!

**✅ Completed Infrastructure (October 5, 2025):**
1. **Database Schema Created:** All 6 Phase 2 tables created with proper indexes
   - ✅ `account_lockouts` - Account lockout tracking (5 failed attempts, 15-minute lockout)
   - ✅ `password_reset_tokens` - Password reset token management (1-hour expiration)
   - ✅ `mfa_settings` - User MFA preferences and TOTP secrets
   - ✅ `mfa_verification_attempts` - MFA verification attempt logging
   - ✅ `login_history` - Comprehensive login activity tracking
   - ✅ `mfa_config` - Global MFA runtime configuration

2. **Storage Layer Implementation:** 21 storage methods implemented in `DatabaseStorage` class
   - ✅ Account Lockout Methods (5): `getAccountLockout`, `recordFailedLoginAttempt`, `isAccountLocked`, `unlockAccount`, `resetFailedAttempts`
   - ✅ Password Reset Methods (4): `createPasswordResetToken`, `getPasswordResetToken`, `markPasswordResetTokenUsed`, `deleteExpiredPasswordResetTokens`
   - ✅ MFA Settings Methods (4): `getMfaSettings`, `createMfaSettings`, `updateMfaSettings`, `deleteMfaSettings`
   - ✅ MFA Verification Methods (2): `recordMfaVerificationAttempt`, `getMfaVerificationAttempts`
   - ✅ MFA Config Methods (2): `getMfaConfig`, `updateMfaConfig`
   - ✅ Login History Methods (4): `recordLoginAttempt`, `getUserLoginHistory`, `getLoginHistoryByEmail`, `getRecentFailedLogins`

3. **Security Features Implemented:**
   - ✅ Automatic account lockout after 5 failed login attempts
   - ✅ 15-minute lockout duration with manual unlock capability
   - ✅ Secure password reset token generation using `crypto.randomBytes(32)`
   - ✅ 1-hour token expiration with automatic cleanup
   - ✅ Comprehensive login activity tracking (IP, user agent, success/failure)
   - ✅ MFA runtime configuration table ready for deployment-specific settings

**🚧 Remaining Work (API & Frontend):**
- API Endpoints: Authentication flow integration, password reset flow, MFA enrollment/verification
- Frontend UI: Password reset pages, MFA setup wizard, login history dashboard
- Integration Testing: End-to-end flows, security testing, multi-tenant verification
- Documentation: API documentation, user guides, admin configuration guides

**Original Deliverables (In Progress):**
- Account lockout protecting against brute force (Infrastructure ✅, API pending)
- Functional password reset flow (Infrastructure ✅, API & UI pending)
- MFA available for all users (required for Agent+) with environment-based configuration (Infrastructure ✅, API & UI pending)
  - Disabled by default in development environments
  - Optional enforcement in staging environments
  - Required enforcement configurable via environment variables
  - Runtime toggle via `ENABLE_MFA` and `MFA_ENFORCEMENT_MODE` settings
- Login history visible to users (Infrastructure ✅, UI pending)

**MFA Configuration Strategy:**
The MFA implementation includes comprehensive runtime configuration support to allow:
- Development deployments to disable MFA entirely (`ENABLE_MFA=false`)
- Staging environments to use optional MFA (`MFA_ENFORCEMENT_MODE=optional`)
- Production environments to enforce MFA by role (`MFA_ENFORCEMENT_MODE=required_admins`)
- Testing bypass via `MFA_BYPASS_EMAILS` for automated testing and emergency access
- See Task 2.2 for detailed configuration options and implementation approach

**Next Steps:**
1. Implement API endpoints for account lockout in login flow
2. Create password reset API endpoints (`/api/auth/forgot-password`, `/api/auth/reset-password`)
3. Implement MFA enrollment and verification endpoints
4. Build frontend components for password reset and MFA setup
5. Add login history dashboard page
6. Write integration tests for all Phase 2 features
7. Update user documentation with new security features

### Phase 3: Medium-Term Goals (Weeks 3-6)

**Goal:** Optimize authorization and multi-tenancy

1. **Week 3:** Resource permission matrix implementation
2. **Week 3-4:** Data scope helper function and refactoring
3. **Week 4-5:** Organization switching feature
4. **Week 5:** Access request improvements
5. **Week 6:** Organization invitation system

**Deliverables:**
- Fine-grained resource permissions active
- Consistent data scoping across all endpoints
- Users can switch between organizations
- Improved access request UX with notifications

### Phase 4: Long-Term Goals (Weeks 7-10)

**Goal:** Advanced features and comprehensive auditing

1. **Week 7-8:** Authorization audit trail
2. **Week 8-9:** Permission inheritance system
3. **Week 9-10:** Session management UI
4. **Week 10:** Comprehensive security audit and testing

**Deliverables:**
- Complete audit trail for security analysis
- Flexible permission override system
- User-facing session management
- Security certification ready

### Phase 5: Success Metrics

#### Security Metrics (Target)
- Zero unauthorized cross-organization data access
- 100% of privileged endpoints with proper authorization
- < 0.1% false positive rate on permission checks
- Account lockout blocks 99%+ brute force attempts
- MFA adoption rate > 80% for Agent+ roles

#### Performance Metrics (Target)
- Authorization check < 10ms overhead
- Session retrieval < 50ms p95
- Rate limiting < 5ms overhead (✅ Already achieved)
- No user-facing performance degradation

#### User Experience Metrics (Target)
- Login success rate > 95%
- Password reset completion rate > 70%
- MFA setup completion rate > 85%
- Organization switching < 2 seconds

---

## 9. Testing Strategy

### 9.1 Authentication Testing

#### Unit Tests
```typescript
describe('Authentication', () => {
  describe('POST /api/auth/login', () => {
    it('should reject invalid credentials', async () => {});
    it('should accept valid credentials', async () => {});
    it('should auto-assign SuperAdmin to org 0', async () => {});
    it('should auto-assign single-org users', async () => {});
    it('should require org selection for multi-org users', async () => {});
    it('should enforce account lockout after 5 failures', async () => {});
    it('should respect rate limiting', async () => {});
  });
  
  describe('POST /api/auth/session/organization', () => {
    it('should validate organization access', async () => {});
    it('should reject unauthorized organization', async () => {});
    it('should allow SuperAdmin to select any org', async () => {});
  });
});
```

#### Integration Tests
```typescript
describe('Authentication Flow', () => {
  it('should complete two-stage auth for multi-org user', async () => {
    // 1. Login with credentials
    // 2. Receive org list
    // 3. Select organization
    // 4. Access dashboard
  });
  
  it('should award login points after auth', async () => {});
  it('should prevent cross-org data access', async () => {});
});
```

### 9.2 Authorization Testing

#### Unit Tests
```typescript
describe('Authorization', () => {
  describe('useRoleAuth', () => {
    it('should allow SuperAdmin all permissions', () => {});
    it('should restrict TenantAdmin to own org', () => {});
    it('should enforce resource permissions', () => {});
  });
  
  describe('Authorization Middleware', () => {
    it('should enforce minimum privilege level', () => {});
    it('should validate organization access', () => {});
    it('should log authorization failures', () => {});
  });
});
```

#### Integration Tests
```typescript
describe('Authorization Flow', () => {
  it('should prevent Agent from accessing TenantAdmin endpoints', () => {});
  it('should prevent TenantAdmin from accessing other orgs', () => {});
  it('should allow SuperAdmin cross-org access', () => {});
});
```

### 9.3 Multi-Tenant Testing

#### Data Isolation Tests
```typescript
describe('Multi-Tenant Data Isolation', () => {
  it('should isolate policies by organization', () => {});
  it('should isolate users by organization', () => {});
  it('should isolate claims by organization', () => {});
  it('should allow SuperAdmin to query all orgs', () => {});
});
```

### 9.4 Security Testing

#### Penetration Testing Scenarios
1. **Brute Force Attack:** Verify account lockout
2. **Session Hijacking:** Verify HTTPOnly cookies and HTTPS
3. **CSRF Attack:** Verify SameSite cookie setting
4. **Privilege Escalation:** Verify role enforcement
5. **Cross-Org Access:** Verify data isolation
6. **SQL Injection:** Verify parameterized queries
7. **XSS Attack:** Verify input sanitization

---

## 10. Documentation Requirements

### 10.1 Developer Documentation

**Topics to Document:**
1. Authentication flow diagrams
2. Authorization middleware usage
3. Data scoping patterns
4. Role hierarchy and permissions
5. Multi-tenant best practices
6. Security configuration guide

### 10.2 User Documentation

**Topics to Document:**
1. Login and registration guide
2. MFA setup instructions
3. Password reset process
4. Organization access requests
5. Security best practices
6. Session management

### 10.3 API Documentation

**Required Documentation:**
1. All authentication endpoints
2. Authorization headers required
3. Error codes and messages
4. Rate limiting policies
5. Organization scoping behavior

---

## Appendix A: Database Schema Changes

### New Tables Required

```sql
-- MFA settings
CREATE TABLE mfa_settings (
  user_id VARCHAR PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mfa_enabled BOOLEAN DEFAULT false,
  totp_secret VARCHAR(255), -- Encrypted
  backup_codes JSONB, -- Array of hashed codes
  recovery_email VARCHAR(255),
  enabled_at TIMESTAMP,
  last_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Login history
CREATE TABLE login_history (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  login_type VARCHAR(20) NOT NULL, -- 'password', 'oauth', 'mfa'
  ip_address VARCHAR(45),
  user_agent TEXT,
  location_country VARCHAR(2),
  location_city VARCHAR(100),
  organization_id INTEGER REFERENCES agent_organizations(id),
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(100),
  session_id VARCHAR(255),
  logged_in_at TIMESTAMP DEFAULT NOW(),
  logged_out_at TIMESTAMP,
  INDEX idx_login_user (user_id),
  INDEX idx_login_timestamp (logged_in_at),
  INDEX idx_login_success (success)
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_reset_token (token),
  INDEX idx_reset_user (user_id)
);

-- Authorization audit
CREATE TABLE authorization_audit (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  resource VARCHAR(100),
  action VARCHAR(20), -- 'read', 'write', 'delete'
  resource_id VARCHAR(100),
  success BOOLEAN NOT NULL,
  reason VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  attempted_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_auth_audit_user (user_id),
  INDEX idx_auth_audit_timestamp (attempted_at),
  INDEX idx_auth_audit_resource (resource, action)
);

-- Organization invitations
CREATE TABLE organization_invitations (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES agent_organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50),
  invited_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  accepted_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, expired, revoked
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_invitation_email (email),
  INDEX idx_invitation_token (invitation_token),
  INDEX idx_invitation_org (organization_id)
);

-- Role permissions
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'read', 'write', 'delete', 'manage'
  allowed BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, resource, action)
);

-- User permission overrides
CREATE TABLE user_permission_overrides (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(20) NOT NULL,
  allowed BOOLEAN NOT NULL,
  granted_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, resource, action),
  INDEX idx_permission_override_user (user_id),
  INDEX idx_permission_override_expiry (expires_at)
);
```

### Existing Table Modifications

```sql
-- Add to users table
ALTER TABLE users ADD COLUMN lockout_until TIMESTAMP;
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_failed_login TIMESTAMP;
ALTER TABLE users ADD COLUMN mfa_required BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;

-- Add to organization_access_requests table
ALTER TABLE organization_access_requests ADD COLUMN expires_at TIMESTAMP 
  DEFAULT NOW() + INTERVAL '30 days';
```

---

## Appendix B: Configuration Checklist

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...
SESSION_SECRET=<strong-random-secret>
NODE_ENV=production

# Security
COOKIE_DOMAIN=.justaskshel.com
HTTPS_ONLY=true
TRUST_PROXY=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# Session
SESSION_MAX_AGE=86400000 # 24 hours
SESSION_ROLLING=true

# MFA (optional)
MFA_ISSUER=JustAskShel
MFA_ALGORITHM=SHA1
MFA_DIGITS=6
MFA_PERIOD=30

# Email (for password reset, notifications)
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
FROM_EMAIL=noreply@justaskshel.com

# Optional: IP Geolocation
IP_GEOLOCATION_API_KEY=...
```

---

## Appendix C: Migration Guide

### Migrating to New Auth System

#### Step 1: Database Migrations
```bash
# Backup current database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Run schema updates
npm run db:push

# Verify schema
npm run db:studio
```

#### Step 2: Deploy Authorization Middleware
```bash
# Deploy to staging first
git checkout feature/auth-improvements
npm run build
npm run deploy:staging

# Run tests
npm run test:auth

# Deploy to production (zero downtime)
npm run deploy:production
```

#### Step 3: Enable Features Gradually
1. **Week 1:** Rate limiting + secure sessions
2. **Week 2:** Account lockout
3. **Week 3:** MFA (optional for users)
4. **Week 4:** MFA required for Agent+ roles

---

## Appendix D: Troubleshooting Guide

### Common Issues

#### Issue: Users can't log in after update
**Symptoms:** 401 Unauthorized on valid credentials
**Resolution:**
1. Check session configuration
2. Verify database connectivity
3. Check for account lockout
4. Review logs for specific error

#### Issue: Cross-org data leakage
**Symptoms:** Users see data from other organizations
**Resolution:**
1. Verify `resolveDataScope()` implementation
2. Check endpoint authorization middleware
3. Review query filters
4. Check SuperAdmin detection logic

#### Issue: Rate limiting too aggressive
**Symptoms:** Legitimate users getting rate limited
**Resolution:**
1. Adjust `RATE_LIMIT_MAX_REQUESTS`
2. Implement user-based rate limiting
3. Add IP whitelist for internal services
4. Review rate limit window

---

## Document Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 5, 2025 | Replit Agent | Initial comprehensive review and recommendations |
| 2.0 | Oct 5, 2025 | Replit Agent | **Corrected implementation assessment** - Updated to accurately reflect already-implemented features: rate limiting (✅ active), session security (✅ configured correctly), organization ID obfuscation (✅ base64 with salt). Adjusted roadmap and recommendations accordingly. |
| 2.1 | Oct 5, 2025 | Replit Agent | **Added code quality improvements** - Added Section 8.1.1 (LandlordAdmin → TenantAdmin terminology update) and Section 8.1.2 (Replace hardcoded privilege levels with ROLE_PRIVILEGE_LEVELS constants). Includes automated scripts, verification checklists, and step-by-step implementation guides. |
| 2.2 | Oct 5, 2025 | Replit Agent | **Phase-based roadmap structure** - Updated Section 8 (Implementation Roadmap) to use "Phase" prefix for all main operation groups (Phase 1-5). Improved clarity and structure for implementation planning. |
| 3.0 | Oct 5, 2025 | Replit Agent | **Phase 1 implementation complete** - Completed Phase 1.1 (LandlordAdmin → TenantAdmin: 13 files, database constraint, 1 user record) and Phase 1.2 (70+ hardcoded privilege levels → ROLE_PRIVILEGE_LEVELS constants in 5 files). Updated Executive Summary and Phase 1 status. Zero breaking changes, all tests passing. |
| 3.1 | Oct 5, 2025 | Replit Agent | **MFA configuration strategy added** - Updated Task 2.2 with comprehensive development deployment and runtime configuration details. Added environment variables (ENABLE_MFA, MFA_ENFORCEMENT_MODE, MFA_BYPASS_EMAILS), development strategy (default disabled in dev), implementation considerations (server/config/mfa-config.ts), configuration examples for dev/staging/prod, and testing strategy. Updated Phase 2 summary to highlight MFA configuration flexibility. |

---

**End of Document**

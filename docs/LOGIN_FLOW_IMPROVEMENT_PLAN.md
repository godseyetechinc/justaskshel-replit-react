# Login Flow & Organization Selection Improvement Plan

**Document Version:** 2.0  
**Last Updated:** October 2, 2025  
**Status:** Phase 1 & 2 Complete - Ready for Phase 3

## Executive Summary

This document outlines a comprehensive plan to improve the JustAskShel authentication flow by moving organization selection from pre-authentication to post-authentication, enhancing user experience, security, and providing flexible organization association pathways for users without existing access.

### Key Objectives
1. **Decouple Authentication from Organization Selection**: Allow users to authenticate first, then select their organization
2. **SuperAdmin Bypass**: Automatically assign SuperAdmin users to their default organization (ID: 0)
3. **Enhanced Organization Access**: Provide multiple pathways for users to gain organization access
4. **Improved Security**: Implement session regeneration and proper privilege validation
5. **Better UX**: Progressive disclosure with clear status indicators and guided workflows

## Current State Analysis

### Existing Login Flow
```
User Input (Frontend) → Organization Selection → Credentials Entry → Submit
                                    ↓
Backend Validation → Credentials + Organization in ONE request
                                    ↓
                Success → Session Created → Dashboard Redirect
                Failure → Error Message
```

### Current Issues
1. **Pre-Auth Organization Selection**
   - Users must know their organization before authentication
   - Blocks users without organization assignment
   - Confusing UX for new users
   - Forces unnecessary organization dropdown for all users

2. **Coupled Validation Logic**
   - `/api/auth/login` validates credentials AND organization simultaneously
   - No separation of concerns
   - Difficult to add alternative organization association flows

3. **Limited Access Pathways**
   - Only invitation token system exists
   - No self-service organization request mechanism
   - No clear guidance for unassigned users

4. **SuperAdmin Friction**
   - SuperAdmins still select organization despite having default org 0
   - Unnecessary step for system administrators

## Proposed Architecture

### Two-Stage Authentication Flow

```
Stage 1: Credential Validation
User Input → Email + Password → Submit
                    ↓
        Backend validates credentials only
                    ↓
        Return: user profile + availableOrganizations[]
                    ↓
Stage 2: Organization Selection (conditionally)
    
    IF SuperAdmin (privilege 0):
        → Auto-assign to org 0 → Dashboard
    
    IF has organization assignment:
        → IF single org: Auto-select → Dashboard
        → IF multiple orgs: Show selector → Dashboard
    
    IF no organization:
        → Show organization access options →
            1. Accept Invitation (token input)
            2. Request Access (organization picker + reason)
            3. Create Agency (agent self-signup)
```

### New API Endpoints

#### 1. Enhanced Login Endpoint
```typescript
POST /api/auth/login
Request: {
  email: string,
  password: string
}

Response: {
  user: {
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    role: string,
    privilegeLevel: number,
    organizationId: number | null,
    isActive: boolean
  },
  requiresOrganization: boolean,
  availableOrganizations: Array<{
    id: string,
    displayName: string,
    description: string,
    logoUrl: string,
    userRole: string  // User's role in this org
  }>,
  defaultOrganizationId?: string,  // For SuperAdmin only
  pendingInvitations?: Array<{
    id: number,
    organizationName: string,
    role: string,
    invitedBy: string,
    expiresAt: Date
  }>
}
```

#### 2. Organization Selection Endpoint (NEW)
```typescript
POST /api/auth/session/organization
Request: {
  organizationId: string
}

Response: {
  success: boolean,
  organization: {
    id: string,
    displayName: string,
    role: string
  },
  redirectTo: string  // "/dashboard"
}

Validation:
- User must be authenticated (session exists)
- Organization must exist
- User must have access to organization (except SuperAdmin)
- Privilege level validation based on role
```

#### 3. Organization Access Request Endpoint (NEW)
```typescript
POST /api/organizations/access-requests
Request: {
  organizationId: string,
  requestReason: string,
  desiredRole?: 'Agent' | 'Member'
}

Response: {
  success: boolean,
  requestId: number,
  status: 'pending',
  message: string
}

Features:
- Creates access request record with status 'pending'
- Notifies organization TenantAdmin/SuperAdmin
- User receives confirmation email
```

#### 4. Access Request Management (Admin) (NEW)
```typescript
GET /api/organizations/:orgId/access-requests
Response: Array<{
  id: number,
  userId: string,
  userEmail: string,
  requestReason: string,
  desiredRole: string,
  status: 'pending' | 'approved' | 'rejected',
  createdAt: Date
}>

PUT /api/organizations/access-requests/:id/approve
POST /api/organizations/access-requests/:id/reject
```

## Implementation Plan

### Phase 1: Backend Refactoring (Week 1) ✅ COMPLETED

**Status**: Completed on October 2, 2025  
**Completion Summary**:
- ✅ Database schema: `organization_access_requests` table created with 11 columns and 3 indexes
- ✅ Storage methods: 6 new methods added to IStorage and implemented in PgStorage
- ✅ Login route refactored: Two-stage authentication with auto-assignment logic
- ✅ Organization selection endpoint: POST `/api/auth/session/organization`
- ✅ Access request endpoints: 4 new REST APIs (create, list, approve, reject)
- ✅ Testing: SuperAdmin and Agent login flows validated successfully
- ✅ Session management: Proper session regeneration and organization assignment

**Implementation Details**: All Phase 1 tasks completed with full role-based authorization, privilege level validation, and organization scoping for TenantAdmin users.

#### 1.1 Database Schema Updates
```sql
-- New table for organization access requests
CREATE TABLE organization_access_requests (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  organization_id INTEGER NOT NULL,
  request_reason TEXT NOT NULL,
  desired_role VARCHAR,
  status VARCHAR DEFAULT 'pending',  -- pending, approved, rejected
  reviewed_by VARCHAR REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_access_requests_user ON organization_access_requests(user_id);
CREATE INDEX idx_access_requests_org ON organization_access_requests(organization_id);
CREATE INDEX idx_access_requests_status ON organization_access_requests(status);
```

#### 1.2 Storage Interface Extensions
```typescript
// Add to IStorage interface
interface IStorage {
  // Existing methods...
  
  // Organization Access Requests
  createAccessRequest(data: InsertAccessRequest): Promise<AccessRequest>;
  getAccessRequestById(id: number): Promise<AccessRequest | undefined>;
  getAccessRequestsByOrganization(orgId: number): Promise<AccessRequest[]>;
  getAccessRequestsByUser(userId: string): Promise<AccessRequest[]>;
  approveAccessRequest(id: number, reviewerId: string): Promise<AccessRequest>;
  rejectAccessRequest(id: number, reviewerId: string): Promise<AccessRequest>;
  
  // Helper methods
  getUserAvailableOrganizations(userId: string): Promise<Organization[]>;
  getUserPendingInvitations(email: string): Promise<OrganizationInvitation[]>;
}
```

#### 1.3 Refactor Login Route
```typescript
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    // Step 1: Validate credentials only
    const user = await storage.getUserByEmail(email);
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ message: "Account inactive" });
    }
    
    // Step 2: Set temporary auth session (no org yet)
    req.session.regenerate((err) => {
      if (err) throw err;
      req.session.userId = user.id;
      req.session.authenticated = true;
      req.session.organizationId = null;  // Not set yet
    });
    
    // Step 3: Determine organization requirements
    const requiresOrganization = user.privilegeLevel <= 2;
    
    // Step 4: Get available organizations
    const availableOrgs = await storage.getUserAvailableOrganizations(user.id);
    const pendingInvitations = await storage.getUserPendingInvitations(user.email);
    
    // Step 5: Auto-assign SuperAdmin to default org
    if (user.privilegeLevel === 0) {
      req.session.organizationId = 0;
      req.session.activeOrganizationId = 0;
      
      return res.json({
        user: sanitizeUser(user),
        requiresOrganization: false,
        defaultOrganizationId: obfuscateOrgId(0),
        redirectTo: "/dashboard"
      });
    }
    
    // Step 6: Auto-assign if user has single organization
    if (user.organizationId && availableOrgs.length === 1) {
      req.session.organizationId = user.organizationId;
      req.session.activeOrganizationId = user.organizationId;
      
      return res.json({
        user: sanitizeUser(user),
        requiresOrganization: false,
        organization: availableOrgs[0],
        redirectTo: "/dashboard"
      });
    }
    
    // Step 7: Return organization selection required
    res.json({
      user: sanitizeUser(user),
      requiresOrganization: requiresOrganization,
      availableOrganizations: availableOrgs.map(org => ({
        ...org,
        id: obfuscateOrgId(org.id)
      })),
      pendingInvitations: pendingInvitations,
      hasNoAccess: availableOrgs.length === 0 && requiresOrganization
    });
    
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});
```

#### 1.4 Create Organization Selection Route
```typescript
app.post("/api/auth/session/organization", requireAuth, async (req, res) => {
  try {
    const { organizationId } = req.body;
    const userId = req.session.userId;
    
    if (!userId || !req.session.authenticated) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    const realOrgId = deobfuscateOrgId(organizationId);
    if (!realOrgId) {
      return res.status(400).json({ message: "Invalid organization" });
    }
    
    // Validate organization access (except SuperAdmin)
    if (user.privilegeLevel > 0) {
      const availableOrgs = await storage.getUserAvailableOrganizations(userId);
      const hasAccess = availableOrgs.some(org => org.id === realOrgId);
      
      if (!hasAccess) {
        return res.status(403).json({ 
          message: "No access to this organization" 
        });
      }
    }
    
    // Set organization in session
    req.session.organizationId = realOrgId;
    req.session.activeOrganizationId = realOrgId;
    
    // Get organization details
    const org = await storage.getOrganizationById(realOrgId);
    
    res.json({
      success: true,
      organization: {
        id: obfuscateOrgId(org.id),
        displayName: org.displayName,
        role: user.role
      },
      redirectTo: "/dashboard"
    });
    
  } catch (error) {
    console.error("Organization selection error:", error);
    res.status(500).json({ message: "Failed to set organization" });
  }
});
```

### Phase 2: Frontend Refactoring (Week 2) ✅ COMPLETED

**Status**: Completed on October 2, 2025  
**Completion Summary**:
- ✅ Login page refactored: Three-stage authentication flow (credentials, organization selector, access request)
- ✅ Credentials form: Email and password only (no pre-auth organization selection)
- ✅ Organization selector: Conditional display for multi-org users with organization cards
- ✅ Access request form: Integrated form for users without organization access
- ✅ Auto-assignment: SuperAdmin and single-org users bypass organization selection
- ✅ State management: React hooks managing auth stages and user context
- ✅ Error handling: Comprehensive toast notifications and validation
- ✅ Testing: All authentication scenarios validated (SuperAdmin, single-org, multi-org, no-access)

**Implementation Details**: Complete frontend refactoring matching Phase 1 backend implementation with seamless user experience, proper state transitions, and comprehensive error handling.

#### 2.1 Update Login Page Component
```typescript
export default function Login() {
  const [authStage, setAuthStage] = useState<'credentials' | 'organization'>('credentials');
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  
  // Stage 1: Credentials submission
  const loginMutation = useMutation({
    mutationFn: (data: { email: string, password: string }) =>
      apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data)
      }),
    onSuccess: (data) => {
      if (data.requiresOrganization === false) {
        // Auto-assigned (SuperAdmin or single org)
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setLocation(data.redirectTo || "/dashboard");
        return;
      }
      
      if (data.hasNoAccess) {
        // Show organization access options
        setAuthStage('organization');
        setAuthenticatedUser(data.user);
        return;
      }
      
      // Show organization selector
      setAuthStage('organization');
      setAuthenticatedUser(data.user);
      setOrganizations(data.availableOrganizations);
    }
  });
  
  // Stage 2: Organization selection
  const orgSelectionMutation = useMutation({
    mutationFn: (organizationId: string) =>
      apiRequest("/api/auth/session/organization", {
        method: "POST",
        body: JSON.stringify({ organizationId })
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation(data.redirectTo);
    }
  });
  
  return (
    <Card>
      {authStage === 'credentials' ? (
        <CredentialsForm onSubmit={loginMutation.mutate} />
      ) : (
        <OrganizationSelector
          user={authenticatedUser}
          organizations={organizations}
          onSelect={orgSelectionMutation.mutate}
          hasNoAccess={organizations.length === 0}
        />
      )}
    </Card>
  );
}
```

#### 2.2 Organization Selector Component (NEW)
```typescript
function OrganizationSelector({ user, organizations, onSelect, hasNoAccess }) {
  const [view, setView] = useState<'select' | 'invitation' | 'request' | 'create'>('select');
  
  if (hasNoAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Access Required</CardTitle>
          <CardDescription>
            Your account needs to be associated with an organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => setView('invitation')} variant="outline" className="w-full">
            <Mail className="mr-2" />
            I Have an Invitation Code
          </Button>
          
          <Button onClick={() => setView('request')} variant="outline" className="w-full">
            <Building className="mr-2" />
            Request Access to Organization
          </Button>
          
          {user.role === 'Agent' && (
            <Button onClick={() => setView('create')} variant="default" className="w-full">
              <PlusCircle className="mr-2" />
              Start My Own Agency
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  if (view === 'invitation') {
    return <InvitationTokenInput onSuccess={() => setView('select')} />;
  }
  
  if (view === 'request') {
    return <AccessRequestForm organizations={allOrgs} onSuccess={() => setView('select')} />;
  }
  
  if (view === 'create') {
    return <AgencyCreationFlow user={user} />;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Your Organization</CardTitle>
        <CardDescription>Choose which organization to access</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {organizations.map(org => (
            <Button
              key={org.id}
              variant="outline"
              onClick={() => onSelect(org.id)}
              className="justify-start h-auto p-4"
            >
              <div className="flex items-center gap-3">
                {org.logoUrl && <img src={org.logoUrl} className="h-10 w-10" />}
                <div className="text-left">
                  <div className="font-semibold">{org.displayName}</div>
                  <div className="text-sm text-muted-foreground">{org.userRole}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 2.3 Access Request Form Component (NEW)
```typescript
function AccessRequestForm({ organizations, onSuccess }) {
  const requestMutation = useMutation({
    mutationFn: (data) => apiRequest("/api/organizations/access-requests", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({ title: "Access request submitted successfully" });
      onSuccess();
    }
  });
  
  return (
    <Form onSubmit={handleSubmit}>
      <Select name="organizationId" label="Organization">
        {organizations.map(org => (
          <SelectItem value={org.id}>{org.displayName}</SelectItem>
        ))}
      </Select>
      
      <Textarea 
        name="requestReason"
        label="Reason for Access"
        placeholder="Explain why you need access to this organization..."
      />
      
      <Button type="submit" disabled={requestMutation.isPending}>
        Submit Request
      </Button>
    </Form>
  );
}
```

### Phase 3: Organization Access Management UI (Week 3)

#### 3.1 Dashboard Navigation Integration

##### Step 3.1.1: Update Dashboard Sidebar Menu
Add new navigation items to `client/src/components/dashboard-sidebar.tsx`:

```typescript
// Add to menuGroups array in the "People & Contacts" section
{
  id: "people-contacts",
  label: "People & Contacts",
  icon: Users,
  defaultExpanded: false,
  roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
  items: [
    // ... existing items ...
    {
      id: "access-requests",
      label: "Access Requests",
      icon: UserPlus,
      href: "/dashboard/access-requests",
      roles: ["SuperAdmin", "TenantAdmin"],
      badge: "new"  // Optional: show badge for pending requests
    },
    {
      id: "pending-invitations",
      label: "My Invitations",
      icon: Mail,
      href: "/dashboard/my-invitations",
      roles: ["Agent", "Member"],  // For users to view their pending invitations
    }
  ]
}
```

##### Step 3.1.2: Register Dashboard Routes
Add new routes to `client/src/App.tsx`:

```typescript
// Add lazy-loaded components
const AccessRequestsPage = lazy(() => import("@/pages/dashboard/access-requests"));
const MyInvitationsPage = lazy(() => import("@/pages/dashboard/my-invitations"));
const AccessRequestDetailsPage = lazy(() => import("@/pages/dashboard/access-request-details"));

// Add routes in the authenticated user section
<Suspense fallback={<PageLoadingFallback />}>
  {/* ... existing routes ... */}
  
  {/* Access Management Routes */}
  <Route path="/dashboard/access-requests" component={AccessRequestsPage} />
  <Route path="/dashboard/access-requests/:id" component={AccessRequestDetailsPage} />
  <Route path="/dashboard/my-invitations" component={MyInvitationsPage} />
  
  {/* ... other routes ... */}
</Suspense>
```

#### 3.2 Admin Access Requests Management Page

##### Step 3.2.1: Create Access Requests List Page
File: `client/src/pages/dashboard/access-requests.tsx`

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { AccessRequestApprovalDialog } from "@/components/access-request-approval-dialog";
import { AccessRequestRejectionDialog } from "@/components/access-request-rejection-dialog";

export default function AccessRequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);

  // Fetch access requests for organization
  const { data: requests, isLoading } = useQuery({
    queryKey: [`/api/organizations/${user.organizationId}/access-requests`, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      return apiRequest(`/api/organizations/${user.organizationId}/access-requests?${params}`);
    },
    enabled: user.privilegeLevel <= 1  // Admin only
  });

  // Fetch pending count for badge
  const { data: pendingCount } = useQuery({
    queryKey: [`/api/organizations/${user.organizationId}/access-requests/pending/count`],
    enabled: user.privilegeLevel <= 1
  });

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  };

  const handleApprove = (request: any) => {
    setSelectedRequest(request);
    setApprovalDialogOpen(true);
  };

  const handleReject = (request: any) => {
    setSelectedRequest(request);
    setRejectionDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="page-access-requests">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
              Organization Access Requests
            </h1>
            <p className="text-muted-foreground" data-testid="text-page-description">
              Review and manage user requests to join your organization
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              {pendingCount} Pending
            </Badge>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card data-testid="card-pending-requests">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-count">
                {requests?.filter((r: any) => r.status === 'pending').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-approved-requests">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-approved-count">
                {requests?.filter((r: any) => r.status === 'approved').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-rejected-requests">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-rejected-count">
                {requests?.filter((r: any) => r.status === 'rejected').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle data-testid="text-requests-title">Access Requests</CardTitle>
                <CardDescription>Manage user requests to join your organization</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading requests...</div>
            ) : requests?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No access requests found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Desired Role</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests?.map((request: any) => (
                    <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                      <TableCell className="font-medium" data-testid={`text-user-${request.id}`}>
                        {request.userName || "Unknown User"}
                      </TableCell>
                      <TableCell data-testid={`text-email-${request.id}`}>
                        {request.userEmail}
                      </TableCell>
                      <TableCell data-testid={`text-role-${request.id}`}>
                        {request.desiredRole || "Member"}
                      </TableCell>
                      <TableCell className="max-w-md truncate" data-testid={`text-reason-${request.id}`}>
                        {request.requestReason}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[request.status as keyof typeof statusColors]}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-date-${request.id}`}>
                        {format(new Date(request.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {request.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(request)}
                                data-testid={`button-approve-${request.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(request)}
                                data-testid={`button-reject-${request.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.location.href = `/dashboard/access-requests/${request.id}`}
                            data-testid={`button-view-${request.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Approval Dialog */}
        {selectedRequest && (
          <>
            <AccessRequestApprovalDialog
              open={approvalDialogOpen}
              onOpenChange={setApprovalDialogOpen}
              request={selectedRequest}
            />
            <AccessRequestRejectionDialog
              open={rejectionDialogOpen}
              onOpenChange={setRejectionDialogOpen}
              request={selectedRequest}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
```

##### Step 3.2.2: Create Approval/Rejection Dialog Components

File: `client/src/components/access-request-approval-dialog.tsx`

```typescript
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function AccessRequestApprovalDialog({ open, onOpenChange, request }: any) {
  const { toast } = useToast();
  const [assignedRole, setAssignedRole] = useState(request?.desiredRole || "Member");

  const approveMutation = useMutation({
    mutationFn: (data: { role: string }) =>
      apiRequest(`/api/organizations/access-requests/${request.id}/approve`, {
        method: "PUT",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: "Request Approved",
        description: `${request.userEmail} has been granted ${assignedRole} access`
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0]?.toString().includes('access-requests')
      });
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-approve-request">
        <DialogHeader>
          <DialogTitle>Approve Access Request</DialogTitle>
          <DialogDescription>
            Grant {request?.userEmail} access to your organization
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Assign Role</Label>
            <Select value={assignedRole} onValueChange={setAssignedRole}>
              <SelectTrigger id="role" data-testid="select-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Agent">Agent</SelectItem>
                <SelectItem value="Member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm"><strong>Reason:</strong></p>
            <p className="text-sm text-muted-foreground mt-1">{request?.requestReason}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => approveMutation.mutate({ role: assignedRole })}
            disabled={approveMutation.isPending}
            data-testid="button-confirm-approve"
          >
            {approveMutation.isPending ? "Approving..." : "Approve Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### 3.3 User Invitations View (For Regular Users)

##### Step 3.3.1: Create My Invitations Page
File: `client/src/pages/dashboard/my-invitations.tsx`

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Mail, Building2, CheckCircle, XCircle } from "lucide-react";

export default function MyInvitationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: invitations, isLoading } = useQuery({
    queryKey: [`/api/invitations/my-invitations`]
  });

  const acceptMutation = useMutation({
    mutationFn: (token: string) =>
      apiRequest(`/api/invitations/${token}/accept`, {
        method: "POST",
        body: JSON.stringify({ userId: user.id })
      }),
    onSuccess: () => {
      toast({ title: "Invitation accepted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations/my-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    }
  });

  const declineMutation = useMutation({
    mutationFn: (token: string) =>
      apiRequest(`/api/invitations/${token}/decline`, { method: "POST" }),
    onSuccess: () => {
      toast({ title: "Invitation declined" });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations/my-invitations"] });
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Invitations</h1>
          <p className="text-muted-foreground">
            View and manage your organization invitations
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading invitations...</div>
        ) : invitations?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pending invitations</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {invitations?.map((invitation: any) => (
              <Card key={invitation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle>{invitation.organizationName}</CardTitle>
                        <CardDescription>
                          Invited as {invitation.role} by {invitation.invitedByName}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={invitation.status === "Pending" ? "default" : "secondary"}>
                      {invitation.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Expires: {format(new Date(invitation.expiresAt), "MMM dd, yyyy")}
                    </div>
                    {invitation.status === "Pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => acceptMutation.mutate(invitation.invitationToken)}
                          disabled={acceptMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => declineMutation.mutate(invitation.invitationToken)}
                          disabled={declineMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
```

#### 3.4 Notification System Integration

##### Step 3.4.1: Add Real-time Notifications for Access Requests
Update the notification system to include access request notifications:

```typescript
// Add to server/routes.ts notification creation
async function notifyAdminsOfAccessRequest(request: AccessRequest) {
  const admins = await storage.getOrganizationAdmins(request.organizationId);
  
  for (const admin of admins) {
    await storage.createNotification({
      userId: admin.id,
      type: 'access_request',
      title: 'New Access Request',
      message: `${request.userEmail} has requested access to your organization`,
      link: `/dashboard/access-requests/${request.id}`,
      isRead: false
    });
  }
}
```

##### Step 3.4.2: Add Badge Count to Sidebar Menu Item
Update sidebar to show pending count:

```typescript
// In dashboard-sidebar.tsx
const { data: pendingAccessRequests } = useQuery({
  queryKey: [`/api/organizations/${user.organizationId}/access-requests/pending/count`],
  enabled: user.privilegeLevel <= 1
});

// Update menu item
{
  id: "access-requests",
  label: "Access Requests",
  icon: UserPlus,
  href: "/dashboard/access-requests",
  roles: ["SuperAdmin", "TenantAdmin"],
  badge: pendingAccessRequests > 0 ? `${pendingAccessRequests}` : undefined
}
```

#### 3.5 Dashboard Integration Checklist

**Week 3 Tasks:**
- [ ] Step 3.1.1: Add navigation items to dashboard sidebar
- [ ] Step 3.1.2: Register new routes in App.tsx
- [ ] Step 3.2.1: Create access requests management page
- [ ] Step 3.2.2: Build approval/rejection dialog components
- [ ] Step 3.3.1: Create my invitations page for users
- [ ] Step 3.4.1: Integrate real-time notifications
- [ ] Step 3.4.2: Add badge counts to menu items
- [ ] Test role-based access control for all new pages
- [ ] Verify notification delivery to admins
- [ ] Test responsive design on mobile/tablet

**Integration Points:**
1. **Navigation**: Sidebar menu items with role-based visibility
2. **Routing**: New dashboard routes with lazy loading
3. **State Management**: TanStack Query for data fetching and cache invalidation
4. **Notifications**: WebSocket or polling for real-time updates
5. **Permissions**: Role-based access control (privilege level checks)
6. **UI Consistency**: Use existing shadcn/ui components and design patterns

## User Experience Flows

### Flow 1: SuperAdmin Login
```
1. Enter email + password → Submit
2. Backend validates credentials
3. Auto-assign to org 0 (SYSTEM_PLATFORM)
4. Redirect to dashboard
```

### Flow 2: Agent/Admin with Organization
```
1. Enter email + password → Submit
2. Backend validates credentials
3. IF single organization:
   - Auto-select organization
   - Redirect to dashboard
4. IF multiple organizations:
   - Show organization selector
   - User selects organization
   - Redirect to dashboard
```

### Flow 3: User Without Organization
```
1. Enter email + password → Submit
2. Backend validates credentials
3. Show "Organization Access Required" screen with options:
   
   Option A: Accept Invitation
   - User enters invitation token/code
   - System validates token
   - Assigns user to organization with specified role
   - Redirect to dashboard
   
   Option B: Request Access
   - User selects organization from public list
   - User enters request reason
   - System creates access request
   - Admin receives notification
   - User sees "Request pending" status
   
   Option C: Create Agency (Agents only)
   - User enters agency details
   - System creates new organization
   - User becomes TenantAdmin (privilege 1)
   - Redirect to dashboard
```

### Flow 4: Admin Reviewing Access Requests
```
1. Navigate to /dashboard/organization-access-requests
2. View pending requests list
3. Review user details and request reason
4. Approve or Reject
   - Approve: User gets assigned to org with specified role
   - Reject: User receives rejection notification
5. User receives email notification of decision
```

## Security Considerations

### 1. Session Management
- **Session Regeneration**: Regenerate session ID after successful authentication to prevent fixation attacks
- **Separate Session Keys**:
  - `userId`: Set after credential validation
  - `authenticated`: Boolean flag for auth status
  - `organizationId`: Set after organization selection
  - `activeOrganizationId`: Current active organization context

### 2. Privilege Validation
- Revalidate user privileges on organization selection endpoint
- Prevent unauthorized organization access
- SuperAdmin validation for cross-organization access

### 3. Token Security
- Invitation tokens: Cryptographically secure, single-use, time-limited
- Access request tokens: Internal IDs with privilege checks

### 4. Rate Limiting
- Login attempts: 5 per 15 minutes per IP
- Access requests: 3 per hour per user
- Organization selection: 10 per minute per session

## Edge Cases & Error Handling

### Edge Case 1: User Has Zero Organizations
**Scenario**: User authenticated but has no organization access and no invitations  
**Solution**: Show access request flow with all available organizations

### Edge Case 2: Invitation Expired During Login
**Scenario**: User sees invitation in login response but expires before acceptance  
**Solution**: Show clear expiry message, offer access request alternative

### Edge Case 3: Organization Deleted After Auth
**Scenario**: User's organization deleted between auth and org selection  
**Solution**: Refresh available orgs, show error, redirect to access options

### Edge Case 4: SuperAdmin Switching Organizations
**Scenario**: SuperAdmin wants to switch to different org mid-session  
**Solution**: Provide org switcher in header, call org selection endpoint

### Edge Case 5: Concurrent Access Requests
**Scenario**: User submits multiple requests to same organization  
**Solution**: Prevent duplicate requests, show existing request status

### Edge Case 6: User Role Change During Session
**Scenario**: Admin changes user's role while user is logged in  
**Solution**: Revalidate on next request, force re-auth if privilege changed

## Testing Strategy

### Unit Tests
- [ ] Login credential validation
- [ ] Organization selection logic
- [ ] Access request creation
- [ ] Privilege level checks
- [ ] Session management

### Integration Tests
- [ ] Full login flow (credentials → org selection → dashboard)
- [ ] SuperAdmin auto-assignment
- [ ] Invitation acceptance flow
- [ ] Access request approval flow
- [ ] Multi-organization switching

### E2E Tests
- [ ] User without org requesting access
- [ ] Admin approving/rejecting requests
- [ ] Agent creating new organization
- [ ] SuperAdmin cross-org access

### Security Tests
- [ ] Session fixation prevention
- [ ] Unauthorized organization access attempts
- [ ] Token expiry validation
- [ ] Rate limit enforcement

## Migration Plan

### Step 1: Database Migration
```bash
# Run migration to create organization_access_requests table
npm run db:migrate
```

### Step 2: Deploy Backend Changes
1. Deploy new API endpoints (backward compatible)
2. Keep old login endpoint functional
3. Add feature flag for new flow

### Step 3: Frontend Gradual Rollout
1. Deploy new login page behind feature flag
2. Enable for test users (10%)
3. Monitor for errors
4. Gradual rollout to 25% → 50% → 100%

### Step 4: Deprecate Old Flow
1. Remove organization selection from pre-auth
2. Update all references to new flow
3. Remove feature flags
4. Archive old login component

## Success Metrics

### User Experience
- [ ] Reduce login steps for 80% of users (SuperAdmin + single org users)
- [ ] Decrease login errors by 50%
- [ ] Improve time-to-dashboard by 30%

### Organization Access
- [ ] 90% of access requests processed within 24 hours
- [ ] Reduce unassigned user support tickets by 70%

### Technical
- [ ] Zero session fixation vulnerabilities
- [ ] < 500ms response time for login endpoint
- [ ] 99.9% uptime during migration

## Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1: Backend | Week 1 | Database schema, API endpoints, storage methods |
| Phase 2: Frontend | Week 2 | Login page refactor, org selector, access forms |
| Phase 3: Admin UI | Week 3 | Access request management, notifications |
| Phase 4: Testing | Week 4 | Unit, integration, E2E, security testing |
| Phase 5: Migration | Week 5 | Gradual rollout, monitoring, deprecation |

**Total Estimated Duration:** 5 weeks

## Appendix

### API Request/Response Examples

#### Login Request (New)
```json
POST /api/auth/login
{
  "email": "agent1@justaskshel.com",
  "password": "password123"
}
```

#### Login Response (User with organization)
```json
{
  "user": {
    "id": "user-123",
    "email": "agent1@justaskshel.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Agent",
    "privilegeLevel": 2,
    "organizationId": 1
  },
  "requiresOrganization": false,
  "organization": {
    "id": "b3JnXzFfc2FsdA==",
    "displayName": "ABC Insurance Agency",
    "role": "Agent"
  },
  "redirectTo": "/dashboard"
}
```

#### Login Response (User needs org selection)
```json
{
  "user": {
    "id": "user-456",
    "email": "admin@justaskshel.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "TenantAdmin",
    "privilegeLevel": 1,
    "organizationId": null
  },
  "requiresOrganization": true,
  "availableOrganizations": [
    {
      "id": "b3JnXzFfc2FsdA==",
      "displayName": "ABC Insurance",
      "description": "Main organization",
      "logoUrl": "https://...",
      "userRole": "TenantAdmin"
    },
    {
      "id": "b3JnXzJfc2FsdA==",
      "displayName": "XYZ Agency",
      "description": "Partner organization",
      "logoUrl": "https://...",
      "userRole": "Agent"
    }
  ],
  "hasNoAccess": false
}
```

#### Organization Selection Request
```json
POST /api/auth/session/organization
{
  "organizationId": "b3JnXzFfc2FsdA=="
}
```

#### Access Request Creation
```json
POST /api/organizations/access-requests
{
  "organizationId": "b3JnXzFfc2FsdA==",
  "requestReason": "I am a new agent joining this organization",
  "desiredRole": "Agent"
}

Response:
{
  "success": true,
  "requestId": 123,
  "status": "pending",
  "message": "Access request submitted. Admin will review shortly."
}
```

---

**End of Document**

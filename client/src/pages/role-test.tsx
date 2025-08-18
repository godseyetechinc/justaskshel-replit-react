import { useRoleAuth } from "@/hooks/useRoleAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, User, Shield, Eye, Edit3, Trash2 } from "lucide-react";

export default function RoleTest() {
  const {
    user,
    userRole,
    privilegeLevel,
    isAuthenticated,
    hasRole,
    hasMinimumPrivilegeLevel,
    canRead,
    canWrite,
    canDelete,
    canManageUsers,
    canManageSystem,
    canViewAllData,
    hasPermission,
    isAdmin,
    isAgent,
    isMember,
    isGuest,
    isVisitor
  } = useRoleAuth();

  const TestResult = ({ test, result }: { test: string; result: boolean }) => (
    <div className="flex items-center gap-2 p-2 rounded">
      {result ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      )}
      <span className={result ? "text-green-700" : "text-red-700"}>{test}</span>
    </div>
  );

  const resources = [
    'policies', 'applications', 'claims', 'contacts', 'quotes', 
    'members', 'public_content', 'insurance_types'
  ];

  const privilegeLevels = [1, 2, 3, 4, 5];
  const roles = ['Admin', 'Agent', 'Member', 'Guest', 'Visitor'] as const;

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to test role-based authorization</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Role-Based Authorization Test</h1>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{(user as any)?.firstName} {(user as any)?.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{(user as any)?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant={userRole === 'Admin' ? 'destructive' : userRole === 'Agent' ? 'default' : 'secondary'}>
                {userRole}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Privilege Level</p>
              <Badge variant="outline">{privilegeLevel}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Hierarchy Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Role Hierarchy Tests</CardTitle>
          <CardDescription>Testing if current user has access to various role levels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {roles.map(role => (
            <TestResult 
              key={role}
              test={`Has ${role} role access`} 
              result={hasRole(role)} 
            />
          ))}
        </CardContent>
      </Card>

      {/* Privilege Level Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Privilege Level Tests</CardTitle>
          <CardDescription>Testing minimum privilege level requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {privilegeLevels.map(level => (
            <TestResult 
              key={level}
              test={`Has privilege level ${level} or higher`} 
              result={hasMinimumPrivilegeLevel(level)} 
            />
          ))}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Read Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Read Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resources.map(resource => (
              <TestResult 
                key={resource}
                test={`Can read ${resource}`} 
                result={canRead(resource)} 
              />
            ))}
            <Separator className="my-2" />
            <TestResult test="Can read own data" result={canRead('policies', true)} />
          </CardContent>
        </Card>

        {/* Write Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Write Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resources.map(resource => (
              <TestResult 
                key={resource}
                test={`Can write ${resource}`} 
                result={canWrite(resource)} 
              />
            ))}
            <Separator className="my-2" />
            <TestResult test="Can write own data" result={canWrite('policies', true)} />
          </CardContent>
        </Card>

        {/* Delete Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resources.map(resource => (
              <TestResult 
                key={resource}
                test={`Can delete ${resource}`} 
                result={canDelete(resource)} 
              />
            ))}
            <Separator className="my-2" />
            <TestResult test="Can delete own data" result={canDelete('applications', true)} />
          </CardContent>
        </Card>

        {/* System Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <TestResult test="Can manage users" result={canManageUsers()} />
            <TestResult test="Can manage system" result={canManageSystem()} />
            <TestResult test="Can view all data" result={canViewAllData()} />
            <Separator className="my-2" />
            <TestResult test="Is Admin" result={isAdmin} />
            <TestResult test="Is Agent or higher" result={isAgent} />
            <TestResult test="Is Member or higher" result={isMember} />
            <TestResult test="Is Guest" result={isGuest} />
            <TestResult test="Is Visitor" result={isVisitor} />
          </CardContent>
        </Card>
      </div>

      {/* Specific Permission Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Specific Permission Tests</CardTitle>
          <CardDescription>Testing specific permission strings</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">General Permissions</h4>
            <TestResult test="manage_users permission" result={hasPermission('manage_users')} />
            <TestResult test="manage_system permission" result={hasPermission('manage_system')} />
            <TestResult test="view_all permission" result={hasPermission('view_all')} />
            <TestResult test="manage_claims permission" result={hasPermission('manage_claims')} />
            <TestResult test="create_applications permission" result={hasPermission('create_applications')} />
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Resource-Specific Permissions</h4>
            <TestResult test="Read policies permission" result={hasPermission('read', 'policies')} />
            <TestResult test="Write claims permission" result={hasPermission('write', 'claims')} />
            <TestResult test="Delete own applications permission" result={hasPermission('delete', 'applications', true)} />
            <TestResult test="Read public content permission" result={hasPermission('read', 'public_content')} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
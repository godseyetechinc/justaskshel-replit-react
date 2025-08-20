import { useAuth } from "./useAuth";
import type { UserRole } from "@shared/schema";
import { ROLE_PRIVILEGE_LEVELS, ROLE_PERMISSIONS } from "@shared/schema";

export function useRoleAuth() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const userRole = (user?.role || "Visitor") as UserRole;
  const privilegeLevel = user?.privilegeLevel || ROLE_PRIVILEGE_LEVELS.Visitor;

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!isAuthenticated || !user) return false;
    // SuperAdmin (privilege level 0) has access to everything
    if (privilegeLevel === 0) return true;
    return privilegeLevel <= ROLE_PRIVILEGE_LEVELS[requiredRole];
  };

  const hasAnyRole = (requiredRoles: UserRole[]): boolean => {
    if (!isAuthenticated || !user) return false;
    // SuperAdmin (privilege level 0) has access to everything
    if (privilegeLevel === 0) return true;
    return requiredRoles.some(role => hasRole(role));
  };

  const hasMinimumPrivilegeLevel = (requiredLevel: number): boolean => {
    if (!isAuthenticated || !user) return false;
    return privilegeLevel <= requiredLevel;
  };

  const canRead = (resource: string, isOwn: boolean = false): boolean => {
    if (!isAuthenticated && resource !== "public_content" && resource !== "insurance_types") {
      return false;
    }

    const permissions = ROLE_PERMISSIONS[userRole];
    
    if (permissions.resources.includes("all" as any)) {
      return true;
    }
    
    if (permissions.resources.includes(resource as any)) {
      return true;
    }

    if (isOwn && permissions.resources.some(r => r.startsWith("own_"))) {
      const ownResource = `own_${resource}`;
      return permissions.resources.includes(ownResource as any);
    }

    if (permissions.resources.includes("public_content" as any) && 
        ["public_content", "insurance_types"].includes(resource)) {
      return true;
    }

    return false;
  };

  const canWrite = (resource: string, isOwn: boolean = false): boolean => {
    if (!isAuthenticated || !user) return false;

    const permissions = ROLE_PERMISSIONS[userRole];
    
    if (permissions.privileges.includes("write" as any) && 
        (permissions.resources.includes("all" as any) || permissions.resources.includes(resource as any))) {
      return true;
    }

    if (isOwn && permissions.privileges.includes("write_own" as any)) {
      const ownResource = `own_${resource}`;
      return permissions.resources.includes(ownResource as any);
    }

    // Special permissions for specific actions
    if (permissions.privileges.includes("create_applications" as any) && resource === "applications") {
      return true;
    }

    if (permissions.privileges.includes("create_account" as any) && resource === "users") {
      return true;
    }

    return false;
  };

  const canDelete = (resource: string, isOwn: boolean = false): boolean => {
    if (!isAuthenticated || !user) return false;

    const permissions = ROLE_PERMISSIONS[userRole];
    
    if (permissions.privileges.includes("delete" as any) && 
        (permissions.resources.includes("all" as any) || permissions.resources.includes(resource as any))) {
      return true;
    }

    if (isOwn && permissions.privileges.includes("write_own" as any)) {
      const ownResource = `own_${resource}`;
      return permissions.resources.includes(ownResource as any);
    }

    return false;
  };

  const canManageUsers = (): boolean => {
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions.privileges.includes("manage_users" as any);
  };

  const canManageSystem = (): boolean => {
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions.privileges.includes("manage_system" as any);
  };

  const canManageRoles = (): boolean => {
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions.privileges.includes("manage_roles" as any);
  };

  const canViewAllData = (): boolean => {
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions.privileges.includes("view_all" as any) || permissions.resources.includes("all" as any);
  };

  const hasPermission = (permission: string, resource?: string, isOwn: boolean = false): boolean => {
    if (!resource) resource = "general";

    switch (permission) {
      case "read":
        return canRead(resource, isOwn);
      case "write":
        return canWrite(resource, isOwn);
      case "delete":
        return canDelete(resource, isOwn);
      case "manage_users":
        return canManageUsers();
      case "manage_system":
        return canManageSystem();
      case "manage_roles":
        return canManageRoles();
      case "view_all":
        return canViewAllData();
      default:
        const permissions = ROLE_PERMISSIONS[userRole];
        return permissions.privileges.includes(permission as any);
    }
  };

  return {
    user,
    userRole,
    privilegeLevel,
    isAuthenticated,
    isLoading,
    hasRole,
    hasAnyRole,
    hasMinimumPrivilegeLevel,
    hasPermission,
    canRead,
    canWrite,
    canDelete,
    canManageUsers,
    canManageSystem,
    canManageRoles,
    canViewAllData,
    // Role-specific helpers
    isSuperAdmin: userRole === "SuperAdmin",
    isTenantAdmin: userRole === "TenantAdmin",
    isAdmin: userRole === "TenantAdmin" || userRole === "SuperAdmin",
    isAgent: userRole === "Agent" || userRole === "TenantAdmin" || userRole === "SuperAdmin",
    isMember: ["Member", "Agent", "TenantAdmin", "SuperAdmin"].includes(userRole),
    isGuest: userRole === "Guest",
    isVisitor: userRole === "Visitor",
    // Privilege level helpers
    hasSuperAdminPrivileges: privilegeLevel === 0,
    hasTenantAdminPrivileges: privilegeLevel <= 1,
    hasAgentPrivileges: privilegeLevel <= 2,
    hasMemberPrivileges: privilegeLevel <= 3,
    hasGuestPrivileges: privilegeLevel <= 4,
  };
}
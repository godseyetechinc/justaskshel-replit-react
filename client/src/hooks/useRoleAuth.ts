import { useAuth } from "./useAuth";
import type { UserRole } from "@shared/schema";
import { ROLE_PRIVILEGE_LEVELS, ROLE_PERMISSIONS } from "@shared/schema";

export function useRoleAuth() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const userRole = (user?.role || "Visitor") as UserRole;
  const privilegeLevel = user?.privilegeLevel || ROLE_PRIVILEGE_LEVELS.Visitor;

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!isAuthenticated || !user) return false;
    return privilegeLevel <= ROLE_PRIVILEGE_LEVELS[requiredRole];
  };

  const hasAnyRole = (requiredRoles: UserRole[]): boolean => {
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
    
    if (permissions.resources.includes("all")) {
      return true;
    }
    
    if (permissions.resources.includes(resource)) {
      return true;
    }

    if (isOwn && permissions.resources.some(r => r.startsWith("own_"))) {
      const ownResource = `own_${resource}`;
      return permissions.resources.includes(ownResource);
    }

    if (permissions.resources.includes("public_content") && 
        ["public_content", "insurance_types"].includes(resource)) {
      return true;
    }

    return false;
  };

  const canWrite = (resource: string, isOwn: boolean = false): boolean => {
    if (!isAuthenticated || !user) return false;

    const permissions = ROLE_PERMISSIONS[userRole];
    
    if (permissions.privileges.includes("write") && 
        (permissions.resources.includes("all") || permissions.resources.includes(resource))) {
      return true;
    }

    if (isOwn && permissions.privileges.includes("write_own")) {
      const ownResource = `own_${resource}`;
      return permissions.resources.includes(ownResource);
    }

    // Special permissions for specific actions
    if (permissions.privileges.includes("create_applications") && resource === "applications") {
      return true;
    }

    if (permissions.privileges.includes("create_account") && resource === "users") {
      return true;
    }

    return false;
  };

  const canDelete = (resource: string, isOwn: boolean = false): boolean => {
    if (!isAuthenticated || !user) return false;

    const permissions = ROLE_PERMISSIONS[userRole];
    
    if (permissions.privileges.includes("delete") && 
        (permissions.resources.includes("all") || permissions.resources.includes(resource))) {
      return true;
    }

    if (isOwn && permissions.privileges.includes("write_own")) {
      const ownResource = `own_${resource}`;
      return permissions.resources.includes(ownResource);
    }

    return false;
  };

  const canManageUsers = (): boolean => {
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions.privileges.includes("manage_users");
  };

  const canManageSystem = (): boolean => {
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions.privileges.includes("manage_system");
  };

  const canManageRoles = (): boolean => {
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions.privileges.includes("manage_roles");
  };

  const canViewAllData = (): boolean => {
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions.privileges.includes("view_all") || permissions.resources.includes("all");
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
        return permissions.privileges.includes(permission);
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
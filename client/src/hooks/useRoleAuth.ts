import { useAuth } from "./useAuth";
import type { UserRole } from "@shared/schema";
import { ROLE_PRIVILEGE_LEVELS } from "@shared/schema";

export function useRoleAuth() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const userRole = (user?.role || "Visitor") as UserRole;
  const privilegeLevel = user?.privilegeLevel !== undefined ? user.privilegeLevel : ROLE_PRIVILEGE_LEVELS.Visitor;

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!isAuthenticated || !user) return false;
    // SuperAdmin (privilege level 0) has access to everything
    if (privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin) return true;
    return privilegeLevel <= ROLE_PRIVILEGE_LEVELS[requiredRole];
  };

  const hasAnyRole = (requiredRoles: UserRole[]): boolean => {
    if (!isAuthenticated || !user) return false;
    // SuperAdmin (privilege level 0) has access to everything
    if (privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin) return true;
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
    
    // SuperAdmin has access to everything
    if (privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin) return true;
    
    // For now, allow basic access for authenticated users
    return true;
  };

  const canWrite = (resource: string, isOwn: boolean = false): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // SuperAdmin has access to everything
    if (privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin) return true;
    
    // Allow write access based on privilege level
    return privilegeLevel <= ROLE_PRIVILEGE_LEVELS.Agent; // TenantAdmin and Agent can write
  };

  const canDelete = (resource: string, isOwn: boolean = false): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // SuperAdmin has access to everything
    if (privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin) return true;
    
    // Allow delete access for TenantAdmin and higher
    return privilegeLevel <= ROLE_PRIVILEGE_LEVELS.TenantAdmin;
  };

  const canManageUsers = (): boolean => {
    if (privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin) return true; // SuperAdmin
    return privilegeLevel <= ROLE_PRIVILEGE_LEVELS.TenantAdmin; // TenantAdmin
  };

  const canManageSystem = (): boolean => {
    if (privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin) return true; // SuperAdmin
    return privilegeLevel <= ROLE_PRIVILEGE_LEVELS.TenantAdmin; // TenantAdmin
  };

  const canManageRoles = (): boolean => {
    return privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin; // Only SuperAdmin
  };

  const canViewAllData = (): boolean => {
    if (privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin) return true; // SuperAdmin
    return privilegeLevel <= ROLE_PRIVILEGE_LEVELS.TenantAdmin; // TenantAdmin
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
        // SuperAdmin has all permissions
        if (privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin) return true;
        return false;
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
    isTenantAdmin: userRole === "TenantAdmin", // Deprecated: use isTenantAdmin
    isAdmin: userRole === "TenantAdmin" || userRole === "SuperAdmin",
    isAgent: userRole === "Agent" || userRole === "TenantAdmin" || userRole === "SuperAdmin",
    isMember: ["Member", "Agent", "TenantAdmin", "SuperAdmin"].includes(userRole),
    isGuest: userRole === "Guest",
    isVisitor: userRole === "Visitor",
    // Privilege level helpers
    hasSuperAdminPrivileges: privilegeLevel === ROLE_PRIVILEGE_LEVELS.SuperAdmin,
    hasTenantAdminPrivileges: privilegeLevel <= ROLE_PRIVILEGE_LEVELS.TenantAdmin,
    hasTenantAdminPrivileges: privilegeLevel <= ROLE_PRIVILEGE_LEVELS.TenantAdmin, // Deprecated: use hasTenantAdminPrivileges
    hasAgentPrivileges: privilegeLevel <= ROLE_PRIVILEGE_LEVELS.Agent,
    hasMemberPrivileges: privilegeLevel <= 3,
    hasGuestPrivileges: privilegeLevel <= 4,
  };
}
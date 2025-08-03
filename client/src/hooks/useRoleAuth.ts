import { useAuth } from "./useAuth";
import type { UserRole } from "@shared/schema";

export function useRoleAuth() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const userRole = (user?.role || "Visitor") as UserRole;

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!isAuthenticated || !user) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      "Visitor": 0,
      "Member": 1,
      "Agent": 2,
      "Admin": 3
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  };

  const hasAnyRole = (requiredRoles: UserRole[]): boolean => {
    return requiredRoles.some(role => hasRole(role));
  };

  const canRead = (resource: string): boolean => {
    switch (userRole) {
      case "Admin":
      case "Agent":
        return true;
      case "Member":
        return ["policies", "applications", "points", "dependents"].includes(resource);
      case "Visitor":
        return ["public"].includes(resource);
      default:
        return false;
    }
  };

  const canWrite = (resource: string, isOwn: boolean = false): boolean => {
    switch (userRole) {
      case "Admin":
      case "Agent":
        return true;
      case "Member":
        return isOwn && ["policies", "applications", "points", "dependents"].includes(resource);
      case "Visitor":
        return false;
      default:
        return false;
    }
  };

  const canDelete = (resource: string, isOwn: boolean = false): boolean => {
    switch (userRole) {
      case "Admin":
        return true;
      case "Agent":
        return !["users"].includes(resource);
      case "Member":
        return isOwn && ["applications", "dependents"].includes(resource);
      case "Visitor":
        return false;
      default:
        return false;
    }
  };

  const canManageUsers = (): boolean => {
    return userRole === "Admin";
  };

  const hasPermission = (permission: "read" | "write" | "delete"): boolean => {
    switch (permission) {
      case "read":
        return canRead("general");
      case "write":
        return canWrite("general");
      case "delete":
        return canDelete("general");
      default:
        return false;
    }
  };

  return {
    user,
    userRole,
    isAuthenticated,
    isLoading,
    hasRole,
    hasAnyRole,
    hasPermission,
    canRead,
    canWrite,
    canDelete,
    canManageUsers,
    isAdmin: userRole === "Admin",
    isAgent: userRole === "Agent" || userRole === "Admin",
    isMember: userRole === "Member" || userRole === "Agent" || userRole === "Admin",
    isVisitor: userRole === "Visitor"
  };
}
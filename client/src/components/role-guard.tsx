import { useRoleAuth } from "@/hooks/useRoleAuth";
import type { UserRole } from "@shared/schema";

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, requiredRoles, fallback = null }: RoleGuardProps) {
  const { hasAnyRole } = useRoleAuth();
  
  if (!hasAnyRole(requiredRoles)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

interface PrivilegeGuardProps {
  children: React.ReactNode;
  minPrivilegeLevel: number;
  fallback?: React.ReactNode;
}

export function PrivilegeGuard({ children, minPrivilegeLevel, fallback = null }: PrivilegeGuardProps) {
  const { hasPrivilegeLevel } = useRoleAuth();
  
  if (!hasPrivilegeLevel(minPrivilegeLevel)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

interface ConditionalRenderProps {
  children: React.ReactNode;
  condition: boolean;
  fallback?: React.ReactNode;
}

export function ConditionalRender({ children, condition, fallback = null }: ConditionalRenderProps) {
  return condition ? <>{children}</> : <>{fallback}</>;
}
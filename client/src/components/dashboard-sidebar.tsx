import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { useLogout } from "@/hooks/useLogout";
import {
  Users,
  UserCheck,
  FileText,
  Shield,
  Star,
  UserPlus,
  UserX,
  Settings,
  BarChart3,
  Menu,
  X,
  Home,
  Phone,
  Briefcase,
  Key,
  Gift,
  Building,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserRole } from "@shared/schema";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  roles: UserRole[];
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
    roles: ["Admin", "Agent", "Member", "Guest"],
  },
  {
    id: "members",
    label: "Members",
    icon: Users,
    href: "/dashboard/members",
    roles: ["Admin", "Agent"],
  },
  {
    id: "organizations",
    label: "Organizations",
    icon: Building,
    href: "/dashboard/organizations",
    roles: ["Admin"],
  },
  {
    id: "my-profile",
    label: "My Profile",
    icon: Settings,
    href: "/dashboard/my-profile",
    roles: ["Member"],
  },
  {
    id: "contacts",
    label: "Contacts",
    icon: Phone,
    href: "/dashboard/contacts",
    roles: ["Admin", "Agent"],
  },
  {
    id: "insurance-applications",
    label: "Applications",
    icon: FileText,
    href: "/dashboard/applications",
    roles: ["Admin", "Agent", "Member", "Guest"],
  },
  {
    id: "insurance-policies",
    label: "Policies",
    icon: Shield,
    href: "/dashboard/policies",
    roles: ["Admin", "Agent", "Member"],
  },
  {
    id: "wishlist",
    label: "Wishlist",
    icon: Star,
    href: "/dashboard/wishlist",
    roles: ["Admin", "Agent", "Member"],
  },
  {
    id: "loyalty-points",
    label: "Loyalty Points",
    icon: Star,
    href: "/dashboard/points",
    roles: ["Admin", "Agent", "Member"],
  },
  {
    id: "rewards-management",
    label: "Rewards Management",
    icon: Gift,
    href: "/dashboard/rewards-management",
    roles: ["Admin"],
  },
  {
    id: "dependents",
    label: "Dependents",
    icon: Users,
    href: "/dashboard/dependents",
    roles: ["Admin", "Agent", "Member"],
  },
  {
    id: "claims",
    label: "Claims Workflow",
    icon: FileText,
    href: "/dashboard/claims",
    roles: ["Admin", "Agent", "Member"],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    href: "/dashboard/analytics",
    roles: ["Admin", "Agent"],
  },
  {
    id: "user-management",
    label: "User Management",
    icon: Settings,
    href: "/dashboard/user-management",
    roles: ["Admin"],
  },
  {
    id: "password-management",
    label: "Password Management",
    icon: Key,
    href: "/dashboard/password-management",
    roles: ["Admin", "Agent", "Member"],
  },
  {
    id: "profile",
    label: "My Profile",
    icon: UserCheck,
    href: "/dashboard/profile",
    roles: ["Admin", "Agent", "Member"],
  },
];

export default function DashboardSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  const { userRole, hasAnyRole } = useRoleAuth();
  const { logout, isLoggingOut } = useLogout();

  // Type-safe user object
  const typedUser = user as any;

  const filteredMenuItems = menuItems.filter((item) => hasAnyRole(item.roles));

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/dashboard" || location === "/";
    }
    return location.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* User Info */}
      <div
        className={cn(
          "p-4 border-b border-gray-200 bg-gray-50",
          isCollapsed && "px-2",
        )}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
            {typedUser?.firstName?.[0] || typedUser?.email?.[0] || "U"}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {typedUser?.firstName} {typedUser?.lastName}
              </p>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={userRole === "Admin" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {userRole}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link key={item.id} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                  active
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100",
                  isCollapsed && "justify-center px-2",
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0")} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium truncate">
                      {item.label}
                    </span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="outline"
          className={cn("w-full", isCollapsed && "px-2")}
          onClick={logout}
          disabled={isLoggingOut}
        >
          <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && (isLoggingOut ? "Logging out..." : "Sign Out")}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:flex flex-col h-full transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent />
      </div>
    </>
  );
}

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
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
  Briefcase
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
    roles: ["Admin", "Agent", "Member"]
  },
  {
    id: "members",
    label: "Members",
    icon: Users,
    href: "/dashboard/members",
    roles: ["Admin", "Agent"]
  },
  {
    id: "contacts",
    label: "Contacts",
    icon: Phone,
    href: "/dashboard/contacts",
    roles: ["Admin", "Agent"]
  },
  {
    id: "applications",
    label: "Applications",
    icon: FileText,
    href: "/dashboard/applications",
    roles: ["Admin", "Agent", "Member"]
  },
  {
    id: "policies",
    label: "Insurance Policies",
    icon: Shield,
    href: "/dashboard/policies",
    roles: ["Admin", "Agent", "Member"]
  },
  {
    id: "points",
    label: "Points System",
    icon: Star,
    href: "/dashboard/points",
    roles: ["Admin", "Agent", "Member"]
  },
  {
    id: "applicants",
    label: "Applicants",
    icon: UserPlus,
    href: "/dashboard/applicants",
    roles: ["Admin", "Agent"]
  },
  {
    id: "dependents",
    label: "Applicant Dependents",
    icon: UserX,
    href: "/dashboard/applicant-dependents",
    roles: ["Admin", "Agent"]
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    href: "/dashboard/analytics",
    roles: ["Admin", "Agent"]
  },
  {
    id: "user-management",
    label: "User Management",
    icon: Settings,
    href: "/dashboard/user-management",
    roles: ["Admin"]
  }
];

export default function DashboardSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  const userRole = (user?.role || "Visitor") as UserRole;

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

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
          <h2 className="text-lg font-semibold text-gray-900">
            Dashboard
          </h2>
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
      <div className={cn(
        "p-4 border-b border-gray-200 bg-gray-50",
        isCollapsed && "px-2"
      )}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
            {user?.firstName?.[0] || user?.email?.[0] || "U"}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
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
                  isCollapsed && "justify-center px-2"
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
        <Link href="/api/logout">
          <Button 
            variant="outline" 
            className={cn(
              "w-full",
              isCollapsed && "px-2"
            )}
          >
            {isCollapsed ? "•••" : "Sign Out"}
          </Button>
        </Link>
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
      <div className={cn(
        "hidden lg:flex flex-col h-full transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform lg:hidden",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </div>
    </>
  );
}
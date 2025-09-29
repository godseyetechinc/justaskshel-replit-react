import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { useLogout } from "@/hooks/useLogout";
import {
  Users,
  User,
  FileText,
  Shield,
  Star,
  UserPlus,
  UserX,
  Settings,
  BarChart3,
  TrendingUp,
  Menu,
  X,
  Home,
  Phone,
  Briefcase,
  Key,
  Gift,
  Building,
  LogOut,
  Trophy,
  Bell,
  UserCheck,
  Users2,
  Brain,
  Calendar,
  ChevronDown,
  ChevronRight,
  Globe,
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
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  defaultExpanded?: boolean;
  roles: UserRole[];
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    id: "overview",
    label: "Overview",
    icon: Home,
    defaultExpanded: true,
    roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member", "Guest"],
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: Home,
        href: "/dashboard",
        roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member", "Guest"],
      },
      {
        id: "profile",
        label: "My Profile",
        icon: User,
        href: "/dashboard/profile",
        roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
        href: "/dashboard/notifications",
        roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
      },
    ],
  },
  {
    id: "people-contacts",
    label: "People & Contacts",
    icon: Users,
    defaultExpanded: false,
    roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
    items: [
      {
        id: "members",
        label: "Members",
        icon: Users,
        href: "/dashboard/members",
        roles: ["SuperAdmin", "TenantAdmin", "Agent"],
      },
      {
        id: "contacts",
        label: "Contacts",
        icon: Phone,
        href: "/dashboard/contacts",
        roles: ["SuperAdmin", "TenantAdmin", "Agent"],
      },
      {
        id: "dependents",
        label: "Dependents",
        icon: Users,
        href: "/dashboard/dependents",
        roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
      },
      {
        id: "my-agent",
        label: "My Agent",
        icon: Users,
        href: "/dashboard/my-agent",
        roles: ["Member"],
      },
      {
        id: "user-management",
        label: "User Management",
        icon: Settings,
        href: "/dashboard/user-management",
        roles: ["SuperAdmin"],
      },
    ],
  },
  {
    id: "insurance-policies",
    label: "Insurance & Policies",
    icon: Shield,
    defaultExpanded: false,
    roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
    items: [
      {
        id: "policies",
        label: "Policies",
        icon: Shield,
        href: "/dashboard/policies",
        roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
      },
      {
        id: "wishlist",
        label: "Wishlist",
        icon: Star,
        href: "/dashboard/wishlist",
        roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
      },
      {
        id: "claims",
        label: "Claims Workflow",
        icon: FileText,
        href: "/dashboard/claims-workflow",
        roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
      },
      {
        id: "provider-management",
        label: "Provider Management",
        icon: Settings,
        href: "/dashboard/admin/provider-management",
        roles: ["SuperAdmin"],
      },
    ],
  },
  {
    id: "loyalty-rewards",
    label: "Loyalty & Rewards",
    icon: Gift,
    defaultExpanded: false,
    roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
    items: [
      {
        id: "loyalty-points",
        label: "Loyalty Points",
        icon: Star,
        href: "/dashboard/points",
        roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
      },
      {
        id: "achievements",
        label: "Achievements",
        icon: Trophy,
        href: "/dashboard/achievements",
        roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
      },
      {
        id: "referrals",
        label: "Referrals",
        icon: UserCheck,
        href: "/dashboard/referrals",
        roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
      },
      {
        id: "rewards-management",
        label: "Rewards Management",
        icon: Gift,
        href: "/dashboard/rewards-management",
        roles: ["SuperAdmin"],
      },
      {
        id: "advanced-redemptions",
        label: "Advanced Redemptions",
        icon: Brain,
        href: "/dashboard/advanced-redemptions",
        roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
      },
      {
        id: "seasonal-campaigns",
        label: "Seasonal Campaigns",
        icon: Calendar,
        href: "/dashboard/seasonal-campaigns",
        roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
      },
    ],
  },
  {
    id: "analytics-insights",
    label: "Analytics & Insights",
    icon: BarChart3,
    defaultExpanded: false,
    roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
    items: [
      {
        id: "analytics",
        label: "Analytics",
        icon: BarChart3,
        href: "/dashboard/analytics",
        roles: ["SuperAdmin", "TenantAdmin", "Agent"],
      },
      {
        id: "points-analytics",
        label: "Points Analytics",
        icon: TrendingUp,
        href: "/dashboard/points-analytics",
        roles: ["SuperAdmin", "TenantAdmin"],
      },
      {
        id: "user-insights",
        label: "My Points Insights",
        icon: Star,
        href: "/dashboard/user-insights",
        roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
      },
    ],
  },
  {
    id: "social-community",
    label: "Social & Community",
    icon: Globe,
    defaultExpanded: false,
    roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
    items: [
      {
        id: "social-features",
        label: "Social Features",
        icon: Users2,
        href: "/dashboard/social-features",
        roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
      },
      {
        id: "organizations",
        label: "Organizations",
        icon: Building,
        href: "/dashboard/organizations",
        roles: ["SuperAdmin"],
      },
      {
        id: "organization-profile",
        label: "Organization",
        icon: Building,
        href: "/dashboard/organization-profile",
        roles: ["TenantAdmin"],
      },
    ],
  },
  {
    id: "settings-security",
    label: "Settings & Security",
    icon: Settings,
    defaultExpanded: false,
    roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
    items: [
      {
        id: "password-management",
        label: "Password Management",
        icon: Key,
        href: "/dashboard/password-management",
        roles: ["SuperAdmin", "TenantAdmin", "Agent", "Member"],
      },
    ],
  },
];

export default function DashboardSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  const { userRole, hasAnyRole } = useRoleAuth();
  const { logout, isLoggingOut } = useLogout();

  // Initialize expanded groups from localStorage or defaults
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar-expanded-groups');
      if (stored) {
        try {
          return new Set(JSON.parse(stored));
        } catch {
          // Fallback to defaults if parsing fails
        }
      }
    }
    // Default expanded groups
    return new Set(menuGroups.filter(group => group.defaultExpanded).map(group => group.id));
  });

  // Type-safe user object
  const typedUser = user as any;

  // Filter groups and their items based on user roles
  const filteredMenuGroups = menuGroups
    .filter((group) => hasAnyRole(group.roles))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasAnyRole(item.roles)),
    }))
    .filter((group) => group.items.length > 0); // Only show groups with accessible items

  // Persist expanded state to localStorage
  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-expanded-groups', JSON.stringify([...newExpanded]));
    }
  };

  // Auto-expand group containing current active page
  const autoExpandActiveGroup = () => {
    for (const group of filteredMenuGroups) {
      for (const item of group.items) {
        if (isActive(item.href)) {
          if (!expandedGroups.has(group.id)) {
            const newExpanded = new Set(expandedGroups);
            newExpanded.add(group.id);
            setExpandedGroups(newExpanded);
            if (typeof window !== 'undefined') {
              localStorage.setItem('sidebar-expanded-groups', JSON.stringify([...newExpanded]));
            }
          }
          return;
        }
      }
    }
  };

  // Auto-expand on location change
  useEffect(() => {
    autoExpandActiveGroup();
  }, [location, filteredMenuGroups, expandedGroups]);

  // Keyboard navigation support
  const handleKeyDown = (event: React.KeyboardEvent, groupId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleGroupExpansion(groupId);
    }
  };

  const handleItemKeyDown = (event: React.KeyboardEvent, href: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      window.location.href = href;
    }
  };

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
                  variant={userRole === "TenantAdmin" ? "default" : "secondary"}
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
      <nav 
        className="flex-1 p-4 space-y-1 overflow-y-auto"
        role="navigation"
        aria-label="Main navigation"
      >
        {filteredMenuGroups.map((group) => {
          const GroupIcon = group.icon;
          const isExpanded = expandedGroups.has(group.id);
          const hasActiveItem = group.items.some(item => isActive(item.href));

          return (
            <div key={group.id} className="space-y-1" role="group" aria-labelledby={`group-${group.id}`}>
              {/* Group Header */}
              <button
                id={`group-${group.id}`}
                onClick={() => toggleGroupExpansion(group.id)}
                onKeyDown={(e) => handleKeyDown(e, group.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                  hasActiveItem
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                  isCollapsed && "justify-center px-2",
                )}
                aria-expanded={isExpanded}
                aria-controls={`group-items-${group.id}`}
                aria-label={`${group.label} group, ${group.items.length} items${isExpanded ? ', expanded' : ', collapsed'}`}
                data-testid={`group-header-${group.id}`}
                type="button"
              >
                <GroupIcon className={cn("h-5 w-5 flex-shrink-0")} aria-hidden="true" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-sm font-semibold truncate">
                      {group.label}
                    </span>
                    <div className="flex items-center space-x-1">
                      {/* Badge for number of items */}
                      {group.items.length > 0 && (
                        <Badge 
                          variant="outline" 
                          className="text-xs h-5 px-1.5"
                          aria-label={`${group.items.length} items`}
                        >
                          {group.items.length}
                        </Badge>
                      )}
                      {/* Expand/collapse chevron */}
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      )}
                    </div>
                  </>
                )}
              </button>

              {/* Group Items */}
              {!isCollapsed && isExpanded && (
                <div 
                  id={`group-items-${group.id}`}
                  className="ml-6 space-y-1 overflow-hidden transition-all duration-300 ease-in-out"
                  data-testid={`group-items-${group.id}`}
                  role="group"
                  aria-labelledby={`group-${group.id}`}
                >
                  {group.items.map((item, index) => {
                    const ItemIcon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link key={item.id} href={item.href}>
                        <div
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                            active
                              ? "bg-primary text-white"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
                          )}
                          onClick={() => setIsMobileOpen(false)}
                          onKeyDown={(e) => handleItemKeyDown(e, item.href)}
                          data-testid={`menu-item-${item.id}`}
                          role="menuitem"
                          tabIndex={0}
                          aria-label={`${item.label}${active ? ' (current page)' : ''}${item.badge ? `, ${item.badge} notifications` : ''}`}
                        >
                          <ItemIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                          <span className="flex-1 text-sm font-medium truncate">
                            {item.label}
                          </span>
                          {item.badge && (
                            <Badge 
                              variant="secondary" 
                              className="text-xs"
                              aria-label={`${item.badge} notifications`}
                            >
                              {item.badge}
                            </Badge>
                          )}
                          {active && (
                            <span className="sr-only">(current page)</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Collapsed state: show tooltip on hover */}
              {isCollapsed && (
                <div className="relative group">
                  <div 
                    className="invisible group-hover:visible absolute left-full top-0 ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded shadow-lg whitespace-nowrap z-50 dark:bg-gray-100 dark:text-gray-900"
                    role="tooltip"
                    aria-label={group.label}
                  >
                    {group.label}
                  </div>
                </div>
              )}
            </div>
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

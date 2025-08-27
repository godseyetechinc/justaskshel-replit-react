import { useAuth } from "@/hooks/useAuth";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { useLogout } from "@/hooks/useLogout";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X, ChevronDown, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import jasBrandLogo from "@/assets/jas-brand-logo.svg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleGuard } from "./role-guard";

export default function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const { userRole, isAdmin, isAgent, isMember } = useRoleAuth();
  const { logout, isLoggingOut } = useLogout();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Type-safe user object
  const typedUser = user as any;

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Needs Analysis", href: "/needs-analysis" },
    { name: "Compare Quotes", href: "/quotes" },
    { name: "Claims", href: "/claims-assistance" },
  ];

  const coverageTypes = [
    { name: "Life Coverage", href: "/life-insurance" },
    { name: "Health Coverage", href: "/health-insurance" },
    { name: "Dental Coverage", href: "/dental-insurance" },
    { name: "Vision Coverage", href: "/vision-insurance" },
    { name: "Hospital Indemnity", href: "/hospital-indemnity-insurance" },
    { name: "Discount Health Plans", href: "/discount-health-insurance" },
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <nav
      className="bg-white sticky top-0 z-50"
      style={{ boxShadow: "var(--elevation-2)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity flex items-center">
                <img
                  src={jasBrandLogo}
                  alt="Reliable Insurance Solutions"
                  className="h-10 w-auto mr-3"
                />
                <h1 className="text-2xl font-medium text-primary">
                  JustAskShel
                </h1>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <span
                      className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md cursor-pointer ${
                        isActive(item.href)
                          ? "text-white bg-primary shadow-md"
                          : "text-gray-700 hover:text-primary hover:bg-gray-50"
                      }`}
                    >
                      {item.name}
                    </span>
                  </Link>
                ))}

                {/* Coverage Types Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md ${
                        coverageTypes.some((type) => isActive(type.href))
                          ? "text-white bg-primary shadow-md"
                          : "text-gray-700 hover:text-primary hover:bg-gray-50"
                      }`}
                    >
                      Coverage
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/insurance-types">
                        <span className="w-full">View All Coverage Types</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {coverageTypes.map((type) => (
                      <DropdownMenuItem key={type.name} asChild>
                        <Link href={type.href}>
                          <span className="w-full">{type.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={typedUser?.profileImageUrl || ""}
                          alt={typedUser?.firstName || "User"}
                        />
                        <AvatarFallback>
                          {typedUser?.firstName?.charAt(0) ||
                            typedUser?.email?.charAt(0) ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none">
                        {typedUser?.firstName || typedUser?.lastName
                          ? `${typedUser?.firstName || ""} ${typedUser?.lastName || ""}`.trim()
                          : "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {typedUser?.email}
                      </p>
                      <p className="text-xs text-primary font-medium">
                        {userRole}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    
                    <RoleGuard requiredRoles={["Admin", "Agent", "Member"]}>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/policies">My Policies</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/applications">My Applications</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/claims">My Claims</Link>
                      </DropdownMenuItem>
                    </RoleGuard>
                    
                    <RoleGuard requiredRoles={["Admin", "Agent"]}>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/contacts">Contacts</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/members">Members</Link>
                      </DropdownMenuItem>
                    </RoleGuard>
                    
                    <RoleGuard requiredRoles={["Admin"]}>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/user-management">User Management</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/analytics">Analytics</Link>
                      </DropdownMenuItem>
                    </RoleGuard>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? "Logging out..." : "Log out"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" data-testid="button-nav-login">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button data-testid="button-nav-signup">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <span
                    className={`block px-3 py-2 text-base font-medium transition-colors cursor-pointer ${
                      isActive(item.href)
                        ? "text-primary bg-primary/10"
                        : "text-gray-500 hover:text-primary hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </span>
                </Link>
              ))}

              {/* Coverage Types Section */}
              <div className="pt-2">
                <Link href="/insurance-types">
                  <span
                    className={`block px-3 py-2 text-base font-medium transition-colors cursor-pointer ${
                      isActive("/insurance-types")
                        ? "text-primary bg-primary/10"
                        : "text-gray-500 hover:text-primary hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    All Coverage Types
                  </span>
                </Link>

                {coverageTypes.map((type) => (
                  <Link key={type.name} href={type.href}>
                    <span
                      className={`block px-6 py-2 text-sm font-medium transition-colors cursor-pointer ${
                        isActive(type.href)
                          ? "text-primary bg-primary/10"
                          : "text-gray-400 hover:text-primary hover:bg-gray-50"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {type.name}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Mobile Auth Section */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                {isAuthenticated && user ? (
                  <>
                    <Link href="/dashboard">
                      <span
                        className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md border border-gray-300 cursor-pointer"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Dashboard
                      </span>
                    </Link>
                    <Link href="/quotes">
                      <span
                        className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-primary hover:bg-gray-50 cursor-pointer"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        My Quotes
                      </span>
                    </Link>
                    <button
                      className="block w-full text-left px-3 py-2 text-base font-medium text-gray-500 hover:text-primary hover:bg-gray-50"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? "Logging out..." : "Sign Out"}
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <span
                        className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-primary hover:bg-gray-50 cursor-pointer"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </span>
                    </Link>
                    <Link href="/signup">
                      <span
                        className="block px-3 py-2 text-base font-medium text-primary hover:bg-primary/10 cursor-pointer"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started
                      </span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

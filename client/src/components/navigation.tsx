import { useAuth } from "@/hooks/useAuth";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { useLogout } from "@/hooks/useLogout";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X, ChevronDown, Settings, Heart, Users, FileText, HelpCircle, Phone, Grid3X3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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

  // Fetch wishlist count
  const { data: wishlist } = useQuery({
    queryKey: ["/api/wishlist"],
    enabled: isAuthenticated,
  });

  const wishlistCount = wishlist?.length || 0;

  const mainNavigation = [
    { name: "Home", href: "/", icon: null },
    { name: "Get Quotes", href: "/quotes", icon: null },
    { name: "Needs Analysis", href: "/needs-analysis", icon: null },
  ];

  const coverageTypes = [
    { 
      name: "Life Insurance", 
      href: "/life-insurance",
      description: "Protect your family's financial future",
      icon: "👨‍👩‍👧‍👦"
    },
    { 
      name: "Health Insurance", 
      href: "/health-insurance",
      description: "Comprehensive medical coverage",
      icon: "🏥"
    },
    { 
      name: "Dental Insurance", 
      href: "/dental-insurance",
      description: "Oral health and dental care",
      icon: "🦷"
    },
    { 
      name: "Vision Insurance", 
      href: "/vision-insurance",
      description: "Eye care and vision services",
      icon: "👁️"
    },
    { 
      name: "Hospital Indemnity", 
      href: "/hospital-indemnity-insurance",
      description: "Additional hospital stay coverage",
      icon: "🏥"
    },
    { 
      name: "Discount Health Plans", 
      href: "/discount-health-insurance",
      description: "Affordable healthcare savings",
      icon: "💰"
    },
  ];

  const resourcesMenu = [
    {
      name: "Claims Assistance",
      href: "/claims-assistance", 
      description: "Help with filing and managing claims",
      icon: "📋"
    },
    {
      name: "About Us",
      href: "/about-us",
      description: "Learn about our company",
      icon: "ℹ️"
    },
    {
      name: "Privacy Policy",
      href: "/privacy-policy",
      description: "How we protect your information",
      icon: "🔒"
    },
    {
      name: "Terms of Service",
      href: "/terms-of-service",
      description: "Our service terms and conditions",
      icon: "📜"
    },
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
            <div className="hidden lg:block ml-8">
              <div className="flex items-center space-x-1">
                {mainNavigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <span
                      className={`px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md cursor-pointer ${
                        isActive(item.href)
                          ? "text-white bg-primary shadow-md"
                          : "text-gray-700 hover:text-primary hover:bg-gray-50"
                      }`}
                    >
                      {item.name}
                    </span>
                  </Link>
                ))}

                {/* Coverage Types Mega Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md ${
                        coverageTypes.some((type) => isActive(type.href))
                          ? "text-white bg-primary shadow-md"
                          : "text-gray-700 hover:text-primary hover:bg-gray-50"
                      }`}
                    >
                      Coverage
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-96 p-4">
                    <div className="mb-3">
                      <Link href="/insurance-types">
                        <Button variant="outline" size="sm" className="w-full">
                          <Grid3X3 className="h-4 w-4 mr-2" />
                          View All Coverage Types
                        </Button>
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {coverageTypes.map((type) => (
                        <Link key={type.name} href={type.href}>
                          <div className="p-3 rounded-lg border hover:bg-gray-50 hover:border-primary/50 transition-all cursor-pointer group">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{type.icon}</span>
                              <h4 className="font-medium text-sm group-hover:text-primary">
                                {type.name}
                              </h4>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {type.description}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Resources Mega Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md ${
                        resourcesMenu.some((item) => isActive(item.href))
                          ? "text-white bg-primary shadow-md"
                          : "text-gray-700 hover:text-primary hover:bg-gray-50"
                      }`}
                    >
                      Resources
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 p-4">
                    <div className="grid grid-cols-1 gap-2">
                      {resourcesMenu.map((item) => (
                        <Link key={item.name} href={item.href}>
                          <div className="p-3 rounded-lg border hover:bg-gray-50 hover:border-primary/50 transition-all cursor-pointer group">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{item.icon}</span>
                              <div>
                                <h4 className="font-medium text-sm group-hover:text-primary">
                                  {item.name}
                                </h4>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden lg:flex items-center space-x-3">
            {isAuthenticated && user ? (
              <>
                {/* Wishlist Button with Count Badge */}
                <Link href="/dashboard/wishlist">
                  <Button variant="outline" size="sm" className="relative">
                    <Heart className="h-4 w-4 mr-2" />
                    Wishlist
                    {wishlistCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </Button>
                </Link>
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
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/wishlist">
                        <div className="flex items-center justify-between w-full">
                          <span>Wishlist</span>
                          {wishlistCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {wishlistCount}
                            </span>
                          )}
                        </div>
                      </Link>
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
          <div className="lg:hidden">
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
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {mainNavigation.map((item) => (
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
              <div className="pt-4 border-t border-gray-200 mt-4">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Insurance Coverage
                </div>
                <Link href="/insurance-types">
                  <span
                    className={`flex items-center px-3 py-3 text-sm font-medium transition-colors cursor-pointer rounded-lg mx-2 ${
                      isActive("/insurance-types")
                        ? "text-primary bg-primary/10"
                        : "text-gray-600 hover:text-primary hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Grid3X3 className="h-4 w-4 mr-3" />
                    All Coverage Types
                  </span>
                </Link>

                <div className="mt-2 space-y-1">
                  {coverageTypes.map((type) => (
                    <Link key={type.name} href={type.href}>
                      <div
                        className={`flex items-center px-3 py-3 mx-2 rounded-lg transition-colors cursor-pointer ${
                          isActive(type.href)
                            ? "text-primary bg-primary/10"
                            : "text-gray-600 hover:text-primary hover:bg-gray-50"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="text-base mr-3">{type.icon}</span>
                        <div>
                          <div className="text-sm font-medium">{type.name}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Resources Section */}
              <div className="pt-4 border-t border-gray-200 mt-4">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Resources & Support
                </div>
                <div className="space-y-1">
                  {resourcesMenu.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <div
                        className={`flex items-center px-3 py-3 mx-2 rounded-lg transition-colors cursor-pointer ${
                          isActive(item.href)
                            ? "text-primary bg-primary/10"
                            : "text-gray-600 hover:text-primary hover:bg-gray-50"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="text-base mr-3">{item.icon}</span>
                        <div>
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.description}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Auth Section */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                {isAuthenticated && user ? (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Account
                    </div>
                    <Link href="/dashboard">
                      <div
                        className="flex items-center px-3 py-3 mx-2 rounded-lg transition-colors cursor-pointer bg-primary text-white"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        <span className="font-medium">Dashboard</span>
                      </div>
                    </Link>
                    <Link href="/dashboard/wishlist">
                      <div
                        className="flex items-center justify-between px-3 py-3 mx-2 rounded-lg transition-colors cursor-pointer text-gray-600 hover:text-primary hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-3" />
                          <span className="font-medium">Wishlist</span>
                        </div>
                        {wishlistCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {wishlistCount}
                          </span>
                        )}
                      </div>
                    </Link>
                    <button
                      className="w-full flex items-center px-3 py-3 mx-2 rounded-lg transition-colors text-gray-600 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      disabled={isLoggingOut}
                    >
                      <span className="text-base mr-3">🚪</span>
                      <span className="font-medium">
                        {isLoggingOut ? "Logging out..." : "Sign Out"}
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Get Started
                    </div>
                    <Link href="/login">
                      <div
                        className="flex items-center px-3 py-3 mx-2 rounded-lg transition-colors cursor-pointer text-gray-600 hover:text-primary hover:bg-gray-50 border"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="text-base mr-3">👤</span>
                        <span className="font-medium">Sign In</span>
                      </div>
                    </Link>
                    <Link href="/signup">
                      <div
                        className="flex items-center px-3 py-3 mx-2 rounded-lg transition-colors cursor-pointer bg-primary text-white"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="text-base mr-3">🚀</span>
                        <span className="font-medium">Get Started</span>
                      </div>
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

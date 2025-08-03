import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X, ChevronDown } from "lucide-react";
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

export default function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "/" },
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
                  InsureScope
                </h1>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <a
                      className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md ${
                        isActive(item.href)
                          ? "text-white bg-primary shadow-md"
                          : "text-gray-700 hover:text-primary hover:bg-gray-50"
                      }`}
                    >
                      {item.name}
                    </a>
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
                        <a className="w-full">View All Coverage Types</a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {coverageTypes.map((type) => (
                      <DropdownMenuItem key={type.name} asChild>
                        <Link href={type.href}>
                          <a className="w-full">{type.name}</a>
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
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.profileImageUrl || ""}
                          alt={user.firstName || "User"}
                        />
                        <AvatarFallback>
                          {user.firstName?.charAt(0) ||
                            user.email?.charAt(0) ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none">
                        {user.firstName || user.lastName
                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                          : "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/quotes">My Quotes</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => (window.location.href = "/api/logout")}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => (window.location.href = "/api/login")}
                >
                  Sign In
                </Button>
                <Button onClick={() => (window.location.href = "/api/login")}>
                  Get Started
                </Button>
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
                  <a
                    className={`block px-3 py-2 text-base font-medium transition-colors ${
                      isActive(item.href)
                        ? "text-primary bg-primary/10"
                        : "text-gray-500 hover:text-primary hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                </Link>
              ))}

              {/* Coverage Types Section */}
              <div className="pt-2">
                <Link href="/insurance-types">
                  <a
                    className={`block px-3 py-2 text-base font-medium transition-colors ${
                      isActive("/insurance-types")
                        ? "text-primary bg-primary/10"
                        : "text-gray-500 hover:text-primary hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    All Coverage Types
                  </a>
                </Link>

                {coverageTypes.map((type) => (
                  <Link key={type.name} href={type.href}>
                    <a
                      className={`block px-6 py-2 text-sm font-medium transition-colors ${
                        isActive(type.href)
                          ? "text-primary bg-primary/10"
                          : "text-gray-400 hover:text-primary hover:bg-gray-50"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {type.name}
                    </a>
                  </Link>
                ))}
              </div>

              {/* Mobile Auth Section */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                {isAuthenticated && user ? (
                  <>
                    <Link href="/dashboard">
                      <a
                        className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-primary hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </a>
                    </Link>
                    <Link href="/quotes">
                      <a
                        className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-primary hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        My Quotes
                      </a>
                    </Link>
                    <button
                      className="block w-full text-left px-3 py-2 text-base font-medium text-gray-500 hover:text-primary hover:bg-gray-50"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        window.location.href = "/api/logout";
                      }}
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="block w-full text-left px-3 py-2 text-base font-medium text-gray-500 hover:text-primary hover:bg-gray-50"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        window.location.href = "/api/login";
                      }}
                    >
                      Sign In
                    </button>
                    <button
                      className="block w-full text-left px-3 py-2 text-base font-medium text-primary hover:bg-primary/10"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        window.location.href = "/api/login";
                      }}
                    >
                      Get Started
                    </button>
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

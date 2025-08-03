import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Shield, Settings, Menu, X, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import HeroSection from "@/components/hero-section";
import InsuranceTypesGrid from "@/components/insurance-types-grid";
import QuoteComparison from "@/components/quote-comparison";
import DashboardPreview from "@/components/dashboard-preview";
import ClaimsAssistanceSection from "@/components/claims-assistance-section";
import Footer from "@/components/footer";
import jasBrandLogo from "@/assets/jas-brand-logo.svg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Compare Quotes", href: "/quotes" },
    { name: "Claims", href: "/claims-assistance" },
  ];

  const insuranceTypes = [
    { name: "Life Insurance", href: "/life-insurance" },
    { name: "Health Insurance", href: "/health-insurance" },
    { name: "Dental Insurance", href: "/dental-insurance" },
    { name: "Vision Insurance", href: "/vision-insurance" },
    { name: "Hospital Indemnity", href: "/hospital-indemnity-insurance" },
    { name: "Discount Health Plans", href: "/discount-health-insurance" },
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Navigation merged from life insurance page */}
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

                  {/* Insurance Types Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md ${
                          insuranceTypes.some((type) => isActive(type.href))
                            ? "text-white bg-primary shadow-md"
                            : "text-gray-700 hover:text-primary hover:bg-gray-50"
                        }`}
                      >
                        Insurance
                        <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuItem asChild>
                        <Link href="/insurance-types">
                          <a className="w-full">View All Insurance Types</a>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {insuranceTypes.map((type) => (
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

            {/* Desktop Auth Section - keeping Dashboard link styling */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || ""} alt="Profile" />
                      <AvatarFallback>{user?.firstName?.[0] || user?.email?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user?.firstName && user?.lastName && (
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                      )}
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <a className="w-full">Dashboard</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/api/logout'}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <a
                      className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                        isActive(item.href)
                          ? "text-white bg-primary"
                          : "text-gray-700 hover:text-primary hover:bg-gray-50"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </a>
                  </Link>
                ))}
                
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <p className="px-3 py-2 text-sm font-medium text-gray-500">Insurance Types</p>
                  {insuranceTypes.map((type) => (
                    <Link key={type.name} href={type.href}>
                      <a
                        className="block px-3 py-2 text-sm text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md ml-4"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {type.name}
                      </a>
                    </Link>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-2 mt-2">
                  <Link href="/dashboard">
                    <a
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </a>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.location.href = '/api/logout';
                    }}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <HeroSection />
      <div id="insurance-types">
        <InsuranceTypesGrid />
      </div>
      <div id="compare">
        <QuoteComparison />
      </div>
      <DashboardPreview />
      <div id="claims">
        <ClaimsAssistanceSection />
      </div>
      <Footer />
    </div>
  );
}

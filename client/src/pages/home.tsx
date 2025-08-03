import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Shield, Settings } from "lucide-react";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import InsuranceTypesGrid from "@/components/insurance-types-grid";
import QuoteComparison from "@/components/quote-comparison";
import DashboardPreview from "@/components/dashboard-preview";
import ClaimsAssistanceSection from "@/components/claims-assistance-section";
import Footer from "@/components/footer";
import jasBrandLogo from "@/assets/jas-brand-logo.svg";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <img 
                  src={jasBrandLogo} 
                  alt="Reliable Insurance Solutions" 
                  className="h-10 w-auto mr-3"
                />
                <h1 className="text-2xl font-bold text-primary">
                  InsureScope
                </h1>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <a href="#" className="text-gray-900 hover:text-primary px-3 py-2 text-sm font-medium">Home</a>
                  <a href="#insurance-types" className="text-gray-500 hover:text-primary px-3 py-2 text-sm font-medium">Insurance Types</a>
                  <a href="#compare" className="text-gray-500 hover:text-primary px-3 py-2 text-sm font-medium">Compare Quotes</a>
                  <a href="#claims" className="text-gray-500 hover:text-primary px-3 py-2 text-sm font-medium">Claims Assistance</a>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                <Settings className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => window.location.href = '/api/logout'}>
                Sign Out
              </Button>
            </div>
          </div>
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

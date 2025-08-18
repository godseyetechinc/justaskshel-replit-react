import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import InsuranceTypesGrid from "@/components/insurance-types-grid";
import QuoteComparison from "@/components/quote-comparison";
import DashboardPreview from "@/components/dashboard-preview";
import ClaimsAssistanceSection from "@/components/claims-assistance-section";
import Footer from "@/components/footer";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // This is now an authenticated route, no need for login redirect

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
      <Navigation />

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
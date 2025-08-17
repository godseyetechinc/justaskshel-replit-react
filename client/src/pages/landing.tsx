import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import InsuranceTypesGrid from "@/components/insurance-types-grid";
import QuoteComparison from "@/components/quote-comparison";
import DashboardPreview from "@/components/dashboard-preview";
import ClaimsAssistanceSection from "@/components/claims-assistance-section";
import Footer from "@/components/footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
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

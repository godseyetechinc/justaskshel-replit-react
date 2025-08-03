import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import MembersPage from "@/pages/dashboard/members";
import ClaimsWorkflow from "@/pages/dashboard/claims-workflow";
import ProfilePage from "@/pages/dashboard/profile";
import ContactsPage from "@/pages/dashboard/contacts";
import ApplicationsPage from "@/pages/dashboard/applications";
import PoliciesPage from "@/pages/dashboard/policies";
import WishlistPage from "@/pages/dashboard/wishlist";
import PointsPage from "@/pages/dashboard/points";
import RewardsManagementPage from "@/pages/dashboard/rewards-management";
import DependentsPage from "@/pages/dashboard/dependents";
import UserManagementPage from "@/pages/dashboard/user-management";
import PasswordManagementPage from "@/pages/dashboard/password-management";
import AnalyticsPage from "@/pages/dashboard/analytics";
import Quotes from "@/pages/quotes";
import InsuranceTypes from "@/pages/insurance-types";
import ClaimsAssistance from "@/pages/claims-assistance";
import LifeInsurance from "@/pages/life-insurance";
import HealthInsurance from "@/pages/health-insurance";
import DentalInsurance from "@/pages/dental-insurance";
import VisionInsurance from "@/pages/vision-insurance";
import DiscountHealthInsurance from "@/pages/discount-health-insurance";
import HospitalIndemnityInsurance from "@/pages/hospital-indemnity-insurance";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/insurance-types" component={InsuranceTypes} />
          <Route path="/quotes" component={Quotes} />
          <Route path="/claims-assistance" component={ClaimsAssistance} />
          <Route path="/life-insurance" component={LifeInsurance} />
          <Route path="/health-insurance" component={HealthInsurance} />
          <Route path="/dental-insurance" component={DentalInsurance} />
          <Route path="/vision-insurance" component={VisionInsurance} />
          <Route path="/discount-health-insurance" component={DiscountHealthInsurance} />
          <Route path="/hospital-indemnity-insurance" component={HospitalIndemnityInsurance} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/dashboard/members" component={MembersPage} />
          <Route path="/dashboard/claims" component={ClaimsWorkflow} />
          <Route path="/dashboard/profile" component={ProfilePage} />
          <Route path="/dashboard/contacts" component={ContactsPage} />
          <Route path="/dashboard/applications" component={ApplicationsPage} />
          <Route path="/dashboard/policies" component={PoliciesPage} />
          <Route path="/dashboard/wishlist" component={WishlistPage} />
          <Route path="/dashboard/points" component={PointsPage} />
          <Route path="/dashboard/rewards-management" component={RewardsManagementPage} />
          <Route path="/dashboard/dependents" component={DependentsPage} />
          <Route path="/dashboard/user-management" component={UserManagementPage} />
          <Route path="/dashboard/password-management" component={PasswordManagementPage} />
          <Route path="/dashboard/analytics" component={AnalyticsPage} />
          <Route path="/quotes" component={Quotes} />
          <Route path="/insurance-types" component={InsuranceTypes} />
          <Route path="/claims-assistance" component={ClaimsAssistance} />
          <Route path="/life-insurance" component={LifeInsurance} />
          <Route path="/health-insurance" component={HealthInsurance} />
          <Route path="/dental-insurance" component={DentalInsurance} />
          <Route path="/vision-insurance" component={VisionInsurance} />
          <Route path="/discount-health-insurance" component={DiscountHealthInsurance} />
          <Route path="/hospital-indemnity-insurance" component={HospitalIndemnityInsurance} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

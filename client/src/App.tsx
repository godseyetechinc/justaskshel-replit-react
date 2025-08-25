import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import NotFound from "@/pages/not-found";
import LogoutLoading from "@/components/logout-loading";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import MembersPage from "@/pages/dashboard/members";
import ClaimsWorkflow from "@/pages/dashboard/claims-workflow";
import ProfilePage from "@/pages/dashboard/profile";
import MyProfilePage from "@/pages/dashboard/my-profile";
import MyAgentPage from "@/pages/dashboard/my-agent";
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
import RoleTest from "@/pages/role-test";
import Quotes from "@/pages/quotes";
import InsuranceTypes from "@/pages/insurance-types";
import ClaimsAssistance from "@/pages/claims-assistance";
import LifeInsurance from "@/pages/life-insurance";
import HealthInsurance from "@/pages/health-insurance";
import DentalInsurance from "@/pages/dental-insurance";
import VisionInsurance from "@/pages/vision-insurance";
import DiscountHealthInsurance from "@/pages/discount-health-insurance";
import HospitalIndemnityInsurance from "@/pages/hospital-indemnity-insurance";
import AboutUs from "@/pages/about-us";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import NeedsAnalysisPage from "@/pages/needs-analysis";
import OrganizationsPage from "@/pages/dashboard/organizations";
import OrganizationProfilePage from "@/pages/dashboard/organization-profile";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showLogoutPage } = useLogout();

  // Show logout loading page if logout is in progress
  if (showLogoutPage) {
    return <LogoutLoading />;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Redirect authenticated users away from auth pages */}
      {isAuthenticated && (
        <>
          <Route path="/login">
            <Redirect to="/dashboard" />
          </Route>
          <Route path="/signup">
            <Redirect to="/dashboard" />
          </Route>
        </>
      )}
      
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/insurance-types" component={InsuranceTypes} />
          <Route path="/needs-analysis" component={NeedsAnalysisPage} />
          <Route path="/quotes" component={Quotes} />
          <Route path="/claims-assistance" component={ClaimsAssistance} />
          <Route path="/life-insurance" component={LifeInsurance} />
          <Route path="/health-insurance" component={HealthInsurance} />
          <Route path="/dental-insurance" component={DentalInsurance} />
          <Route path="/vision-insurance" component={VisionInsurance} />
          <Route path="/discount-health-insurance" component={DiscountHealthInsurance} />
          <Route path="/hospital-indemnity-insurance" component={HospitalIndemnityInsurance} />
          <Route path="/about-us" component={AboutUs} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          {/* Dashboard sub-routes must come before main dashboard route */}
          <Route path="/dashboard/members" component={MembersPage} />
          <Route path="/dashboard/organizations" component={OrganizationsPage} />
          <Route path="/dashboard/claims" component={ClaimsWorkflow} />
          <Route path="/dashboard/claims-workflow" component={ClaimsWorkflow} />
          <Route path="/dashboard/profile" component={ProfilePage} />
          <Route path="/dashboard/my-profile" component={MyProfilePage} />
          <Route path="/dashboard/my-agent" component={MyAgentPage} />
          <Route path="/dashboard/contacts" component={ContactsPage} />
          <Route path="/dashboard/applications" component={ApplicationsPage} />
          <Route path="/dashboard/policies" component={PoliciesPage} />
          <Route path="/dashboard/wishlist" component={WishlistPage} />
          <Route path="/dashboard/points" component={PointsPage} />
          <Route path="/dashboard/rewards-management" component={RewardsManagementPage} />
          <Route path="/dashboard/dependents" component={DependentsPage} />
          <Route path="/dashboard/user-management" component={UserManagementPage} />
          <Route path="/dashboard/organization-profile" component={OrganizationProfilePage} />
          <Route path="/dashboard/password-management" component={PasswordManagementPage} />
          <Route path="/dashboard/analytics" component={AnalyticsPage} />
          {/* Main dashboard route comes last to avoid conflicts */}
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/role-test" component={RoleTest} />
          <Route path="/quotes" component={Quotes} />
          <Route path="/insurance-types" component={InsuranceTypes} />
          <Route path="/needs-analysis" component={NeedsAnalysisPage} />
          <Route path="/claims-assistance" component={ClaimsAssistance} />
          <Route path="/life-insurance" component={LifeInsurance} />
          <Route path="/health-insurance" component={HealthInsurance} />
          <Route path="/dental-insurance" component={DentalInsurance} />
          <Route path="/vision-insurance" component={VisionInsurance} />
          <Route path="/discount-health-insurance" component={DiscountHealthInsurance} />
          <Route path="/hospital-indemnity-insurance" component={HospitalIndemnityInsurance} />
          <Route path="/about-us" component={AboutUs} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
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

import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { Suspense, lazy } from "react";
import NotFound from "@/pages/not-found";
import LogoutLoading from "@/components/logout-loading";
import { ErrorBoundary } from "@/components/error-boundary";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import AcceptInvitation from "@/pages/accept-invitation";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
// Lazy-loaded dashboard components for performance optimization
const Dashboard = lazy(() => import("@/pages/dashboard"));
const MembersPage = lazy(() => import("@/pages/dashboard/members"));
const ClaimsWorkflow = lazy(() => import("@/pages/dashboard/claims-workflow"));
const ProfilePage = lazy(() => import("@/pages/dashboard/profile"));
const MyProfilePage = lazy(() => import("@/pages/dashboard/my-profile"));
const MyAgentPage = lazy(() => import("@/pages/dashboard/my-agent"));
const ContactsPage = lazy(() => import("@/pages/dashboard/contacts"));
const PoliciesPage = lazy(() => import("@/pages/dashboard/policies"));
const WishlistPage = lazy(() => import("@/pages/dashboard/wishlist"));
const PointsPage = lazy(() => import("@/pages/dashboard/points"));
const RewardsManagementPage = lazy(() => import("@/pages/dashboard/rewards-management"));
const DependentsPage = lazy(() => import("@/pages/dashboard/dependents"));
const UserManagementPage = lazy(() => import("@/pages/dashboard/user-management"));
const PasswordManagementPage = lazy(() => import("@/pages/dashboard/password-management"));
const AnalyticsPage = lazy(() => import("@/pages/dashboard/analytics"));
const OrganizationsPage = lazy(() => import("@/pages/dashboard/organizations"));
const OrganizationProfilePage = lazy(() => import("@/pages/dashboard/organization-profile"));
const AdminProviderManagement = lazy(() => import("@/pages/admin-provider-management"));
const PointsAnalyticsDashboard = lazy(() => import("@/pages/dashboard/points-analytics"));
const UserPointsInsights = lazy(() => import("@/pages/dashboard/user-points-insights"));
const AchievementsPage = lazy(() => import("@/pages/dashboard/achievements"));
const ReferralsPage = lazy(() => import("@/pages/dashboard/referrals"));
const NotificationsPage = lazy(() => import("@/pages/dashboard/notifications"));
const AgentsPage = lazy(() => import("@/pages/dashboard/agents"));
const ClientAssignmentsPage = lazy(() => import("@/pages/dashboard/client-assignments"));
const AgentPerformancePage = lazy(() => import("@/pages/dashboard/agent-performance"));
const AgentPoliciesCommissionsPage = lazy(() => import("@/pages/dashboard/agent-policies-commissions"));
const AdminCommissionsPage = lazy(() => import("@/pages/dashboard/admin-commissions"));
const AccessRequestsPage = lazy(() => import("@/pages/dashboard/access-requests"));
const LoginHistoryPage = lazy(() => import("@/pages/dashboard/login-history"));

// Phase 7 components - lazy-loaded for optimal performance
const SocialFeaturesPage = lazy(() => import("@/pages/dashboard/social-features"));
const AdvancedRedemptionsPage = lazy(() => import("@/pages/dashboard/advanced-redemptions"));
const SeasonalCampaignsPage = lazy(() => import("@/pages/dashboard/seasonal-campaigns"));

// Public pages - regular imports for better SEO and initial load
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

// Loading fallback component for Suspense
function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" data-testid="loading-page">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-lg text-muted-foreground">Loading page...</p>
      </div>
    </div>
  );
}

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
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/accept-invitation/:token" component={AcceptInvitation} />
        </>
      ) : (
        <Suspense fallback={<PageLoadingFallback />}>
          <Route path="/" component={Home} />
          {/* Dashboard sub-routes must come before main dashboard route */}
          <Route path="/dashboard/members" component={MembersPage} />
          <Route path="/dashboard/organizations" component={OrganizationsPage} />
          <Route path="/dashboard/agents" component={AgentsPage} />
          <Route path="/dashboard/client-assignments" component={ClientAssignmentsPage} />
          <Route path="/dashboard/agent-performance" component={AgentPerformancePage} />
          <Route path="/dashboard/my-policies-commissions" component={AgentPoliciesCommissionsPage} />
          <Route path="/dashboard/admin-commissions" component={AdminCommissionsPage} />
          <Route path="/dashboard/access-requests" component={AccessRequestsPage} />
          <Route path="/dashboard/login-history" component={LoginHistoryPage} />
          <Route path="/dashboard/claims-workflow" component={ClaimsWorkflow} />
          <Route path="/dashboard/profile" component={ProfilePage} />
          <Route path="/dashboard/my-profile" component={MyProfilePage} />
          <Route path="/dashboard/my-agent" component={MyAgentPage} />
          <Route path="/dashboard/contacts" component={ContactsPage} />
          <Route path="/dashboard/policies" component={PoliciesPage} />
          <Route path="/dashboard/wishlist" component={WishlistPage} />
          <Route path="/dashboard/points" component={PointsPage} />
          <Route path="/dashboard/rewards-management" component={RewardsManagementPage} />
          <Route path="/dashboard/dependents" component={DependentsPage} />
          <Route path="/dashboard/user-management" component={UserManagementPage} />
          <Route path="/dashboard/admin/provider-management" component={AdminProviderManagement} />
          <Route path="/dashboard/organization-profile" component={OrganizationProfilePage} />
          <Route path="/dashboard/password-management" component={PasswordManagementPage} />
          <Route path="/dashboard/analytics" component={AnalyticsPage} />
          <Route path="/dashboard/points-analytics" component={PointsAnalyticsDashboard} />
          <Route path="/dashboard/user-insights" component={UserPointsInsights} />
          <Route path="/dashboard/achievements" component={AchievementsPage} />
          <Route path="/dashboard/referrals" component={ReferralsPage} />
          <Route path="/dashboard/notifications" component={NotificationsPage} />
          {/* Phase 7 Advanced Features - Lazy-loaded for optimal performance */}
          <Route path="/dashboard/social-features" component={SocialFeaturesPage} />
          <Route path="/dashboard/advanced-redemptions" component={AdvancedRedemptionsPage} />
          <Route path="/dashboard/seasonal-campaigns" component={SeasonalCampaignsPage} />
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
        </Suspense>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

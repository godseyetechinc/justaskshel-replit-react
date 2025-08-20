import { useAuth } from "@/hooks/useAuth";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { useLogout } from "@/hooks/useLogout";
import { Button } from "@/components/ui/button";
import DashboardSidebar from "./dashboard-sidebar";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Home } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  requiredRoles?: Array<"Admin" | "Agent" | "Member" | "Guest" | "Visitor">;
}

export default function DashboardLayout({ 
  children, 
  title = "Dashboard",
  requiredRoles = ["Member", "Agent", "Admin", "Guest"]
}: DashboardLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasAnyRole, userRole } = useRoleAuth();
  const { logout, isLoggingOut } = useLogout();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You need to be logged in to access the dashboard. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Check role permissions
  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasAnyRole(requiredRoles)) {
      toast({
        title: "Access Denied",
        description: `Your role (${userRole}) doesn't have access to this page.`,
        variant: "destructive",
      });
    }
  }, [isAuthenticated, isLoading, hasAnyRole, requiredRoles, userRole, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please log in to access the dashboard.
          </p>
          <button
            onClick={() => window.location.href = "/api/login"}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (!hasAnyRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            Your role ({userRole}) doesn't have permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="ml-12 lg:ml-0">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/'}
              >
                <Home className="h-4 w-4 mr-2" />
                Public Home
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={logout}
                disabled={isLoggingOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, MapPin, Monitor, Clock } from "lucide-react";
import { format } from "date-fns";
import DashboardLayout from "@/components/dashboard-layout";

type LoginHistoryEntry = {
  id: number;
  userId: string;
  email: string;
  success: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  failureReason: string | null;
  loggedInAt: string | null;
};

export default function LoginHistory() {
  const { data, isLoading, error } = useQuery<{ success: boolean; history: LoginHistoryEntry[] }>({
    queryKey: ["/api/auth/login-history"],
  });

  const getBrowserFromUserAgent = (userAgent: string | null): string => {
    if (!userAgent) return "Unknown";
    
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    if (userAgent.includes("Opera")) return "Opera";
    
    return "Unknown";
  };

  const getOSFromUserAgent = (userAgent: string | null): string => {
    if (!userAgent) return "Unknown";
    
    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac")) return "macOS";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("iOS")) return "iOS";
    
    return "Unknown";
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Login History" requiredRoles={["SuperAdmin", "TenantAdmin", "Agent", "Member"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Login History</h1>
            <p className="text-muted-foreground mt-1">Loading your recent login activity...</p>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout title="Login History" requiredRoles={["SuperAdmin", "TenantAdmin", "Agent", "Member"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Login History</h1>
            <p className="text-muted-foreground mt-1">View your recent login activity</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                <p className="mt-4 text-lg font-medium">Failed to load login history</p>
                <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const history = data.history || [];

  return (
    <DashboardLayout title="Login History" requiredRoles={["SuperAdmin", "TenantAdmin", "Agent", "Member"]}>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Login History</h1>
        <p className="text-muted-foreground mt-1" data-testid="text-page-description">
          View your recent login activity and security events
        </p>
      </div>

      <Card data-testid="card-login-history">
        <CardHeader>
          <CardTitle>Recent Login Activity</CardTitle>
          <CardDescription>
            Your last {history.length} login attempts, including successful and failed attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No login history yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your login attempts will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead data-testid="header-status">Status</TableHead>
                    <TableHead data-testid="header-date">Date & Time</TableHead>
                    <TableHead data-testid="header-device">Device</TableHead>
                    <TableHead data-testid="header-location">Location</TableHead>
                    <TableHead data-testid="header-reason">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry) => (
                    <TableRow key={entry.id} data-testid={`row-login-${entry.id}`}>
                      <TableCell>
                        {entry.success ? (
                          <Badge variant="default" className="bg-green-600" data-testid={`status-success-${entry.id}`}>
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive" data-testid={`status-failed-${entry.id}`}>
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell data-testid={`date-${entry.id}`}>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {entry.loggedInAt ? format(new Date(entry.loggedInAt), "MMM dd, yyyy") : "Unknown"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {entry.loggedInAt ? format(new Date(entry.loggedInAt), "h:mm a") : "-"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`device-${entry.id}`}>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {getBrowserFromUserAgent(entry.userAgent)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getOSFromUserAgent(entry.userAgent)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`location-${entry.id}`}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{entry.ipAddress || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`details-${entry.id}`}>
                        {entry.failureReason ? (
                          <span className="text-sm text-red-600 dark:text-red-400">
                            {entry.failureReason}
                          </span>
                        ) : (
                          <span className="text-sm text-green-600 dark:text-green-400">
                            Login successful
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Review your login history regularly</p>
              <p className="text-sm text-muted-foreground">
                Check for any suspicious activity or unrecognized login attempts
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Use strong, unique passwords</p>
              <p className="text-sm text-muted-foreground">
                Change your password immediately if you notice unauthorized access
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Enable multi-factor authentication</p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account (coming soon)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}

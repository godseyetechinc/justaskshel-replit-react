import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Home, UserPlus, Mail, AlertCircle } from "lucide-react";

// Stage 1: Credentials only schema
const credentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type CredentialsFormData = z.infer<typeof credentialsSchema>;

// Stage 2: Access request schema
const accessRequestSchema = z.object({
  organizationId: z.string().min(1, "Organization is required"),
  requestReason: z.string().min(10, "Please provide a detailed reason (at least 10 characters)"),
  desiredRole: z.string().optional(),
});

type AccessRequestFormData = z.infer<typeof accessRequestSchema>;

type Organization = {
  id: string;
  displayName: string;
  description?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  userRole?: string;
};

type AuthStage = 'credentials' | 'organization' | 'no-access';

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [authStage, setAuthStage] = useState<AuthStage>('credentials');
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);
  const [availableOrganizations, setAvailableOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");
  const [showAccessRequestForm, setShowAccessRequestForm] = useState(false);

  const credentialsForm = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const accessRequestForm = useForm<AccessRequestFormData>({
    resolver: zodResolver(accessRequestSchema),
    defaultValues: {
      organizationId: "",
      requestReason: "",
      desiredRole: "Member",
    },
  });

  // Stage 1: Credentials submission
  const loginMutation = useMutation({
    mutationFn: (data: CredentialsFormData) =>
      apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      if (data.requiresOrganization === false) {
        // Auto-assigned (SuperAdmin or single org)
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.user.firstName}!`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setTimeout(() => {
          setLocation(data.redirectTo || "/dashboard");
        }, 200);
        return;
      }

      // Store authenticated user info
      setAuthenticatedUser(data.user);

      if (data.hasNoAccess || (data.availableOrganizations && data.availableOrganizations.length === 0)) {
        // User has no organization access
        setAuthStage('no-access');
        toast({
          title: "Organization Access Required",
          description: "Your account needs to be associated with an organization.",
          variant: "default",
        });
        return;
      }

      // User has organizations to choose from
      setAvailableOrganizations(data.availableOrganizations || []);
      setAuthStage('organization');
      toast({
        title: "Credentials Verified",
        description: "Please select your organization to continue.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  // Stage 2: Organization selection
  const orgSelectionMutation = useMutation({
    mutationFn: (organizationId: string) =>
      apiRequest("/api/auth/session/organization", {
        method: "POST",
        body: JSON.stringify({ organizationId }),
      }),
    onSuccess: (data) => {
      toast({
        title: "Organization Selected",
        description: `Accessing ${data.organization.displayName}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setTimeout(() => {
        setLocation(data.redirectTo || "/dashboard");
      }, 200);
    },
    onError: (error: any) => {
      toast({
        title: "Selection Failed",
        description: error.message || "Failed to set organization",
        variant: "destructive",
      });
    },
  });

  // Access request submission
  const accessRequestMutation = useMutation({
    mutationFn: (data: AccessRequestFormData) =>
      apiRequest("/api/organizations/access-requests", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Access Request Submitted",
        description: "An administrator will review your request shortly.",
      });
      setShowAccessRequestForm(false);
      accessRequestForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit access request",
        variant: "destructive",
      });
    },
  });

  const handleCredentialsSubmit = (data: CredentialsFormData) => {
    loginMutation.mutate(data);
  };

  const handleOrganizationSelect = (orgId: string) => {
    setSelectedOrganization(orgId);
    orgSelectionMutation.mutate(orgId);
  };

  const handleAccessRequestSubmit = (data: AccessRequestFormData) => {
    accessRequestMutation.mutate(data);
  };

  // Render credentials form (Stage 1)
  if (authStage === 'credentials') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to your JustAskShel account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form
              onSubmit={credentialsForm.handleSubmit(handleCredentialsSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  data-testid="input-email"
                  {...credentialsForm.register("email")}
                />
                {credentialsForm.formState.errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {credentialsForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    data-testid="input-password"
                    {...credentialsForm.register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </Button>
                </div>
                {credentialsForm.formState.errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {credentialsForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="text-center text-sm space-y-2">
              <div>
                <span className="text-muted-foreground">
                  Don't have an account?{" "}
                </span>
                <Link href="/signup">
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    data-testid="link-signup"
                  >
                    Sign up here
                  </Button>
                </Link>
              </div>
              <div>
                <Link href="/">
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-muted-foreground"
                    data-testid="link-home"
                  >
                    <Home className="h-3 w-3 mr-1" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>

            {/* Test Account Info */}
            <Alert>
              <AlertDescription className="text-xs space-y-2">
                <div>
                  <strong>Test Accounts (password: "password123"):</strong>
                </div>
                <div className="space-y-1">
                  <div className="flex items-start">
                    <span className="font-medium mr-2">Agent:</span>
                    <span>agent1@justaskshel.com - View policies & commissions</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium mr-2">Admin:</span>
                    <span>admin1@justaskshel.com - Manage commissions & transfers</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium mr-2">SuperAdmin:</span>
                    <span>superadmin@justaskshel.com - Full system access</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render organization selector (Stage 2)
  if (authStage === 'organization') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Select Your Organization</CardTitle>
            <CardDescription>
              Welcome back, {authenticatedUser?.firstName}! Choose which organization to access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3" data-testid="organization-selector">
              {availableOrganizations.map((org) => (
                <Button
                  key={org.id}
                  variant="outline"
                  onClick={() => handleOrganizationSelect(org.id)}
                  disabled={orgSelectionMutation.isPending}
                  className="justify-start h-auto p-4 hover:bg-accent"
                  data-testid={`button-select-org-${org.id}`}
                >
                  <div className="flex items-center gap-3 w-full">
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={`${org.displayName} logo`}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div
                        className="h-10 w-10 rounded flex items-center justify-center"
                        style={{ backgroundColor: org.primaryColor }}
                      >
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="text-left flex-1">
                      <div className="font-semibold">{org.displayName}</div>
                      {org.userRole && (
                        <div className="text-sm text-muted-foreground">
                          Role: {org.userRole}
                        </div>
                      )}
                      {org.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {org.description}
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="text-center text-sm text-muted-foreground">
              Need access to a different organization?{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => setAuthStage('no-access')}
                data-testid="button-request-access"
              >
                Request access
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render no-access screen with request form (Stage 2 alternate)
  if (authStage === 'no-access') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <AlertCircle className="h-12 w-12 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Organization Access Required</CardTitle>
            <CardDescription>
              Hello, {authenticatedUser?.firstName}! Your account needs to be associated with an organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showAccessRequestForm ? (
              <div className="space-y-3">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    To access JustAskShel, you need to be part of an organization. You can request access to join an existing organization.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => setShowAccessRequestForm(true)}
                  className="w-full"
                  data-testid="button-show-request-form"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Request Access to Organization
                </Button>

                {availableOrganizations.length > 0 && (
                  <Button
                    onClick={() => setAuthStage('organization')}
                    variant="outline"
                    className="w-full"
                    data-testid="button-back-to-orgs"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Back to Organization Selection
                  </Button>
                )}
              </div>
            ) : (
              <form
                onSubmit={accessRequestForm.handleSubmit(handleAccessRequestSubmit)}
                className="space-y-4"
                data-testid="form-access-request"
              >
                <div className="space-y-2">
                  <Label htmlFor="organizationId">Organization</Label>
                  <Select
                    onValueChange={(value) => accessRequestForm.setValue("organizationId", value)}
                    value={accessRequestForm.watch("organizationId")}
                  >
                    <SelectTrigger id="organizationId" data-testid="select-request-organization">
                      <SelectValue placeholder="Select an organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* This would typically fetch all organizations from /api/public/organizations */}
                      <SelectItem value="b3JnXzFfc2FsdA==">JustAskShel Insurance Agency</SelectItem>
                      <SelectItem value="b3JnXzJfc2FsdA==">Premium Insurance Partners</SelectItem>
                      <SelectItem value="b3JnXzNfc2FsdA==">Coastal Coverage Solutions</SelectItem>
                    </SelectContent>
                  </Select>
                  {accessRequestForm.formState.errors.organizationId && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {accessRequestForm.formState.errors.organizationId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestReason">Reason for Access</Label>
                  <Textarea
                    id="requestReason"
                    placeholder="Explain why you need access to this organization..."
                    rows={4}
                    data-testid="textarea-request-reason"
                    {...accessRequestForm.register("requestReason")}
                  />
                  {accessRequestForm.formState.errors.requestReason && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {accessRequestForm.formState.errors.requestReason.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desiredRole">Desired Role</Label>
                  <Select
                    onValueChange={(value) => accessRequestForm.setValue("desiredRole", value)}
                    defaultValue="Member"
                  >
                    <SelectTrigger id="desiredRole" data-testid="select-desired-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Member">Member</SelectItem>
                      <SelectItem value="Agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAccessRequestForm(false)}
                    className="flex-1"
                    data-testid="button-cancel-request"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={accessRequestMutation.isPending}
                    className="flex-1"
                    data-testid="button-submit-request"
                  >
                    {accessRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            )}

            <Separator className="my-4" />

            <div className="text-center text-sm text-muted-foreground">
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => {
                  setAuthStage('credentials');
                  setAuthenticatedUser(null);
                  credentialsForm.reset();
                }}
                data-testid="button-back-to-login"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

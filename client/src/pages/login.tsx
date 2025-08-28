import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { loginSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Building2, Globe, Home } from "lucide-react";

type LoginFormData = z.infer<typeof loginSchema>;

type Organization = {
  id: string;
  displayName: string;
  description?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
};

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Fetch organizations for selection
  const { data: organizations, isLoading: organizationsLoading } = useQuery({
    queryKey: ["/api/public/organizations"],
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) =>
      apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.firstName}!`,
      });
      // Invalidate user data to force fresh fetch
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Wait a moment for the session to be established before redirecting
      setTimeout(() => {
        setLocation("/dashboard");
      }, 200);
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const handleLoginSubmit = (data: LoginFormData) => {
    const loginData = {
      ...data,
      organizationId: selectedOrganization || undefined
    };
    loginMutation.mutate(loginData);
  };

  const handleOrganizationChange = (value: string) => {
    setSelectedOrganization(value === "no-org" ? "" : value);
    setValue("organizationId", value === "no-org" ? undefined : value);
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your JustAskShel account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Traditional Login Form */}
          <form
            onSubmit={handleSubmit(handleLoginSubmit)}
            className="space-y-4"
          >
            {/* Organization Selection */}
            <div className="space-y-2">
              <Label htmlFor="organization">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span>Organization (Optional)</span>
                </div>
              </Label>
              <Select 
                onValueChange={handleOrganizationChange}
                value={selectedOrganization || "no-org"}
                disabled={organizationsLoading}
              >
                <SelectTrigger id="organization" data-testid="select-organization">
                  <SelectValue placeholder={organizationsLoading ? "Loading organizations..." : "Select your organization"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-org">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <span>No Organization (Individual Access)</span>
                    </div>
                  </SelectItem>
                  {organizations?.map((org: Organization) => (
                    <SelectItem key={org.id} value={org.id}>
                      <div className="flex items-center space-x-2">
                        {org.logoUrl ? (
                          <img 
                            src={org.logoUrl} 
                            alt={`${org.displayName} logo`}
                            className="h-4 w-4 rounded object-cover"
                          />
                        ) : (
                          <div 
                            className="h-4 w-4 rounded" 
                            style={{ backgroundColor: org.primaryColor }}
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium">{org.displayName}</span>
                          {org.description && (
                            <span className="text-xs text-gray-500">{org.description}</span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Select your organization for tenant-specific access, or leave unselected for individual access.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                data-testid="input-email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
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
                  {...register("password")}
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
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
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
            <AlertDescription className="text-xs">
              <strong>Test Account:</strong> Use any seeded user email (e.g.,
              admin1@justaskshel.com, agent1@justaskshel.com,
              member1@example.com) with password "password123"
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { signupSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: "Member",
    },
  });

  const signupMutation = useMutation({
    mutationFn: (data: SignupFormData) => 
      apiRequest("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      toast({
        title: "Account Created",
        description: `Welcome to JustAskShel, ${data.user.firstName}!`,
      });
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Redirect to dashboard
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const handleSignupSubmit = (data: SignupFormData) => {
    signupMutation.mutate(data);
  };

  const handleReplitLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Join JustAskShel to manage your insurance needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Traditional Signup Form */}
          <form onSubmit={handleSubmit(handleSignupSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  data-testid="input-firstName"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  data-testid="input-lastName"
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
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
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                data-testid="input-phone"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Account Type</Label>
              <Select 
                value={watch("role")} 
                onValueChange={(value) => setValue("role", value as any)}
              >
                <SelectTrigger data-testid="select-role">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Member">Member - Insurance seeker</SelectItem>
                  <SelectItem value="Agent">Agent - Insurance professional</SelectItem>
                  <SelectItem value="Admin">Admin - System administrator</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.role.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a secure password"
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
              disabled={signupMutation.isPending}
              data-testid="button-signup"
            >
              {signupMutation.isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Replit OAuth Login */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleReplitLogin}
            data-testid="button-replit-signup"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.5 6h3a3 3 0 0 1 0 6h-3V6zm0 12V12h3l3 6h-6z"/>
            </svg>
            Sign up with Replit
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login">
              <Button variant="link" className="p-0 h-auto font-medium" data-testid="link-login">
                Sign in here
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
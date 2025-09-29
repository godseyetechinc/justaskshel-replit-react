import { useState } from "react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Palette, 
  Settings, 
  Save,
  Info,
  Users,
  CreditCard,
  Shield,
  Plus,
  Trash2,
  Send
} from "lucide-react";
import { useRoleAuth } from "@/hooks/useRoleAuth";

const organizationProfileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  description: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  logoUrl: z.string().url("Invalid logo URL").optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").optional(),
});

type OrganizationProfileData = z.infer<typeof organizationProfileSchema>;

type Organization = {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  status: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  maxAgents: number;
  maxMembers: number;
  settings?: any;
  createdAt: string;
  updatedAt: string;
};

export default function OrganizationProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Agent");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const { isTenantAdmin, isLoading: authLoading } = useRoleAuth();

  // Fetch current organization profile
  const { data: organization, isLoading } = useQuery<Organization>({
    queryKey: ["/api/organization-profile"],
    enabled: !authLoading && isTenantAdmin,
  });

  // Fetch organization invitations
  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: [`/api/organizations/${organization?.id}/invitations`],
    enabled: !authLoading && isTenantAdmin && !!organization?.id,
  });

  const form = useForm<OrganizationProfileData>({
    resolver: zodResolver(organizationProfileSchema),
    defaultValues: {
      displayName: "",
      description: "",
      website: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      logoUrl: "",
      primaryColor: "#0EA5E9",
      secondaryColor: "#64748B",
    },
  });

  // Set form values when data loads
  React.useEffect(() => {
    if (organization) {
      form.reset({
        displayName: organization.displayName || "",
        description: organization.description || "",
        website: organization.website || "",
        phone: organization.phone || "",
        email: organization.email || "",
        address: organization.address || "",
        city: organization.city || "",
        state: organization.state || "",
        zipCode: organization.zipCode || "",
        logoUrl: organization.logoUrl || "",
        primaryColor: organization.primaryColor || "#0EA5E9",
        secondaryColor: organization.secondaryColor || "#64748B",
      });
    }
  }, [organization, form]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: OrganizationProfileData) =>
      apiRequest("/api/organization-profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Organization profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organization-profile"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update organization profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: OrganizationProfileData) => {
    updateProfileMutation.mutate(data);
  };

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      if (!organization?.id) {
        throw new Error("Organization not found. Please refresh the page and try again.");
      }
      return await apiRequest(`/api/organizations/${organization.id}/invite`, {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "Team invitation has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organization?.id}/invitations`] });
      setInviteEmail("");
      setInviteRole("Agent");
      setIsInviteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Invitation Failed",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  // Revoke invitation mutation
  const revokeInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      if (!organization?.id) {
        throw new Error("Organization not found. Please refresh the page and try again.");
      }
      return await apiRequest(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitation Revoked",
        description: "Team invitation has been revoked.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organization?.id}/invitations`] });
    },
    onError: (error: any) => {
      toast({
        title: "Revocation Failed",
        description: error.message || "Failed to revoke invitation",
        variant: "destructive",
      });
    },
  });

  const handleSendInvitation = () => {
    if (!organization?.id) {
      toast({
        title: "Organization Error",
        description: "Organization not found. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }
    if (!inviteEmail || !inviteRole) {
      toast({
        title: "Invalid Input",
        description: "Please provide email and role for the invitation.",
        variant: "destructive",
      });
      return;
    }
    sendInvitationMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isTenantAdmin) {
    return (
      <div className="p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access organization profile management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getSubscriptionBadgeColor = (plan: string) => {
    switch (plan) {
      case "Enterprise":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Professional":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Basic":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 border-green-200";
      case "Trial":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Expired":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Profile</h1>
          <p className="text-gray-600 mt-1">
            Manage your organization's profile information and settings
          </p>
        </div>
        {organization && (
          <div className="flex items-center space-x-2">
            <Badge className={getSubscriptionBadgeColor(organization.subscriptionPlan)}>
              {organization.subscriptionPlan}
            </Badge>
            <Badge className={getStatusBadgeColor(organization.subscriptionStatus)}>
              {organization.subscriptionStatus}
            </Badge>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Branding</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Team</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Subscription</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Info className="h-5 w-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                  <CardDescription>
                    Update your organization's basic profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Organization Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of your organization..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://www.yourorganization.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Contact Information</span>
                  </CardTitle>
                  <CardDescription>
                    Organization contact details and address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="contact@yourorganization.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="h-5 w-5" />
                    <span>Brand Identity</span>
                  </CardTitle>
                  <CardDescription>
                    Customize your organization's visual identity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/logo.png"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input 
                                placeholder="#0EA5E9"
                                {...field}
                              />
                              <div 
                                className="w-8 h-8 rounded border"
                                style={{ backgroundColor: field.value || "#0EA5E9" }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="secondaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input 
                                placeholder="#64748B"
                                {...field}
                              />
                              <div 
                                className="w-8 h-8 rounded border"
                                style={{ backgroundColor: field.value || "#64748B" }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch("logoUrl") && (
                    <div className="mt-4">
                      <Label>Logo Preview</Label>
                      <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                        <img 
                          src={form.watch("logoUrl")} 
                          alt="Organization logo preview"
                          className="h-16 w-auto object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              {!organization ? (
                <Card>
                  <CardContent className="p-6">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Unable to load organization information. Please refresh the page to try again.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Send Invitation Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Send className="h-5 w-5" />
                          <span>Invite Team Members</span>
                        </CardTitle>
                        <CardDescription>
                          Send invitations to invite new agents or members to your organization
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="inviteEmail">Email Address</Label>
                          <Input
                            id="inviteEmail"
                            type="email"
                            placeholder="user@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            disabled={!organization.id}
                            data-testid="input-invite-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="inviteRole">Role</Label>
                          <Select value={inviteRole} onValueChange={setInviteRole} disabled={!organization.id}>
                            <SelectTrigger data-testid="select-invite-role">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Agent">Agent</SelectItem>
                              <SelectItem value="Member">Member</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={handleSendInvitation}
                          disabled={sendInvitationMutation.isPending || !inviteEmail || !organization.id}
                          className="w-full"
                          data-testid="button-send-invitation"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {sendInvitationMutation.isPending ? "Sending..." : "Send Invitation"}
                        </Button>
                      </CardContent>
                    </Card>

                {/* Pending Invitations Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Mail className="h-5 w-5" />
                      <span>Pending Invitations</span>
                    </CardTitle>
                    <CardDescription>
                      Manage pending invitations sent to potential team members
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {invitationsLoading ? (
                      <p className="text-sm text-gray-500">Loading invitations...</p>
                    ) : !invitations || invitations.length === 0 ? (
                      <p className="text-sm text-gray-500">No pending invitations</p>
                    ) : (
                      <div className="space-y-3">
                        {invitations.map((invitation: any) => (
                          <div
                            key={invitation.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                            data-testid={`invitation-${invitation.id}`}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{invitation.email}</p>
                              <p className="text-xs text-gray-500">
                                Role: {invitation.role} • 
                                Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => revokeInvitationMutation.mutate(invitation.id)}
                              disabled={revokeInvitationMutation.isPending}
                              data-testid={`button-revoke-${invitation.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

                  {/* Team Overview Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span>Team Overview</span>
                      </CardTitle>
                      <CardDescription>
                        Overview of your organization's team structure and limits
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {organization.maxAgents}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Max Agents</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {organization.maxMembers}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Max Members</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {organization.subscriptionPlan}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {invitations?.length || 0}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="subscription" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Subscription Details</span>
                  </CardTitle>
                  <CardDescription>
                    View your current subscription information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {organization && (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Plan</Label>
                          <div className="mt-1">
                            <Badge className={getSubscriptionBadgeColor(organization.subscriptionPlan)}>
                              {organization.subscriptionPlan}
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Status</Label>
                          <div className="mt-1">
                            <Badge className={getStatusBadgeColor(organization.subscriptionStatus)}>
                              {organization.subscriptionStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Max Agents</Label>
                          <div className="mt-1 flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{organization.maxAgents}</span>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Max Members</Label>
                          <div className="mt-1 flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{organization.maxMembers}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      To modify your subscription plan or billing details, please contact our support team.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Organization Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Advanced organization configuration options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Advanced settings and configuration options will be available in future updates.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex justify-end space-x-4">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </span>
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
}
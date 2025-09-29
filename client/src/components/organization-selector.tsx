import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Building2, 
  ChevronDown, 
  Shield, 
  Users, 
  Settings,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Organization {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  status: string;
  subscriptionPlan: string;
  maxAgents: number;
  maxMembers: number;
  agentCount?: number;
  memberCount?: number;
}

interface OrganizationSelectorProps {
  currentOrganizationId?: number;
  onOrganizationChange?: (organizationId: number) => void;
  className?: string;
}

export function OrganizationSelector({ 
  currentOrganizationId, 
  onOrganizationChange,
  className = ""
}: OrganizationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isSuperAdmin, privilegeLevel } = useRoleAuth();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only show for SuperAdmin users
  if (!isSuperAdmin || privilegeLevel !== 0) {
    return null;
  }

  // Fetch all organizations for SuperAdmin
  const { data: organizations, isLoading } = useQuery({
    queryKey: ["/api/organizations"],
    enabled: isSuperAdmin,
  }) as { data: Organization[] | undefined; isLoading: boolean };

  // Switch organization context
  const switchOrganizationMutation = useMutation({
    mutationFn: async (organizationId: number) => {
      return apiRequest("/api/admin/switch-organization", {
        method: "POST",
        body: JSON.stringify({ organizationId }),
      });
    },
    onSuccess: (_, organizationId) => {
      toast({
        title: "Organization Switched",
        description: "Successfully switched organization context.",
      });
      // Invalidate all queries to refresh data for new organization context
      queryClient.invalidateQueries();
      onOrganizationChange?.(organizationId);
    },
    onError: (error: any) => {
      toast({
        title: "Switch Failed", 
        description: error.message || "Failed to switch organization",
        variant: "destructive",
      });
    },
  });

  const currentOrg = organizations?.find(org => org.id === currentOrganizationId);
  const systemOrg = organizations?.find(org => org.id === 0); // System organization

  const handleOrganizationSwitch = (organizationId: string) => {
    const orgId = parseInt(organizationId);
    switchOrganizationMutation.mutate(orgId);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm text-muted-foreground">Loading organizations...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`} data-testid="organization-selector">
      {/* SuperAdmin Badge */}
      <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
        <Shield className="h-3 w-3 mr-1" />
        SuperAdmin
      </Badge>

      {/* Organization Selector */}
      <Select 
        value={currentOrganizationId?.toString() || "0"} 
        onValueChange={handleOrganizationSwitch}
        disabled={switchOrganizationMutation.isPending}
      >
        <SelectTrigger className="w-64" data-testid="organization-select-trigger">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col items-start">
              <SelectValue placeholder="Select Organization">
                {currentOrg ? (
                  <div className="flex flex-col">
                    <span className="font-medium">{currentOrg.displayName}</span>
                    <span className="text-xs text-muted-foreground">{currentOrg.name}</span>
                  </div>
                ) : (
                  <span>Select Organization</span>
                )}
              </SelectValue>
            </div>
          </div>
        </SelectTrigger>
        <SelectContent className="w-80">
          {/* System Organization (if exists) */}
          {systemOrg && (
            <>
              <SelectItem value="0" data-testid="system-organization">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-white dark:text-gray-900" />
                    </div>
                    <div>
                      <div className="font-medium">SYSTEM_PLATFORM</div>
                      <div className="text-xs text-muted-foreground">SuperAdmin Console</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">SYSTEM</Badge>
                </div>
              </SelectItem>
              <div className="border-t my-1" />
            </>
          )}
          
          {/* Regular Organizations */}
          {organizations?.filter(org => org.id !== 0).map((org) => (
            <SelectItem key={org.id} value={org.id.toString()} data-testid={`org-option-${org.id}`}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: org.primaryColor || "#0EA5E9" }}
                  >
                    {org.displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{org.displayName}</div>
                    <div className="text-xs text-muted-foreground">
                      {org.agentCount || 0} agents • {org.memberCount || 0} members
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={org.status === "Active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {org.status}
                  </Badge>
                  {org.id === currentOrganizationId && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Organization Details Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1"
            data-testid="org-details-trigger"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Organization Details</DialogTitle>
            <DialogDescription>
              Current organization context and available organizations
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current Organization Info */}
            {currentOrg && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Current Organization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Display Name</p>
                      <p className="font-medium">{currentOrg.displayName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge variant={currentOrg.status === "Active" ? "default" : "secondary"}>
                        {currentOrg.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Plan</p>
                      <p className="font-medium">{currentOrg.subscriptionPlan}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Limits</p>
                      <p className="font-medium">
                        {currentOrg.maxAgents} agents • {currentOrg.maxMembers} members
                      </p>
                    </div>
                    {currentOrg.description && (
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Description</p>
                        <p className="text-sm">{currentOrg.description}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Available Organizations Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Available Organizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {organizations?.map((org) => (
                    <div 
                      key={org.id} 
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: org.primaryColor || "#0EA5E9" }}
                        >
                          {org.id === 0 ? "S" : org.displayName.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {org.id === 0 ? "SYSTEM_PLATFORM" : org.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {org.id === 0 ? "SuperAdmin Console" : 
                             `${org.agentCount || 0} agents • ${org.memberCount || 0} members`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={org.status === "Active" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {org.status}
                        </Badge>
                        {org.id === currentOrganizationId && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SuperAdmin Warning */}
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  SuperAdmin Context
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  You have system-wide access across all organizations. 
                  Use this selector to switch between organization contexts for management tasks.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
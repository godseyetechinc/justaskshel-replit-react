import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserCheck, 
  ArrowRightLeft, 
  Search, 
  Plus,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  Activity,
  History,
  Filter
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface ClientAssignment {
  id: string;
  clientId: string;
  agentId: string;
  organizationId: number;
  assignmentType: "primary" | "secondary" | "referral";
  status: "active" | "inactive" | "transferred";
  assignedAt: string;
  assignedBy: string;
  notes?: string;
  client: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
      phone: string;
      address: string;
    };
  };
  agent: {
    id: string;
    email: string;
    profile?: {
      specializations: string[];
      yearsExperience: number;
      performanceRating: number;
    };
  };
}

interface ClientAssignmentHistory {
  id: string;
  clientId: string;
  previousAgentId: string;
  newAgentId: string;
  transferredBy: string;
  transferredAt: string;
  reason: string;
  previousAgent: {
    email: string;
  };
  newAgent: {
    email: string;
  };
}

export default function ClientAssignmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { hasMinimumPrivilegeLevel } = useRoleAuth();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch client assignments (clients with their agent assignments)
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["/api/organizations", user?.organizationId, "clients"],
    enabled: hasMinimumPrivilegeLevel(1) && !!user?.organizationId, // TenantAdmin or higher
  }) as { data: ClientAssignment[] | undefined; isLoading: boolean };

  // Fetch available agents for transfer
  const { data: availableAgents } = useQuery({
    queryKey: ["/api/organizations", user?.organizationId, "agents"],
    enabled: hasMinimumPrivilegeLevel(1) && !!user?.organizationId,
  }) as { data: any[] | undefined };

  // Fetch assignment history for selected client
  const { data: assignmentHistory } = useQuery({
    queryKey: ["/api/organizations", user?.organizationId, "client-assignments", "history", selectedClientId],
    enabled: !!selectedClientId && !!user?.organizationId,
  }) as { data: ClientAssignmentHistory[] | undefined; isLoading: boolean };

  const transferClientMutation = useMutation({
    mutationFn: async ({ clientId, fromAgentId, toAgentId, reason }: {
      clientId: string;
      fromAgentId: string;
      toAgentId: string;
      reason: string;
    }) => {
      return apiRequest(`/api/organizations/${user?.organizationId}/transfer-client`, {
        method: "POST",
        body: JSON.stringify({ clientId, fromAgentId, toAgentId, reason }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Client Transferred",
        description: "Client has been successfully transferred to the new agent.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", user?.organizationId, "clients"] });
      setSelectedClientId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to transfer client",
        variant: "destructive",
      });
    },
  });

  const filteredAssignments = assignments?.filter(assignment => {
    const clientName = `${assignment.client.profile?.firstName || ''} ${assignment.client.profile?.lastName || ''}`.trim();
    const searchMatch = assignment.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       assignment.agent.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const typeMatch = assignmentTypeFilter === "all" || assignment.assignmentType === assignmentTypeFilter;
    const statusMatch = statusFilter === "all" || assignment.status === statusFilter;

    return searchMatch && typeMatch && statusMatch;
  }) || [];

  const getAssignmentTypeColor = (type: string) => {
    switch (type) {
      case "primary": return "default";
      case "secondary": return "secondary";
      case "referral": return "outline";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "transferred": return "outline";
      default: return "outline";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Client Assignments" requiredRoles={["TenantAdmin", "SuperAdmin"]}>
        <div className="space-y-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Client Assignments" requiredRoles={["TenantAdmin", "SuperAdmin"]}>
      <div className="space-y-6" data-testid="client-assignments-page">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
              Client Assignments
            </h1>
            <p className="text-muted-foreground">
              Manage client-agent relationships and assignments
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Assignments</p>
                  <p className="text-2xl font-bold">{assignments?.length || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Primary Assignments</p>
                  <p className="text-2xl font-bold">
                    {assignments?.filter(a => a.assignmentType === "primary").length || 0}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Assignments</p>
                  <p className="text-2xl font-bold">
                    {assignments?.filter(a => a.status === "active").length || 0}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Transfers This Month</p>
                  <p className="text-2xl font-bold">
                    {assignments?.filter(a => a.status === "transferred").length || 0}
                  </p>
                </div>
                <ArrowRightLeft className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Assignments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  placeholder="Search clients or agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                  data-testid="search-assignments"
                />
              </div>
              <div>
                <Select value={assignmentTypeFilter} onValueChange={setAssignmentTypeFilter}>
                  <SelectTrigger data-testid="filter-assignment-type">
                    <SelectValue placeholder="Assignment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="filter-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="transferred">Transferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Client Assignments</CardTitle>
            <CardDescription>
              Manage and track all client-agent assignments in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="assignments-list">
              {filteredAssignments.map((assignment) => (
                <div 
                  key={assignment.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`assignment-${assignment.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {(assignment.client.profile?.firstName?.[0] || assignment.client.email[0]).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {assignment.client.profile?.firstName && assignment.client.profile?.lastName
                          ? `${assignment.client.profile.firstName} ${assignment.client.profile.lastName}`
                          : assignment.client.email}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Assigned to: {assignment.agent.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(assignment.assignedAt), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={getAssignmentTypeColor(assignment.assignmentType) as any}>
                      {assignment.assignmentType}
                    </Badge>
                    <Badge variant={getStatusColor(assignment.status) as any}>
                      {assignment.status}
                    </Badge>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedClientId(assignment.clientId)}
                            data-testid={`view-history-${assignment.id}`}
                          >
                            <History className="h-4 w-4 mr-1" />
                            History
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Assignment History</DialogTitle>
                            <DialogDescription>
                              View the assignment history for this client
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {assignmentHistory?.map((history) => (
                              <div key={history.id} className="border-l-2 border-muted pl-4">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium">
                                    Transfer: {history.previousAgent.email} → {history.newAgent.email}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {format(new Date(history.transferredAt), "MMM d, yyyy")}
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  Reason: {history.reason}
                                </div>
                              </div>
                            ))}
                            {(!assignmentHistory || assignmentHistory.length === 0) && (
                              <div className="text-center text-muted-foreground py-8">
                                No assignment history found
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      {assignment.status === "active" && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm"
                              data-testid={`transfer-client-${assignment.id}`}
                            >
                              <ArrowRightLeft className="h-4 w-4 mr-1" />
                              Transfer
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Transfer Client</DialogTitle>
                              <DialogDescription>
                                Transfer this client to a different agent
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Transfer to Agent:</label>
                                <Select>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select agent..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableAgents?.filter((agent: any) => agent.id !== assignment.agentId)
                                      .map((agent: any) => (
                                      <SelectItem key={agent.id} value={agent.id}>
                                        {agent.email} ({agent.profile?.specializations?.join(", ") || "No specializations"})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Reason for Transfer:</label>
                                <Input placeholder="Enter reason for transfer..." />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline">Cancel</Button>
                                <Button>Confirm Transfer</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredAssignments.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
                <p className="text-muted-foreground">
                  No client assignments match your current search criteria.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
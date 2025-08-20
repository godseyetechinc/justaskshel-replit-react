import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building, 
  Users, 
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Settings,
  Crown,
  Filter,
  Download
} from "lucide-react";

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

export default function OrganizationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organizations, isLoading } = useQuery({
    queryKey: ["/api/organizations"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/organizations/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({
        title: "Success",
        description: "Organization deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete organization",
        variant: "destructive",
      });
    },
  });

  const filteredOrganizations = organizations?.filter((org: Organization) => {
    const matchesSearch = `${org.name} ${org.displayName} ${org.email || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || org.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge variant="default">Active</Badge>;
      case "Inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "Suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "Enterprise":
        return <Badge className="bg-purple-100 text-purple-800"><Crown className="h-3 w-3 mr-1" />Enterprise</Badge>;
      case "Professional":
        return <Badge className="bg-blue-100 text-blue-800">Professional</Badge>;
      case "Basic":
        return <Badge className="bg-gray-100 text-gray-800">Basic</Badge>;
      default:
        return <Badge variant="secondary">{plan}</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <DashboardLayout title="Organization Management" requiredRoles={["LandlordAdmin"]}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agent Organizations</h1>
              <p className="text-sm text-gray-600">
                Manage multi-tenant agent organizations ({filteredOrganizations?.length || 0} of {organizations?.length || 0} organizations)
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Organization
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or organization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading organizations...</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && (!organizations || organizations.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Organizations Found</h3>
              <p className="text-gray-600 mb-4">
                There are no agent organizations in the system yet.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add First Organization
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Organizations Grid */}
        {!isLoading && filteredOrganizations && filteredOrganizations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizations.map((org: Organization) => (
              <Card key={org.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: org.primaryColor || "#0EA5E9" }}
                      >
                        {org.displayName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{org.displayName}</h3>
                        <p className="text-sm text-gray-600">{org.name}</p>
                      </div>
                    </div>
                    {getStatusBadge(org.status)}
                  </div>
                  {getPlanBadge(org.subscriptionPlan)}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {org.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-3 w-3 mr-2" />
                        <span className="truncate">{org.email}</span>
                      </div>
                    )}
                    {org.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-3 w-3 mr-2" />
                        {org.phone}
                      </div>
                    )}
                    {org.website && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Globe className="h-3 w-3 mr-2" />
                        <span className="truncate">{org.website}</span>
                      </div>
                    )}
                    {(org.city || org.state) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-2" />
                        {org.city && `${org.city}, `}{org.state}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3 w-3 mr-2" />
                      Created {formatDate(org.createdAt)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="font-medium">Max Agents</div>
                      <div className="text-gray-600">{org.maxAgents}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="font-medium">Max Members</div>
                      <div className="text-gray-600">{org.maxMembers}</div>
                    </div>
                  </div>
                  
                  {org.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{org.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedOrg(org)}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Manage
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <div 
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: selectedOrg?.primaryColor || "#0EA5E9" }}
                            >
                              {selectedOrg?.displayName.charAt(0)}
                            </div>
                            {selectedOrg?.displayName} - Organization Management
                          </DialogTitle>
                          <DialogDescription>
                            Comprehensive organization settings and member management
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedOrg && (
                          <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                              <TabsTrigger value="overview">Overview</TabsTrigger>
                              <TabsTrigger value="settings">Settings</TabsTrigger>
                              <TabsTrigger value="users">Users</TabsTrigger>
                              <TabsTrigger value="billing">Billing</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="overview" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <Building className="h-5 w-5" />
                                    Organization Details
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Organization Name</label>
                                      <p className="text-gray-900">{selectedOrg.name}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Display Name</label>
                                      <p className="text-gray-900">{selectedOrg.displayName}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Status</label>
                                      <div className="mt-1">{getStatusBadge(selectedOrg.status)}</div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Subscription Plan</label>
                                      <div className="mt-1">{getPlanBadge(selectedOrg.subscriptionPlan)}</div>
                                    </div>
                                  </div>
                                  
                                  {selectedOrg.description && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Description</label>
                                      <p className="text-gray-900 mt-1">{selectedOrg.description}</p>
                                    </div>
                                  )}
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Created</label>
                                      <p className="text-gray-900">{formatDate(selectedOrg.createdAt)}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Last Updated</label>
                                      <p className="text-gray-900">{formatDate(selectedOrg.updatedAt)}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>
                            
                            <TabsContent value="settings" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Contact Information
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Email</label>
                                      <p className="text-gray-900">{selectedOrg.email || "Not provided"}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Phone</label>
                                      <p className="text-gray-900">{selectedOrg.phone || "Not provided"}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Website</label>
                                      <p className="text-gray-900">{selectedOrg.website || "Not provided"}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Address</label>
                                    <div className="mt-1 space-y-1">
                                      {selectedOrg.address && (
                                        <p className="text-gray-900">{selectedOrg.address}</p>
                                      )}
                                      {(selectedOrg.city || selectedOrg.state || selectedOrg.zipCode) && (
                                        <p className="text-gray-900">
                                          {selectedOrg.city && `${selectedOrg.city}, `}
                                          {selectedOrg.state && `${selectedOrg.state} `}
                                          {selectedOrg.zipCode}
                                        </p>
                                      )}
                                      {!selectedOrg.address && !selectedOrg.city && (
                                        <p className="text-gray-500">Address not provided</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Primary Color</label>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <div 
                                          className="w-6 h-6 rounded border border-gray-300"
                                          style={{ backgroundColor: selectedOrg.primaryColor }}
                                        ></div>
                                        <span className="text-gray-900">{selectedOrg.primaryColor}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Secondary Color</label>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <div 
                                          className="w-6 h-6 rounded border border-gray-300"
                                          style={{ backgroundColor: selectedOrg.secondaryColor }}
                                        ></div>
                                        <span className="text-gray-900">{selectedOrg.secondaryColor}</span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>
                            
                            <TabsContent value="users" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Organization Users
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-gray-600">
                                    Users and members associated with this organization would be displayed here.
                                  </p>
                                </CardContent>
                              </Card>
                            </TabsContent>
                            
                            <TabsContent value="billing" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <Crown className="h-5 w-5" />
                                    Subscription & Billing
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Current Plan</label>
                                      <div className="mt-1">{getPlanBadge(selectedOrg.subscriptionPlan)}</div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Subscription Status</label>
                                      <p className="text-gray-900">{selectedOrg.subscriptionStatus}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Max Agents</label>
                                      <p className="text-gray-900">{selectedOrg.maxAgents}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Max Members</label>
                                      <p className="text-gray-900">{selectedOrg.maxMembers}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>
                          </Tabs>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteMutation.mutate(org.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && filteredOrganizations && filteredOrganizations.length === 0 && organizations && organizations.length > 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Organizations</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search or filter criteria to find organizations.
              </p>
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
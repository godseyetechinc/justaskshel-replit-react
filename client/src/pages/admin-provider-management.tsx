import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle, Clock, Settings, Eye, Search, RefreshCw, Edit, Play, Zap, BarChart3, Activity } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard-layout";
import { apiRequest } from "@/lib/queryClient";

interface ExternalQuoteRequest {
  id: number;
  requestId: string;
  userId: string | null;
  requestData: any;
  responseData: any;
  status: "pending" | "success" | "error";
  providersRequested: string[];
  providersResponded: string[];
  createdAt: string;
  updatedAt: string;
  errorMessage: string | null;
}

interface ProviderConfig {
  id: string;
  name: string;
  displayName: string;
  baseUrl: string;
  apiKey?: string;
  authHeader?: string;
  isActive: boolean;
  supportedCoverageTypes: string[];
  priority: number;
  mockMode: boolean;
  rateLimit: {
    requestsPerSecond: number;
    burstLimit: number;
  };
  timeout: number;
  retryConfig: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
}

interface ProviderStats {
  providerId: string;
  providerName: string;
  isActive: boolean;
  mockMode: boolean;
  priority: number;
  successfulRequests: number;
  failedRequests: number;
  totalRequests: number;
  successRate: number;
  supportedCoverageTypes: string[];
}

// Form validation schema
const editProviderSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  baseUrl: z.string().url("Invalid URL format"),
  apiKey: z.string().optional(),
  authHeader: z.string().optional(),
  isActive: z.boolean(),
  priority: z.number().min(1).max(100),
  mockMode: z.boolean(),
  supportedCoverageTypes: z.array(z.string()).min(1, "At least one coverage type required"),
  timeout: z.number().min(1000).max(30000),
  requestsPerSecond: z.number().min(1).max(100),
  burstLimit: z.number().min(1).max(1000),
  maxRetries: z.number().min(0).max(10),
  backoffMultiplier: z.number().min(1).max(5),
  initialDelay: z.number().min(100).max(5000),
});

type EditProviderFormData = z.infer<typeof editProviderSchema>;

export default function AdminProviderManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const form = useForm<EditProviderFormData>({
    resolver: zodResolver(editProviderSchema),
    defaultValues: {
      isActive: true,
      mockMode: false,
      priority: 1,
      timeout: 5000,
      requestsPerSecond: 10,
      burstLimit: 50,
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 500,
      supportedCoverageTypes: [],
    },
  });

  // Ensure only SuperAdmin can access this page
  if (!user || user.privilegeLevel !== 0) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>SuperAdmin privileges required to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const { data: quoteRequestsData, isLoading: loadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['/api/admin/external-quote-requests', currentPage, pageSize],
    queryFn: async () => {
      const response = await fetch(`/api/admin/external-quote-requests?page=${currentPage}&limit=${pageSize}`);
      if (!response.ok) throw new Error('Failed to fetch quote requests');
      return response.json();
    },
  });

  const { data: providerConfigsData, isLoading: loadingProviders, refetch: refetchProviders } = useQuery({
    queryKey: ['/api/admin/provider-configs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/provider-configs');
      if (!response.ok) throw new Error('Failed to fetch provider configs');
      return response.json();
    },
  });

  const { data: providerStats, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['/api/admin/provider-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/provider-stats');
      if (!response.ok) throw new Error('Failed to fetch provider stats');
      return response.json();
    },
  });

  // Mutations
  const updateProviderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EditProviderFormData> }) => {
      return await apiRequest(`/api/admin/provider-configs/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          displayName: data.displayName,
          baseUrl: data.baseUrl,
          apiKey: data.apiKey,
          authHeader: data.authHeader,
          isActive: data.isActive,
          priority: data.priority,
          mockMode: data.mockMode,
          supportedCoverageTypes: data.supportedCoverageTypes,
          timeout: data.timeout,
          rateLimit: {
            requestsPerSecond: data.requestsPerSecond || 10,
            burstLimit: data.burstLimit || 50,
          },
          retryConfig: {
            maxRetries: data.maxRetries || 3,
            backoffMultiplier: data.backoffMultiplier || 2,
            initialDelay: data.initialDelay || 500,
          },
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/provider-configs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/provider-stats'] });
      setEditDialogOpen(false);
      setEditingProvider(null);
      form.reset();
      toast({
        title: "Success",
        description: "Provider configuration updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update provider configuration",
        variant: "destructive",
      });
    },
  });

  const testProviderMutation = useMutation({
    mutationFn: async (providerId: string) => {
      const response = await fetch(`/api/admin/provider-configs/${providerId}/test`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to test provider');
      return response.json();
    },
    onSuccess: (data, providerId) => {
      toast({
        title: data.success ? "Connection Successful" : "Connection Failed",
        description: data.success 
          ? `Provider responded in ${data.responseTime}ms`
          : `Error: ${data.error}`,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test provider connection",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    refetchRequests();
    refetchProviders();
    refetchStats();
  };

  const handleEditProvider = (provider: ProviderConfig) => {
    setEditingProvider(provider);
    form.reset({
      displayName: provider.displayName,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey || "",
      authHeader: provider.authHeader || "",
      isActive: provider.isActive,
      priority: provider.priority,
      mockMode: provider.mockMode,
      supportedCoverageTypes: provider.supportedCoverageTypes,
      timeout: provider.timeout,
      requestsPerSecond: provider.rateLimit.requestsPerSecond,
      burstLimit: provider.rateLimit.burstLimit,
      maxRetries: provider.retryConfig.maxRetries,
      backoffMultiplier: provider.retryConfig.backoffMultiplier,
      initialDelay: provider.retryConfig.initialDelay,
    });
    setEditDialogOpen(true);
  };

  const onSubmit = (data: EditProviderFormData) => {
    if (editingProvider) {
      updateProviderMutation.mutate({ id: editingProvider.id, data });
    }
  };

  const handleTestProvider = (providerId: string) => {
    testProviderMutation.mutate(providerId);
  };

  const availableCoverageTypes = [
    "life", "health", "dental", "vision", "disability", "auto", "home", "renters"
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProviderBadge = (isActive: boolean, mockMode: boolean) => {
    if (!isActive) {
      return <Badge variant="outline" className="text-gray-500">Inactive</Badge>;
    }
    if (mockMode) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Mock Mode</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Live</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Provider Management</h1>
            <p className="text-gray-600 mt-2">Monitor external API requests and manage provider configurations</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="statistics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="statistics" data-testid="tab-statistics">Statistics</TabsTrigger>
            <TabsTrigger value="providers" data-testid="tab-providers">Provider Management</TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-requests">Quote Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="statistics" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{providerConfigsData?.summary?.totalProviders || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{providerConfigsData?.summary?.activeProviders || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {providerStats?.reduce((acc: number, stat: ProviderStats) => acc + stat.totalRequests, 0) || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Success Rate</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {providerStats?.length 
                      ? Math.round(providerStats.reduce((acc: number, stat: ProviderStats) => acc + stat.successRate, 0) / providerStats.length)
                      : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Provider Performance Statistics
                </CardTitle>
                <CardDescription>
                  Detailed performance metrics for all insurance providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    Loading statistics...
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Provider</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Total Requests</TableHead>
                          <TableHead>Success Rate</TableHead>
                          <TableHead>Coverage Types</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {providerStats?.map((stat: ProviderStats) => (
                          <TableRow key={stat.providerId}>
                            <TableCell className="font-medium">{stat.providerName}</TableCell>
                            <TableCell>{getProviderBadge(stat.isActive, stat.mockMode)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{stat.priority}</Badge>
                            </TableCell>
                            <TableCell>{stat.totalRequests}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="w-16 mr-2">
                                  <div className="h-2 bg-gray-200 rounded-full">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        stat.successRate >= 90 ? 'bg-green-500' :
                                        stat.successRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${stat.successRate}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-sm">{stat.successRate.toFixed(1)}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {stat.supportedCoverageTypes?.slice(0, 3).map((type: string) => (
                                  <Badge key={type} variant="outline" className="text-xs">
                                    {type}
                                  </Badge>
                                ))}
                                {stat.supportedCoverageTypes?.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{stat.supportedCoverageTypes.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )) || (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              No statistics available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                External Quote Requests
              </CardTitle>
              <CardDescription>
                Monitor all API requests made to external insurance providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading requests...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search by request ID or user ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                        data-testid="input-search-requests"
                      />
                    </div>
                    <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 per page</SelectItem>
                        <SelectItem value="25">25 per page</SelectItem>
                        <SelectItem value="50">50 per page</SelectItem>
                        <SelectItem value="100">100 per page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Request ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Providers</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quoteRequestsData?.requests?.length > 0 ? (
                          quoteRequestsData.requests
                            .filter((request: ExternalQuoteRequest) => 
                              !searchTerm || 
                              request.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              request.userId?.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((request: ExternalQuoteRequest) => (
                              <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                                <TableCell className="font-mono text-sm">
                                  {request.requestId.substring(0, 8)}...
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(request.status)}
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm text-gray-600">
                                      Requested: {request.providersRequested?.length || 0}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      Responded: {request.providersResponded?.length || 0}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {request.userId ? request.userId.substring(0, 8) + '...' : 'Anonymous'}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(request.createdAt), 'MMM dd, HH:mm')}
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    data-testid={`button-view-request-${request.id}`}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              No quote requests found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {quoteRequestsData?.pagination && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, quoteRequestsData.pagination.total)} of {quoteRequestsData.pagination.total} requests
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage <= 1}
                          data-testid="button-prev-page"
                        >
                          Previous
                        </Button>
                        <span className="text-sm">
                          Page {currentPage} of {quoteRequestsData.pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(quoteRequestsData.pagination.totalPages, currentPage + 1))}
                          disabled={currentPage >= quoteRequestsData.pagination.totalPages}
                          data-testid="button-next-page"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Provider Configuration
              </CardTitle>
              <CardDescription>
                View and monitor external insurance provider API configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProviders ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading provider configurations...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Active Providers</p>
                            <p className="text-2xl font-bold">{providerConfigsData?.summary?.activeProviders || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <Settings className="h-8 w-8 text-blue-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Providers</p>
                            <p className="text-2xl font-bold">{providerConfigsData?.summary?.totalProviders || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <AlertCircle className="h-8 w-8 text-orange-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Inactive Providers</p>
                            <p className="text-2xl font-bold">{providerConfigsData?.summary?.inactiveProviders || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Provider Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Provider</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>API URL</TableHead>
                          <TableHead>Coverage Types</TableHead>
                          <TableHead>Priority</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {providerConfigsData?.all?.map((provider: ProviderConfig) => (
                          <TableRow key={provider.id} data-testid={`row-provider-${provider.id}`}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{provider.name}</div>
                                <div className="text-sm text-gray-500">{provider.id}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getProviderBadge(provider.isActive, provider.mockMode)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {provider.apiUrl}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {provider.supportedCoverageTypes?.map((type: string) => (
                                  <Badge key={type} variant="outline" className="text-xs">
                                    {type}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{provider.priority}</Badge>
                            </TableCell>
                          </TableRow>
                        )) || (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                              No provider configurations found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}
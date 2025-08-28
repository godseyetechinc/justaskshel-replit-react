import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, Clock, Settings, Eye, Search, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard-layout";

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
  isActive: boolean;
  apiUrl: string;
  supportedCoverageTypes: string[];
  priority: number;
  mockMode: boolean;
}

export default function AdminProviderManagement() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleRefresh = () => {
    refetchRequests();
    refetchProviders();
  };

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

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests" data-testid="tab-requests">Quote Requests</TabsTrigger>
            <TabsTrigger value="providers" data-testid="tab-providers">Provider Configuration</TabsTrigger>
          </TabsList>

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
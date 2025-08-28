import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPolicySchema } from "@shared/schema";
import { z } from "zod";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  Calendar,
  DollarSign,
  AlertCircle,
  FileText,
  CreditCard,
  Settings,
  Download,
  Upload,
  Eye,
  RefreshCw,
  Filter,
  MoreHorizontal,
  Clock,
  Users,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  XCircle,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { format } from "date-fns";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const policyFormSchema = insertPolicySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const statusColors = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Suspended: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Lapsed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
};

const paymentFrequencyColors = {
  Monthly: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Quarterly: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Semi-Annual": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Annual: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
};

export default function PoliciesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedView, setSelectedView] = useState<"table" | "cards">("table");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [isPolicyDetailOpen, setIsPolicyDetailOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission, isSuperAdmin, isTenantAdmin } = useRoleAuth();
  const queryClient = useQueryClient();

  // Check permissions
  const canWrite = hasPermission("write");
  const canDelete = hasPermission("delete");
  const canViewAll = isSuperAdmin || isTenantAdmin;

  // Fetch policies based on user role
  const { data: policies = [], isLoading } = useQuery({
    queryKey: canViewAll ? ["/api/policies/all"] : ["/api/policies"],
  });

  // Create/Update policy mutation
  const policyMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingPolicy) {
        return apiRequest(`/api/policies/${editingPolicy.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      } else {
        return apiRequest("/api/policies", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/policies/all"] });
      setIsDialogOpen(false);
      setEditingPolicy(null);
      toast({
        title: editingPolicy ? "Policy Updated" : "Policy Created",
        description: `Policy has been ${editingPolicy ? "updated" : "created"} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save policy",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof policyFormSchema>>({
    resolver: zodResolver(policyFormSchema),
    defaultValues: {
      policyNumber: "",
      status: "Pending",
      paymentFrequency: "Monthly",
      medicalExamRequired: false,
      medicalExamCompleted: false,
      autoRenewal: true,
    },
  });

  // Filter policies based on search and status
  const filteredPolicies = policies.filter((policy: any) => {
    const matchesSearch = policy.policyNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.quote?.type?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.quote?.provider?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || policy.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination for policies
  const totalPolicies = filteredPolicies.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalPolicies);
  const paginatedPolicies = filteredPolicies.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalPolicies / pageSize);
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  const handleEdit = (policy: any) => {
    setEditingPolicy(policy);
    form.reset({
      policyNumber: policy.policyNumber || "",
      status: policy.status || "Pending",
      startDate: policy.startDate ? new Date(policy.startDate) : undefined,
      endDate: policy.endDate ? new Date(policy.endDate) : undefined,
      renewalDate: policy.renewalDate ? new Date(policy.renewalDate) : undefined,
      nextPaymentDate: policy.nextPaymentDate ? new Date(policy.nextPaymentDate) : undefined,
      annualPremium: policy.annualPremium || "",
      monthlyPremium: policy.monthlyPremium || "",
      paymentFrequency: policy.paymentFrequency || "Monthly",
      coverageAmount: policy.coverageAmount || "",
      deductible: policy.deductible || "",
      medicalExamRequired: policy.medicalExamRequired || false,
      medicalExamCompleted: policy.medicalExamCompleted || false,
      medicalExamDate: policy.medicalExamDate ? new Date(policy.medicalExamDate) : undefined,
      issuedDate: policy.issuedDate ? new Date(policy.issuedDate) : undefined,
      lastReviewDate: policy.lastReviewDate ? new Date(policy.lastReviewDate) : undefined,
      autoRenewal: policy.autoRenewal !== undefined ? policy.autoRenewal : true,
      notes: policy.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleViewDetails = (policy: any) => {
    setSelectedPolicy(policy);
    setIsPolicyDetailOpen(true);
  };

  const onSubmit = (data: z.infer<typeof policyFormSchema>) => {
    policyMutation.mutate(data);
  };

  const resetForm = () => {
    form.reset();
    setEditingPolicy(null);
    setIsDialogOpen(false);
  };

  // Policy statistics
  const policyStats = {
    total: policies.length,
    active: policies.filter((p: any) => p.status === "Active").length,
    pending: policies.filter((p: any) => p.status === "Pending").length,
    expired: policies.filter((p: any) => p.status === "Expired").length,
    totalCoverage: policies.reduce((sum: number, p: any) => sum + (parseFloat(p.coverageAmount) || 0), 0),
    totalPremium: policies.reduce((sum: number, p: any) => sum + (parseFloat(p.annualPremium) || 0), 0),
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div data-testid="loading-policies" className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading policies...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Policy Management</h1>
            <p className="text-muted-foreground">
              Comprehensive insurance policy management with document tracking and premium monitoring
            </p>
          </div>
          {canWrite && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-policy" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Policy
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingPolicy ? "Edit Policy" : "Create New Policy"}</DialogTitle>
                  <DialogDescription>
                    {editingPolicy ? "Update policy information" : "Add a new insurance policy to the system"}
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="policyNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Policy Number</FormLabel>
                            <FormControl>
                              <Input data-testid="input-policy-number" placeholder="POL-12345" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-status">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Expired">Expired</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                <SelectItem value="Suspended">Suspended</SelectItem>
                                <SelectItem value="Lapsed">Lapsed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="annualPremium"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual Premium ($)</FormLabel>
                            <FormControl>
                              <Input data-testid="input-annual-premium" type="number" step="0.01" placeholder="1200.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="monthlyPremium"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Premium ($)</FormLabel>
                            <FormControl>
                              <Input data-testid="input-monthly-premium" type="number" step="0.01" placeholder="100.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paymentFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Frequency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-payment-frequency">
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Monthly">Monthly</SelectItem>
                                <SelectItem value="Quarterly">Quarterly</SelectItem>
                                <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                                <SelectItem value="Annual">Annual</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="coverageAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coverage Amount ($)</FormLabel>
                            <FormControl>
                              <Input data-testid="input-coverage-amount" type="number" step="0.01" placeholder="100000.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="deductible"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deductible ($)</FormLabel>
                            <FormControl>
                              <Input data-testid="input-deductible" type="number" step="0.01" placeholder="1000.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-start-date" 
                                type="date" 
                                value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              data-testid="input-notes" 
                              placeholder="Additional policy notes and details..." 
                              className="min-h-[100px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={resetForm} data-testid="button-cancel">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={policyMutation.isPending} data-testid="button-save-policy">
                        {policyMutation.isPending ? "Saving..." : (editingPolicy ? "Update Policy" : "Create Policy")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{policyStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {policyStats.active} active, {policyStats.pending} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Coverage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${policyStats.totalCoverage.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Combined coverage amount
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Premiums</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${policyStats.totalPremium.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Total annual premium revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {policyStats.total > 0 ? Math.round((policyStats.active / policyStats.total) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {policyStats.active} of {policyStats.total} policies
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    data-testid="input-search-policies"
                    placeholder="Search policies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger data-testid="select-filter-status" className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                    <SelectItem value="Lapsed">Lapsed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedView === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedView("table")}
                  data-testid="button-table-view"
                >
                  Table View
                </Button>
                <Button
                  variant={selectedView === "cards" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedView("cards")}
                  data-testid="button-cards-view"
                >
                  Cards View
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedView === "table" ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[70px]">Actions</TableHead>
                      <TableHead>Policy Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Coverage</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Start Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPolicies.map((policy: any) => (
                      <TableRow key={policy.id} data-testid={`row-policy-${policy.id}`}>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`button-actions-${policy.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewDetails(policy)} data-testid={`action-view-${policy.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(policy)} data-testid={`action-edit-${policy.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Policy
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(policy.id)}
                                className="text-destructive focus:text-destructive"
                                data-testid={`action-delete-${policy.id}`}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Policy
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="font-medium">
                          <Button 
                            variant="link" 
                            className="p-0 h-auto font-medium"
                            onClick={() => handleViewDetails(policy)}
                            data-testid={`link-policy-${policy.id}`}
                          >
                            {policy.policyNumber}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[policy.status as keyof typeof statusColors]}>
                            {policy.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{policy.quote?.type?.name || "N/A"}</TableCell>
                        <TableCell>{policy.quote?.provider?.name || "N/A"}</TableCell>
                        <TableCell>
                          {policy.coverageAmount ? `$${parseFloat(policy.coverageAmount).toLocaleString()}` : "N/A"}
                        </TableCell>
                        <TableCell>
                          {policy.annualPremium ? `$${parseFloat(policy.annualPremium).toLocaleString()}` : "N/A"}
                        </TableCell>
                        <TableCell>
                          {policy.paymentFrequency && (
                            <Badge className={paymentFrequencyColors[policy.paymentFrequency as keyof typeof paymentFrequencyColors]}>
                              {policy.paymentFrequency}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {policy.startDate ? format(new Date(policy.startDate), "MMM dd, yyyy") : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                {totalPolicies > pageSize && (
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, totalPolicies)} of {totalPolicies} policies
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (hasPrev) setCurrentPage(currentPage - 1);
                            }}
                            className={!hasPrev ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        {Array.from({length: totalPages}, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (hasNext) setCurrentPage(currentPage + 1);
                            }}
                            className={!hasNext ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}

                {paginatedPolicies.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No policies found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || selectedStatus !== "all" 
                        ? "Try adjusting your search or filter criteria." 
                        : "Create your first policy to get started."}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPolicies.map((policy: any) => (
                  <Card key={policy.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewDetails(policy)} data-testid={`card-policy-${policy.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{policy.policyNumber}</CardTitle>
                        <Badge className={statusColors[policy.status as keyof typeof statusColors]}>
                          {policy.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {policy.quote?.type?.name} • {policy.quote?.provider?.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Coverage:</span>
                        <span className="font-medium">
                          {policy.coverageAmount ? `$${parseFloat(policy.coverageAmount).toLocaleString()}` : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Premium:</span>
                        <span className="font-medium">
                          {policy.annualPremium ? `$${parseFloat(policy.annualPremium).toLocaleString()}/year` : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Payment:</span>
                        {policy.paymentFrequency && (
                          <Badge className={paymentFrequencyColors[policy.paymentFrequency as keyof typeof paymentFrequencyColors]}>
                            {policy.paymentFrequency}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Start Date:</span>
                        <span className="font-medium">
                          {policy.startDate ? format(new Date(policy.startDate), "MMM dd, yyyy") : "N/A"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredPolicies.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No policies found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || selectedStatus !== "all" 
                        ? "Try adjusting your search or filter criteria." 
                        : "Create your first policy to get started."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Policy Detail Dialog */}
        <Dialog open={isPolicyDetailOpen} onOpenChange={setIsPolicyDetailOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Policy Details: {selectedPolicy?.policyNumber}
              </DialogTitle>
              <DialogDescription>
                Comprehensive policy information, documents, payments, and amendments
              </DialogDescription>
            </DialogHeader>

            {selectedPolicy && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                  <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
                  <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
                  <TabsTrigger value="amendments" data-testid="tab-amendments">Amendments</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Policy Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className={statusColors[selectedPolicy.status as keyof typeof statusColors]}>
                            {selectedPolicy.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span>{selectedPolicy.quote?.type?.name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Provider:</span>
                          <span>{selectedPolicy.quote?.provider?.name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Start Date:</span>
                          <span>{selectedPolicy.startDate ? format(new Date(selectedPolicy.startDate), "MMM dd, yyyy") : "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">End Date:</span>
                          <span>{selectedPolicy.endDate ? format(new Date(selectedPolicy.endDate), "MMM dd, yyyy") : "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Auto Renewal:</span>
                          <span>{selectedPolicy.autoRenewal ? "Yes" : "No"}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Financial Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Coverage Amount:</span>
                          <span className="font-medium">
                            {selectedPolicy.coverageAmount ? `$${parseFloat(selectedPolicy.coverageAmount).toLocaleString()}` : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Annual Premium:</span>
                          <span className="font-medium">
                            {selectedPolicy.annualPremium ? `$${parseFloat(selectedPolicy.annualPremium).toLocaleString()}` : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Monthly Premium:</span>
                          <span className="font-medium">
                            {selectedPolicy.monthlyPremium ? `$${parseFloat(selectedPolicy.monthlyPremium).toLocaleString()}` : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Frequency:</span>
                          {selectedPolicy.paymentFrequency && (
                            <Badge className={paymentFrequencyColors[selectedPolicy.paymentFrequency as keyof typeof paymentFrequencyColors]}>
                              {selectedPolicy.paymentFrequency}
                            </Badge>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deductible:</span>
                          <span className="font-medium">
                            {selectedPolicy.deductible ? `$${parseFloat(selectedPolicy.deductible).toLocaleString()}` : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Next Payment:</span>
                          <span>{selectedPolicy.nextPaymentDate ? format(new Date(selectedPolicy.nextPaymentDate), "MMM dd, yyyy") : "N/A"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedPolicy.notes && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">{selectedPolicy.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Policy Documents
                      </CardTitle>
                      <CardDescription>
                        Manage documents related to this policy
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="mx-auto h-12 w-12 mb-4" />
                        <p>Document management feature coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment History
                      </CardTitle>
                      <CardDescription>
                        Track premium payments and payment schedule
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <CreditCard className="mx-auto h-12 w-12 mb-4" />
                        <p>Payment tracking feature coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="amendments" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Policy Amendments
                      </CardTitle>
                      <CardDescription>
                        View and manage policy changes and amendments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <Settings className="mx-auto h-12 w-12 mb-4" />
                        <p>Amendment tracking feature coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
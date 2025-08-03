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
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { format } from "date-fns";

const policyFormSchema = insertPolicySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const statusColors = {
  Active: "bg-green-100 text-green-800",
  Expired: "bg-red-100 text-red-800",
  Cancelled: "bg-gray-100 text-gray-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Suspended: "bg-orange-100 text-orange-800"
};

export default function PoliciesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = useRoleAuth();
  const queryClient = useQueryClient();

  // Check permissions
  const canWrite = hasPermission("write");
  const canDelete = hasPermission("delete");

  // Fetch policies
  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["/api/policies"],
  });

  // Create/Update policy mutation
  const policyMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingPolicy) {
        return apiRequest(`/api/policies/${editingPolicy.id}`, "PUT", data);
      } else {
        return apiRequest("/api/policies", "POST", data);
      }
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: `Policy ${editingPolicy ? 'updated' : 'created'} successfully` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      setIsDialogOpen(false);
      setEditingPolicy(null);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: `Failed to ${editingPolicy ? 'update' : 'create'} policy`, 
        variant: "destructive" 
      });
    },
  });

  // Delete policy mutation
  const deletePolicyMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/policies/${id}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "Success", description: "Policy deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete policy", variant: "destructive" });
    },
  });

  const form = useForm({
    resolver: zodResolver(policyFormSchema),
    defaultValues: {
      userId: user?.id || "",
      quoteId: 0,
      policyNumber: "",
      status: "Pending",
      effectiveDate: new Date().toISOString().split('T')[0],
      expirationDate: "",
      annualPremium: "0",
      coverageAmount: "0",
      paymentFrequency: "Monthly",
      notes: "",
    },
  });

  const onSubmit = (data: any) => {
    policyMutation.mutate({
      ...data,
      annualPremium: parseFloat(data.annualPremium),
      coverageAmount: parseFloat(data.coverageAmount),
      effectiveDate: new Date(data.effectiveDate).toISOString(),
      expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString() : null,
    });
  };

  const handleEdit = (policy: any) => {
    setEditingPolicy(policy);
    form.reset({
      userId: policy.userId || "",
      quoteId: policy.quoteId || 0,
      policyNumber: policy.policyNumber || "",
      status: policy.status || "Pending",
      effectiveDate: policy.effectiveDate ? new Date(policy.effectiveDate).toISOString().split('T')[0] : "",
      expirationDate: policy.expirationDate ? new Date(policy.expirationDate).toISOString().split('T')[0] : "",
      annualPremium: policy.annualPremium?.toString() || "0",
      coverageAmount: policy.coverageAmount?.toString() || "0",
      paymentFrequency: policy.paymentFrequency || "Monthly",
      notes: policy.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this policy?")) {
      deletePolicyMutation.mutate(id);
    }
  };

  const filteredPolicies = policies.filter((policy: any) => {
    const matchesSearch = 
      policy.policyNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || policy.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Insurance Policies</h1>
            <p className="text-gray-600">Manage active insurance policies and coverage</p>
          </div>
          {canWrite && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary text-white hover:bg-primary/90"
                  onClick={() => {
                    setEditingPolicy(null);
                    form.reset();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Policy
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPolicy ? "Edit Policy" : "Create New Policy"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPolicy ? "Update policy details" : "Create a new insurance policy"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="policyNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Policy Number</FormLabel>
                            <FormControl>
                              <Input placeholder="POL-2024-001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="quoteId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quote ID</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Expired">Expired</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                <SelectItem value="Suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
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
                                <SelectTrigger>
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="effectiveDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Effective Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="expirationDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiration Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="annualPremium"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual Premium ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="1200.00" {...field} />
                            </FormControl>
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
                              <Input type="number" step="0.01" placeholder="100000.00" {...field} />
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
                              placeholder="Additional policy notes..." 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={policyMutation.isPending}>
                        {policyMutation.isPending ? "Saving..." : editingPolicy ? "Update Policy" : "Create Policy"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Policies Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Policies ({filteredPolicies.length})</CardTitle>
            <CardDescription>
              Manage insurance policies and track coverage status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading policies...</div>
            ) : filteredPolicies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || selectedStatus !== "all" ? "No policies match your filters" : "No policies found"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy</TableHead>
                      <TableHead>Coverage</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Effective Period</TableHead>
                      <TableHead>Status</TableHead>
                      {(canWrite || canDelete) && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPolicies.map((policy: any) => (
                      <TableRow key={policy.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Shield className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {policy.policyNumber || `Policy #${policy.id}`}
                              </div>
                              <div className="text-sm text-gray-500">Quote #{policy.quoteId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            ${policy.coverageAmount?.toLocaleString() || '0'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">${policy.annualPremium?.toLocaleString() || '0'}/year</div>
                            <div className="text-sm text-gray-500">{policy.paymentFrequency}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {policy.effectiveDate ? format(new Date(policy.effectiveDate), 'MMM dd, yyyy') : 'N/A'}
                            </div>
                            {policy.expirationDate && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <AlertCircle className="h-3 w-3" />
                                {format(new Date(policy.expirationDate), 'MMM dd, yyyy')}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[policy.status as keyof typeof statusColors] || statusColors.Pending}>
                            {policy.status}
                          </Badge>
                        </TableCell>
                        {(canWrite || canDelete) && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {canWrite && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(policy)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(policy.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
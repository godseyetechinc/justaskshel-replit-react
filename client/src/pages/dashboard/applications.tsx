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
import { insertApplicationSchema } from "@shared/schema";
import { z } from "zod";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  Calendar,
  User,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { format } from "date-fns";

const applicationFormSchema = insertApplicationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const statusColors = {
  Draft: "bg-gray-100 text-gray-800",
  Submitted: "bg-blue-100 text-blue-800",
  Under_Review: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  Cancelled: "bg-gray-100 text-gray-800"
};

export default function ApplicationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = useRoleAuth();
  const queryClient = useQueryClient();

  // Check permissions
  const canWrite = hasPermission("write");
  const canDelete = hasPermission("delete");

  // Fetch applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["/api/applications"],
  });

  // Create/Update application mutation
  const applicationMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingApplication) {
        return apiRequest(`/api/applications/${editingApplication.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      } else {
        return apiRequest("/api/applications", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: `Application ${editingApplication ? 'updated' : 'created'} successfully` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      setIsDialogOpen(false);
      setEditingApplication(null);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: `Failed to ${editingApplication ? 'update' : 'create'} application`, 
        variant: "destructive" 
      });
    },
  });

  // Delete application mutation
  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/applications/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      toast({ title: "Success", description: "Application deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete application", variant: "destructive" });
    },
  });

  const form = useForm({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      userId: user?.id || "",
      quoteId: 0,
      status: "Draft",
      applicationDate: new Date().toISOString().split('T')[0],
      annualPremium: "0",
      coverageAmount: "0",
      beneficiaryName: "",
      beneficiaryRelation: "",
      medicalExamCompleted: false,
      underwritingNotes: "",
    },
  });

  const onSubmit = (data: any) => {
    applicationMutation.mutate({
      ...data,
      annualPremium: parseFloat(data.annualPremium),
      coverageAmount: parseFloat(data.coverageAmount),
      applicationDate: new Date(data.applicationDate).toISOString(),
    });
  };

  const handleEdit = (application: any) => {
    setEditingApplication(application);
    form.reset({
      userId: application.userId || "",
      quoteId: application.quoteId || 0,
      status: application.status || "Draft",
      applicationDate: application.applicationDate ? new Date(application.applicationDate).toISOString().split('T')[0] : "",
      annualPremium: application.annualPremium?.toString() || "0",
      coverageAmount: application.coverageAmount?.toString() || "0",
      beneficiaryName: application.beneficiaryName || "",
      beneficiaryRelation: application.beneficiaryRelation || "",
      medicalExamCompleted: application.medicalExamCompleted || false,
      underwritingNotes: application.underwritingNotes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this application?")) {
      deleteApplicationMutation.mutate(id);
    }
  };

  const filteredApplications = (applications as any[]).filter((application: any) => {
    const matchesSearch = 
      application.beneficiaryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.beneficiaryRelation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.underwritingNotes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || application.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Insurance Applications</h1>
            <p className="text-gray-600">Manage insurance applications and approvals</p>
          </div>
          {canWrite && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary text-white hover:bg-primary/90"
                  onClick={() => {
                    setEditingApplication(null);
                    form.reset();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Application
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingApplication ? "Edit Application" : "Create New Application"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingApplication ? "Update application details" : "Create a new insurance application"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Submitted">Submitted</SelectItem>
                                <SelectItem value="Under_Review">Under Review</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="applicationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Application Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="annualPremium"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual Premium ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="1000.00" {...field} />
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
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="beneficiaryName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Beneficiary Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="beneficiaryRelation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Beneficiary Relation</FormLabel>
                            <FormControl>
                              <Input placeholder="Spouse, Child, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="underwritingNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Underwriting Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Notes about underwriting process..." 
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
                      <Button type="submit" disabled={applicationMutation.isPending}>
                        {applicationMutation.isPending ? "Saving..." : editingApplication ? "Update Application" : "Create Application"}
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
                  placeholder="Search applications..."
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
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Under_Review">Under Review</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Applications ({filteredApplications.length})</CardTitle>
            <CardDescription>
              Manage insurance applications and track their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading applications...</div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || selectedStatus !== "all" ? "No applications match your filters" : "No applications found"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application</TableHead>
                      <TableHead>Beneficiary</TableHead>
                      <TableHead>Coverage</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      {(canWrite || canDelete) && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application: any) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">
                                Application #{application.id}
                              </div>
                              <div className="text-sm text-gray-500">Quote #{application.quoteId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{application.beneficiaryName}</div>
                            <div className="text-sm text-gray-500">{application.beneficiaryRelation}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            ${application.coverageAmount?.toLocaleString() || '0'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            ${application.annualPremium?.toLocaleString() || '0'}/year
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[application.status as keyof typeof statusColors] || statusColors.Draft}>
                            {application.status?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {application.applicationDate ? format(new Date(application.applicationDate), 'MMM dd, yyyy') : 'N/A'}
                          </div>
                        </TableCell>
                        {(canWrite || canDelete) && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {canWrite && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(application)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(application.id)}
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
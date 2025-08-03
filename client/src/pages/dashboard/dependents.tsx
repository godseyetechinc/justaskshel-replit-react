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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDependentSchema } from "@shared/schema";
import { z } from "zod";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Calendar,
  User,
  Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { format, differenceInYears } from "date-fns";

const dependentFormSchema = insertDependentSchema.omit({
  id: true,
  createdAt: true,
});

const relationshipColors = {
  Spouse: "bg-pink-100 text-pink-800",
  Child: "bg-blue-100 text-blue-800",
  Parent: "bg-green-100 text-green-800",
  Sibling: "bg-purple-100 text-purple-800",
  Other: "bg-gray-100 text-gray-800"
};

export default function DependentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRelationship, setSelectedRelationship] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDependent, setEditingDependent] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = useRoleAuth();
  const queryClient = useQueryClient();

  // Check permissions
  const canWrite = hasPermission("write");
  const canDelete = hasPermission("delete");

  // Fetch dependents
  const { data: dependents = [], isLoading } = useQuery({
    queryKey: ["/api/dependents"],
  });

  // Create/Update dependent mutation
  const dependentMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingDependent) {
        return apiRequest(`/api/dependents/${editingDependent.id}`, "PUT", data);
      } else {
        return apiRequest("/api/dependents", "POST", data);
      }
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: `Dependent ${editingDependent ? 'updated' : 'added'} successfully` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dependents"] });
      setIsDialogOpen(false);
      setEditingDependent(null);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: `Failed to ${editingDependent ? 'update' : 'add'} dependent`, 
        variant: "destructive" 
      });
    },
  });

  // Delete dependent mutation
  const deleteDependentMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/dependents/${id}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "Success", description: "Dependent removed successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/dependents"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove dependent", variant: "destructive" });
    },
  });

  const form = useForm({
    resolver: zodResolver(dependentFormSchema),
    defaultValues: {
      userId: user?.id || "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      relationship: "Child",
      ssn: "",
      isActive: true,
    },
  });

  const onSubmit = (data: any) => {
    dependentMutation.mutate({
      ...data,
      dateOfBirth: new Date(data.dateOfBirth).toISOString(),
    });
  };

  const handleEdit = (dependent: any) => {
    setEditingDependent(dependent);
    form.reset({
      userId: dependent.userId || "",
      firstName: dependent.firstName || "",
      lastName: dependent.lastName || "",
      dateOfBirth: dependent.dateOfBirth ? new Date(dependent.dateOfBirth).toISOString().split('T')[0] : "",
      relationship: dependent.relationship || "Child",
      ssn: dependent.ssn || "",
      isActive: dependent.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to remove this dependent?")) {
      deleteDependentMutation.mutate(id);
    }
  };

  const filteredDependents = dependents.filter((dependent: any) => {
    const matchesSearch = 
      dependent.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dependent.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRelationship = selectedRelationship === "all" || dependent.relationship === selectedRelationship;
    
    return matchesSearch && matchesRelationship;
  });

  const getAge = (dateOfBirth: string) => {
    return differenceInYears(new Date(), new Date(dateOfBirth));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dependents</h1>
            <p className="text-gray-600">Manage family members and dependents for insurance coverage</p>
          </div>
          {canWrite && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary text-white hover:bg-primary/90"
                  onClick={() => {
                    setEditingDependent(null);
                    form.reset();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Dependent
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingDependent ? "Edit Dependent" : "Add New Dependent"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingDependent ? "Update dependent information" : "Add a family member as a dependent"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="relationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Spouse">Spouse</SelectItem>
                              <SelectItem value="Child">Child</SelectItem>
                              <SelectItem value="Parent">Parent</SelectItem>
                              <SelectItem value="Sibling">Sibling</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ssn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SSN (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="XXX-XX-XXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={dependentMutation.isPending}>
                        {dependentMutation.isPending ? "Saving..." : editingDependent ? "Update Dependent" : "Add Dependent"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dependents</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dependents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Children</CardTitle>
              <User className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {dependents.filter((d: any) => d.relationship === "Child").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spouses</CardTitle>
              <Heart className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600">
                {dependents.filter((d: any) => d.relationship === "Spouse").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dependents.filter((d: any) => d.isActive).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search dependents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedRelationship} onValueChange={setSelectedRelationship}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Relationships</SelectItem>
                  <SelectItem value="Spouse">Spouse</SelectItem>
                  <SelectItem value="Child">Child</SelectItem>
                  <SelectItem value="Parent">Parent</SelectItem>
                  <SelectItem value="Sibling">Sibling</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Dependents Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Dependents ({filteredDependents.length})</CardTitle>
            <CardDescription>
              Manage family members and dependents for insurance coverage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading dependents...</div>
            ) : filteredDependents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No dependents found</h3>
                <p className="text-sm">
                  {searchTerm || selectedRelationship !== "all" ? "No dependents match your filters" : "Add family members as dependents to get started"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Date of Birth</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added</TableHead>
                      {(canWrite || canDelete) && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDependents.map((dependent: any) => (
                      <TableRow key={dependent.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {dependent.firstName} {dependent.lastName}
                              </div>
                              {dependent.ssn && (
                                <div className="text-sm text-gray-500">
                                  SSN: ***-**-{dependent.ssn.slice(-4)}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {getAge(dependent.dateOfBirth)} years old
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={relationshipColors[dependent.relationship as keyof typeof relationshipColors] || relationshipColors.Other}>
                            {dependent.relationship}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {format(new Date(dependent.dateOfBirth), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={dependent.isActive ? "default" : "secondary"}>
                            {dependent.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {format(new Date(dependent.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        {(canWrite || canDelete) && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {canWrite && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(dependent)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(dependent.id)}
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
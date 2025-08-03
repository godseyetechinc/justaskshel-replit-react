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
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRewardSchema } from "@shared/schema";
import { z } from "zod";
import { 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Gift,
  DollarSign,
  Tag,
  Calendar,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { format } from "date-fns";

const rewardFormSchema = insertRewardSchema.extend({
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});

export default function RewardsManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<any>(null);
  const { toast } = useToast();
  const { hasPermission } = useRoleAuth();
  const queryClient = useQueryClient();

  // Check permissions
  const canWrite = hasPermission("write");
  const isAdmin = hasPermission("manage_system");

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access rewards management.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Fetch rewards
  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ["/api/rewards/all"],
  });

  // Create/update reward mutation
  const rewardMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingReward) {
        return apiRequest(`/api/rewards/${editingReward.id}`, "PUT", data);
      } else {
        return apiRequest("/api/rewards", "POST", data);
      }
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: editingReward ? "Reward updated successfully" : "Reward created successfully" 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      setIsDialogOpen(false);
      setEditingReward(null);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to save reward", 
        variant: "destructive" 
      });
    },
  });

  // Delete reward mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/rewards/${id}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "Success", description: "Reward deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete reward", variant: "destructive" });
    },
  });

  // Form initialization
  const form = useForm<z.infer<typeof rewardFormSchema>>({
    resolver: zodResolver(rewardFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "Discount",
      pointsCost: 0,
      value: "0",
      imageUrl: "",
      availableQuantity: null,
      isActive: true,
      validFrom: "",
      validUntil: "",
      terms: "",
    },
  });

  // Submit handler
  const onSubmit = (data: z.infer<typeof rewardFormSchema>) => {
    const formattedData = {
      ...data,
      validFrom: data.validFrom ? new Date(data.validFrom).toISOString() : null,
      validUntil: data.validUntil ? new Date(data.validUntil).toISOString() : null,
    };
    rewardMutation.mutate(formattedData);
  };

  // Open edit dialog
  const handleEdit = (reward: any) => {
    setEditingReward(reward);
    form.reset({
      name: reward.name,
      description: reward.description || "",
      category: reward.category,
      pointsCost: reward.pointsCost,
      value: reward.value || "0",
      imageUrl: reward.imageUrl || "",
      availableQuantity: reward.availableQuantity,
      isActive: reward.isActive,
      validFrom: reward.validFrom ? format(new Date(reward.validFrom), "yyyy-MM-dd") : "",
      validUntil: reward.validUntil ? format(new Date(reward.validUntil), "yyyy-MM-dd") : "",
      terms: reward.terms || "",
    });
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this reward?")) {
      deleteMutation.mutate(id);
    }
  };

  // Filter rewards
  const filteredRewards = rewards.filter((reward: any) => {
    const matchesSearch = !searchTerm || 
      reward.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reward.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || reward.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return <DashboardLayout><div className="p-6">Loading...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rewards Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage the rewards catalog for points redemption</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingReward(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Reward
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingReward ? "Edit Reward" : "Add New Reward"}</DialogTitle>
                <DialogDescription>
                  {editingReward ? "Update the reward details" : "Create a new reward for points redemption"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reward Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., $10 Gift Card" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Discount">Discount</SelectItem>
                              <SelectItem value="Gift Card">Gift Card</SelectItem>
                              <SelectItem value="Premium Service">Premium Service</SelectItem>
                              <SelectItem value="Insurance Credit">Insurance Credit</SelectItem>
                              <SelectItem value="Merchandise">Merchandise</SelectItem>
                              <SelectItem value="Experience">Experience</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe this reward..." 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="pointsCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points Cost</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="1000"
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dollar Value</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="10.00"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="availableQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Leave empty for unlimited"
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="validFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valid From (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valid Until (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Terms & Conditions (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Terms and conditions for this reward..." 
                            className="min-h-[60px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Active Status</FormLabel>
                          <FormDescription>
                            Enable this reward for user redemption
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={rewardMutation.isPending}>
                      {rewardMutation.isPending ? "Saving..." : editingReward ? "Update Reward" : "Create Reward"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search rewards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Discount">Discount</SelectItem>
              <SelectItem value="Gift Card">Gift Card</SelectItem>
              <SelectItem value="Premium Service">Premium Service</SelectItem>
              <SelectItem value="Insurance Credit">Insurance Credit</SelectItem>
              <SelectItem value="Merchandise">Merchandise</SelectItem>
              <SelectItem value="Experience">Experience</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rewards Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Points Cost</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRewards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No rewards found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRewards.map((reward: any) => (
                  <TableRow key={reward.id}>
                    <TableCell className="font-medium">{reward.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{reward.category}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {reward.pointsCost.toLocaleString()} pts
                    </TableCell>
                    <TableCell>
                      {reward.value ? `$${parseFloat(reward.value).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      {reward.availableQuantity ? reward.availableQuantity.toLocaleString() : "Unlimited"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {reward.isActive ? (
                          <>
                            <Eye className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-400">Inactive</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reward.validUntil ? format(new Date(reward.validUntil), "MMM dd, yyyy") : "No expiry"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(reward)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(reward.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
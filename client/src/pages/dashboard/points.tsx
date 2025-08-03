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
import { insertPointsSchema } from "@shared/schema";
import { z } from "zod";
import { 
  Plus, 
  Search, 
  Star, 
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { format } from "date-fns";

const pointsFormSchema = insertPointsSchema.omit({
  id: true,
  createdAt: true,
});

const typeColors = {
  Earned: "bg-green-100 text-green-800",
  Redeemed: "bg-red-100 text-red-800",
  Bonus: "bg-blue-100 text-blue-800",
  Referral: "bg-purple-100 text-purple-800",
  Penalty: "bg-orange-100 text-orange-800"
};

export default function PointsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = useRoleAuth();
  const queryClient = useQueryClient();

  // Check permissions
  const canWrite = hasPermission("write");

  // Fetch points
  const { data: pointsHistory = [], isLoading } = useQuery({
    queryKey: ["/api/points"],
  });

  // Create points entry mutation
  const pointsMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("/api/points", "POST", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Points entry created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create points entry", variant: "destructive" });
    },
  });

  const form = useForm({
    resolver: zodResolver(pointsFormSchema),
    defaultValues: {
      userId: user?.id || "",
      memberId: 0,
      points: 0,
      type: "Earned",
      description: "",
      expirationDate: "",
    },
  });

  const onSubmit = (data: any) => {
    pointsMutation.mutate({
      ...data,
      expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString() : null,
    });
  };

  const filteredPoints = pointsHistory.filter((point: any) => {
    const matchesSearch = 
      point.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === "all" || point.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Calculate totals
  const totalPoints = pointsHistory.reduce((sum: number, point: any) => {
    return sum + (point.type === "Redeemed" || point.type === "Penalty" ? -point.points : point.points);
  }, 0);

  const earnedPoints = pointsHistory
    .filter((p: any) => ["Earned", "Bonus", "Referral"].includes(p.type))
    .reduce((sum: number, point: any) => sum + point.points, 0);

  const redeemedPoints = pointsHistory
    .filter((p: any) => ["Redeemed", "Penalty"].includes(p.type))
    .reduce((sum: number, point: any) => sum + point.points, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Loyalty Points</h1>
            <p className="text-gray-600">Track and manage customer loyalty points</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{totalPoints.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            {canWrite && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-primary text-white hover:bg-primary/90"
                    onClick={() => form.reset()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Points
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Points Entry</DialogTitle>
                    <DialogDescription>
                      Create a new points transaction
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="memberId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Member ID</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="points"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Points</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Earned">Earned</SelectItem>
                                  <SelectItem value="Redeemed">Redeemed</SelectItem>
                                  <SelectItem value="Bonus">Bonus</SelectItem>
                                  <SelectItem value="Referral">Referral</SelectItem>
                                  <SelectItem value="Penalty">Penalty</SelectItem>
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
                                placeholder="Reason for points transaction..." 
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
                        name="expirationDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiration Date (Optional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={pointsMutation.isPending}>
                          {pointsMutation.isPending ? "Adding..." : "Add Points"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPoints.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Available points</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{earnedPoints.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Redeemed</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{redeemedPoints.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total redeemed</p>
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
                  placeholder="Search points history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Earned">Earned</SelectItem>
                  <SelectItem value="Redeemed">Redeemed</SelectItem>
                  <SelectItem value="Bonus">Bonus</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Penalty">Penalty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Points History */}
        <Card>
          <CardHeader>
            <CardTitle>Points History ({filteredPoints.length})</CardTitle>
            <CardDescription>
              Track all points transactions and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading points history...</div>
            ) : filteredPoints.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Star className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No points history</h3>
                <p className="text-sm">
                  {searchTerm || selectedType !== "all" ? "No points match your filters" : "Start earning points to see your history"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Expiration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPoints.map((point: any) => (
                      <TableRow key={point.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Star className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {point.description || `${point.type} Points`}
                              </div>
                              <div className="text-sm text-gray-500">ID: {point.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            Member #{point.memberId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`font-bold ${
                            point.type === "Redeemed" || point.type === "Penalty" 
                              ? "text-red-600" 
                              : "text-green-600"
                          }`}>
                            {point.type === "Redeemed" || point.type === "Penalty" ? "-" : "+"}
                            {point.points.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={typeColors[point.type as keyof typeof typeColors] || typeColors.Earned}>
                            {point.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(point.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {point.expirationDate ? (
                            <div className="text-sm text-gray-500">
                              {format(new Date(point.expirationDate), 'MMM dd, yyyy')}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No expiration</span>
                          )}
                        </TableCell>
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
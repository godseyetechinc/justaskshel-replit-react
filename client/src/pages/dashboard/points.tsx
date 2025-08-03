import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  Search, 
  Star, 
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  User,
  Gift,
  Trophy,
  Target,
  History,
  Coins,
  ShoppingCart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { format } from "date-fns";

// Schema for awarding points (admin only)
const awardPointsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  points: z.number().min(1, "Points must be positive"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
});

const typeColors = {
  Earned: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Redeemed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Expired: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  Adjustment: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Bonus: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Referral: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
};

const tierColors = {
  Bronze: "text-amber-600",
  Silver: "text-gray-500", 
  Gold: "text-yellow-500",
  Platinum: "text-indigo-500",
  Diamond: "text-purple-500"
};

const tierIcons = {
  Bronze: Trophy,
  Silver: Trophy,
  Gold: Trophy,
  Platinum: Trophy,
  Diamond: Trophy
};

export default function PointsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = useRoleAuth();
  const queryClient = useQueryClient();

  // Check permissions
  const canWrite = hasPermission("write");
  const isAdmin = hasPermission("manage_system");

  // Fetch points summary
  const { data: pointsSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ["/api/points/summary"],
  });

  // Fetch points transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/points/transactions"],
  });

  // Fetch rewards
  const { data: rewards = [], isLoading: rewardsLoading } = useQuery({
    queryKey: ["/api/rewards"],
  });

  // Fetch user redemptions
  const { data: redemptions = [], isLoading: redemptionsLoading } = useQuery({
    queryKey: ["/api/redemptions"],
  });

  // Award points mutation (admin only)
  const awardPointsMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("/api/points/award", "POST", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Points awarded successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/points/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points/transactions"] });
      setIsAwardDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to award points", variant: "destructive" });
    },
  });

  // Redeem reward mutation
  const redeemMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("/api/redemptions", "POST", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Reward redeemed successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/points/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/redemptions"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to redeem reward", 
        variant: "destructive" 
      });
    },
  });

  // Form for awarding points (admin only)
  const awardForm = useForm<z.infer<typeof awardPointsSchema>>({
    resolver: zodResolver(awardPointsSchema),
    defaultValues: {
      userId: "",
      points: 0,
      category: "",
      description: "",
      referenceId: "",
      referenceType: "",
    },
  });

  // Submit handler for awarding points
  const onAwardSubmit = (data: z.infer<typeof awardPointsSchema>) => {
    awardPointsMutation.mutate(data);
  };

  // Handle reward redemption
  const handleRedeemReward = (rewardId: number) => {
    redeemMutation.mutate({ rewardId });
  };

  // Filter transactions based on search and type
  const filteredTransactions = transactions.filter((transaction: any) => {
    const matchesSearch = !searchTerm || 
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === "all" || transaction.transactionType === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Get tier icon
  const TierIcon = pointsSummary ? tierIcons[pointsSummary.tierLevel as keyof typeof tierIcons] : Trophy;

  if (summaryLoading || transactionsLoading) {
    return <DashboardLayout><div className="p-6">Loading...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Points & Rewards</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your loyalty points and redeem rewards</p>
          </div>
          {isAdmin && (
            <Dialog open={isAwardDialogOpen} onOpenChange={setIsAwardDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Award Points
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Award Points</DialogTitle>
                  <DialogDescription>
                    Award points to a user
                  </DialogDescription>
                </DialogHeader>
                <Form {...awardForm}>
                  <form onSubmit={awardForm.handleSubmit(onAwardSubmit)} className="space-y-4">
                    <FormField
                      control={awardForm.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User ID</FormLabel>
                          <FormControl>
                            <Input placeholder="User ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={awardForm.control}
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
                        control={awardForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Policy Purchase">Policy Purchase</SelectItem>
                                <SelectItem value="Claim Submission">Claim Submission</SelectItem>
                                <SelectItem value="Referral">Referral</SelectItem>
                                <SelectItem value="Login">Login</SelectItem>
                                <SelectItem value="Profile Complete">Profile Complete</SelectItem>
                                <SelectItem value="Newsletter">Newsletter</SelectItem>
                                <SelectItem value="Review">Review</SelectItem>
                                <SelectItem value="Survey">Survey</SelectItem>
                                <SelectItem value="Birthday">Birthday</SelectItem>
                                <SelectItem value="Anniversary">Anniversary</SelectItem>
                                <SelectItem value="Bonus">Bonus</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={awardForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Reason for awarding points..." 
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsAwardDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={awardPointsMutation.isPending}>
                        {awardPointsMutation.isPending ? "Awarding..." : "Award Points"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Points Summary Card */}
        {pointsSummary && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    Points Summary
                  </CardTitle>
                  <CardDescription>Your current points status and tier level</CardDescription>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-primary">
                    <TierIcon className={`h-6 w-6 ${tierColors[pointsSummary.tierLevel as keyof typeof tierColors]}`} />
                    <span className={`text-lg font-semibold ${tierColors[pointsSummary.tierLevel as keyof typeof tierColors]}`}>
                      {pointsSummary.tierLevel}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-primary">{pointsSummary.currentBalance?.toLocaleString() || 0}</div>
                  <div className="text-sm text-muted-foreground">Current Balance</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">{pointsSummary.totalEarned?.toLocaleString() || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Earned</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">{pointsSummary.totalRedeemed?.toLocaleString() || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Redeemed</div>
                </div>
              </div>
              
              {/* Tier Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to next tier</span>
                  <span>{pointsSummary.tierProgress || 0} / {pointsSummary.nextTierThreshold || 0}</span>
                </div>
                <Progress 
                  value={((pointsSummary.tierProgress || 0) / (pointsSummary.nextTierThreshold || 1)) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for different sections */}
        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="redemptions" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              My Redemptions
            </TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Earned">Earned</SelectItem>
                  <SelectItem value="Redeemed">Redeemed</SelectItem>
                  <SelectItem value="Bonus">Bonus</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Adjustment">Adjustment</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Balance After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge className={typeColors[transaction.transactionType as keyof typeof typeColors]}>
                            {transaction.transactionType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{transaction.category}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className={`text-right font-semibold ${
                          transaction.points > 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {transaction.points > 0 ? "+" : ""}{transaction.points.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">{transaction.balanceAfter?.toLocaleString() || 0}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewardsLoading ? (
                <div className="col-span-full text-center py-8">Loading rewards...</div>
              ) : rewards.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No rewards available
                </div>
              ) : (
                rewards.map((reward: any) => (
                  <Card key={reward.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{reward.name}</CardTitle>
                          <CardDescription className="mt-1">{reward.description}</CardDescription>
                        </div>
                        <Badge variant="secondary">{reward.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary font-semibold">
                          <Coins className="h-4 w-4" />
                          {reward.pointsCost.toLocaleString()} points
                        </div>
                        {reward.value && (
                          <div className="text-sm text-muted-foreground">
                            Value: ${reward.value}
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={() => handleRedeemReward(reward.id)}
                        disabled={
                          !pointsSummary || 
                          pointsSummary.currentBalance < reward.pointsCost || 
                          redeemMutation.isPending
                        }
                        className="w-full"
                      >
                        {redeemMutation.isPending ? "Redeeming..." : "Redeem"}
                      </Button>
                      {pointsSummary && pointsSummary.currentBalance < reward.pointsCost && (
                        <p className="text-xs text-red-600 text-center">
                          Need {(reward.pointsCost - pointsSummary.currentBalance).toLocaleString()} more points
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Redemptions Tab */}
          <TabsContent value="redemptions" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Points Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptionsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">Loading redemptions...</TableCell>
                    </TableRow>
                  ) : redemptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No redemptions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    redemptions.map((redemption: any) => (
                      <TableRow key={redemption.id}>
                        <TableCell>
                          {format(new Date(redemption.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {redemption.reward?.name || "Unknown Reward"}
                        </TableCell>
                        <TableCell>{redemption.pointsUsed.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={
                            redemption.status === "Delivered" ? "default" :
                            redemption.status === "Pending" ? "secondary" :
                            redemption.status === "Cancelled" ? "destructive" : "outline"
                          }>
                            {redemption.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {redemption.redemptionCode || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
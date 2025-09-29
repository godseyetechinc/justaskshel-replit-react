import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  Heart, 
  Star, 
  Gift,
  ShoppingCart,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  X,
  Plus,
  Minus,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  Target,
  Crown,
  Calculator,
  Calendar,
  Coins
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, addDays } from "date-fns";

interface Reward {
  id: number;
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  imageUrl?: string;
  popularity: number;
  availableQuantity: number;
  estimatedDelivery: string;
  discountPercentage?: number;
  originalPrice?: number;
}

interface RewardRecommendation {
  id: string;
  rewardId: number;
  userId: string;
  score: number;
  reasoning: string;
  createdAt: string;
  reward: Reward;
  interactionType: 'view' | 'like' | 'redeem' | 'wishlist';
}

interface WishlistItem {
  id: string;
  rewardId: number;
  userId: string;
  priority: 'low' | 'medium' | 'high';
  targetDate?: string;
  notificationsEnabled: boolean;
  createdAt: string;
  reward: Reward;
  pointsNeeded: number;
}

interface PartialRedemption {
  id: string;
  rewardId: number;
  userId: string;
  targetPointsCost: number;
  currentPoints: number;
  remainingPoints: number;
  status: 'active' | 'completed' | 'expired';
  expiresAt: string;
  createdAt: string;
  reward: Reward;
}

interface UserProfile {
  totalPoints: number;
  currentTier: string;
  preferences: {
    categories: string[];
    priceRange: [number, number];
    deliveryPreference: string;
  };
  recentActivity: string[];
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

export default function AdvancedRedemptionsPage() {
  const [activeTab, setActiveTab] = useState("recommendations");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const { toast } = useToast();

  // Fetch user profile for personalization
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ['/api/users/profile/preferences']
  });

  // Fetch AI recommendations
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery<RewardRecommendation[]>({
    queryKey: ['/api/rewards/recommendations', selectedCategory, priceRange],
    enabled: activeTab === "recommendations"
  });

  // Fetch wishlist items
  const { data: wishlistItems, isLoading: wishlistLoading } = useQuery<WishlistItem[]>({
    queryKey: ['/api/rewards/wishlist'],
    enabled: activeTab === "wishlist"
  });

  // Fetch partial redemptions
  const { data: partialRedemptions, isLoading: partialLoading } = useQuery<PartialRedemption[]>({
    queryKey: ['/api/rewards/partial-redemptions'],
    enabled: activeTab === "partial"
  });

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: (data: { rewardId: number; priority: string; targetDate?: string; notificationsEnabled: boolean }) =>
      apiRequest('/api/rewards/wishlist', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/wishlist'] });
      toast({ description: "Added to wishlist successfully!" });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Failed to add to wishlist. Please try again." 
      });
    }
  });

  // Start partial redemption mutation
  const startPartialRedemptionMutation = useMutation({
    mutationFn: (data: { rewardId: number; partialPoints: number }) =>
      apiRequest('/api/rewards/partial-redemptions', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/partial-redemptions'] });
      toast({ description: "Partial redemption started successfully!" });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Failed to start partial redemption. Please try again." 
      });
    }
  });

  // Update wishlist priority mutation
  const updateWishlistMutation = useMutation({
    mutationFn: (data: { id: string; priority?: string; notificationsEnabled?: boolean }) =>
      apiRequest(`/api/rewards/wishlist/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/wishlist'] });
      toast({ description: "Wishlist updated successfully!" });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Failed to update wishlist. Please try again." 
      });
    }
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/rewards/wishlist/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/wishlist'] });
      toast({ description: "Removed from wishlist successfully!" });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Failed to remove from wishlist. Please try again." 
      });
    }
  });

  const handleAddToWishlist = (rewardId: number, priority: string = 'medium') => {
    addToWishlistMutation.mutate({
      rewardId,
      priority,
      notificationsEnabled: true
    });
  };

  const handleStartPartialRedemption = (rewardId: number, partialPoints: number) => {
    startPartialRedemptionMutation.mutate({
      rewardId,
      partialPoints
    });
  };

  const handleUpdatePriority = (id: string, priority: string) => {
    updateWishlistMutation.mutate({ id, priority });
  };

  const calculateAffordability = (pointsCost: number, userPoints: number) => {
    if (userPoints >= pointsCost) return 100;
    return Math.round((userPoints / pointsCost) * 100);
  };

  const formatPointsShortage = (needed: number, available: number) => {
    const shortage = needed - available;
    if (shortage <= 0) return "Fully affordable";
    return `Need ${shortage.toLocaleString()} more points`;
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Advanced Redemptions</h2>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              {userProfile?.totalPoints?.toLocaleString() || 0} points
            </Badge>
            <Badge variant="secondary">
              {userProfile?.currentTier || 'Bronze'} Tier
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommendations" data-testid="tab-recommendations">
              <Brain className="h-4 w-4 mr-2" />
              AI Recommendations
            </TabsTrigger>
            <TabsTrigger value="wishlist" data-testid="tab-wishlist">
              <Heart className="h-4 w-4 mr-2" />
              My Wishlist
            </TabsTrigger>
            <TabsTrigger value="partial" data-testid="tab-partial">
              <Calculator className="h-4 w-4 mr-2" />
              Partial Redemptions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="flex gap-4 items-center">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]" data-testid="select-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="gift-cards">Gift Cards</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="wellness">Wellness</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-[180px]" data-testid="select-price-range">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="0-1000">0 - 1,000 points</SelectItem>
                  <SelectItem value="1000-5000">1,000 - 5,000 points</SelectItem>
                  <SelectItem value="5000-10000">5,000 - 10,000 points</SelectItem>
                  <SelectItem value="10000+">10,000+ points</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendationsLoading ? (
                [...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                  </Card>
                ))
              ) : recommendations && recommendations.length > 0 ? (
                recommendations.map((recommendation) => {
                  const affordability = calculateAffordability(
                    recommendation.reward.pointsCost,
                    userProfile?.totalPoints || 0
                  );
                  
                  return (
                    <Card key={recommendation.id} className="relative overflow-hidden" data-testid={`recommendation-${recommendation.id}`}>
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-purple-500 text-white flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          AI Pick
                        </Badge>
                      </div>
                      
                      <div className="h-40 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 relative">
                        {recommendation.reward.imageUrl && (
                          <img 
                            src={recommendation.reward.imageUrl} 
                            alt={recommendation.reward.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute bottom-2 right-2">
                          <Badge variant="secondary" className="bg-white/90 dark:bg-black/90">
                            {recommendation.reward.pointsCost.toLocaleString()} pts
                          </Badge>
                        </div>
                      </div>
                      
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{recommendation.reward.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {recommendation.reward.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Affordability</span>
                            <span className={affordability === 100 ? "text-green-600" : "text-orange-600"}>
                              {affordability}%
                            </span>
                          </div>
                          <Progress value={affordability} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {formatPointsShortage(recommendation.reward.pointsCost, userProfile?.totalPoints || 0)}
                          </p>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                          <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">
                            Why we recommend this:
                          </p>
                          <p className="text-xs text-purple-700 dark:text-purple-300">
                            {recommendation.reasoning}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            disabled={affordability < 100}
                            data-testid={`button-redeem-${recommendation.id}`}
                          >
                            <Gift className="h-4 w-4 mr-1" />
                            {affordability === 100 ? "Redeem Now" : "Not Enough Points"}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAddToWishlist(recommendation.reward.id)}
                            data-testid={`button-wishlist-${recommendation.id}`}
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>

                        {affordability < 100 && affordability >= 50 && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full"
                            onClick={() => handleStartPartialRedemption(
                              recommendation.reward.id,
                              userProfile?.totalPoints || 0
                            )}
                            data-testid={`button-partial-${recommendation.id}`}
                          >
                            <Calculator className="h-4 w-4 mr-2" />
                            Start Partial Redemption
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full">
                  <Alert>
                    <Brain className="h-4 w-4" />
                    <AlertDescription>
                      No recommendations available yet. Keep earning points and interacting with rewards to get personalized suggestions!
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="wishlist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  My Wishlist
                </CardTitle>
                <CardDescription>
                  Track and prioritize rewards you want to redeem
                </CardDescription>
              </CardHeader>
              <CardContent>
                {wishlistLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <Skeleton className="h-16 w-16" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : wishlistItems && wishlistItems.length > 0 ? (
                  <div className="space-y-4">
                    {wishlistItems.map((item) => {
                      const progressPercent = ((userProfile?.totalPoints || 0) / item.reward.pointsCost) * 100;
                      
                      return (
                        <div key={item.id} className="border rounded-lg p-4 space-y-3" data-testid={`wishlist-item-${item.id}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center">
                                <Gift className="h-8 w-8 text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{item.reward.name}</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {item.reward.description}
                                </p>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className={getPriorityColor(item.priority)}>
                                    {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
                                  </Badge>
                                  <Badge variant="outline">
                                    {item.reward.pointsCost.toLocaleString()} points
                                  </Badge>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span>Progress to goal</span>
                                    <span>{Math.min(100, Math.round(progressPercent))}%</span>
                                  </div>
                                  <Progress value={Math.min(100, progressPercent)} className="h-2" />
                                  <p className="text-xs text-muted-foreground">
                                    {item.pointsNeeded > 0 
                                      ? `${item.pointsNeeded.toLocaleString()} points needed`
                                      : "Ready to redeem!"
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Select
                                value={item.priority}
                                onValueChange={(value) => handleUpdatePriority(item.id, value)}
                              >
                                <SelectTrigger className="w-[120px]" data-testid={`select-priority-${item.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromWishlistMutation.mutate(item.id)}
                                data-testid={`button-remove-${item.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {item.pointsNeeded <= 0 ? (
                              <Button size="sm" className="flex-1" data-testid={`button-redeem-wishlist-${item.id}`}>
                                <Gift className="h-4 w-4 mr-2" />
                                Redeem Now
                              </Button>
                            ) : progressPercent >= 50 ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleStartPartialRedemption(
                                  item.reward.id,
                                  userProfile?.totalPoints || 0
                                )}
                                data-testid={`button-partial-wishlist-${item.id}`}
                              >
                                <Calculator className="h-4 w-4 mr-2" />
                                Start Partial Redemption
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" disabled>
                                <Clock className="h-4 w-4 mr-2" />
                                Keep Earning Points
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Alert>
                    <Heart className="h-4 w-4" />
                    <AlertDescription>
                      Your wishlist is empty. Browse our recommendations to find rewards you'd like to save for!
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-500" />
                  Partial Redemptions
                </CardTitle>
                <CardDescription>
                  Start redeeming rewards with your current points and complete when you earn more
                </CardDescription>
              </CardHeader>
              <CardContent>
                {partialLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : partialRedemptions && partialRedemptions.length > 0 ? (
                  <div className="space-y-4">
                    {partialRedemptions.map((partial) => {
                      const progressPercent = (partial.currentPoints / partial.targetPointsCost) * 100;
                      
                      return (
                        <div key={partial.id} className="border rounded-lg p-4 space-y-3" data-testid={`partial-redemption-${partial.id}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center">
                                <Calculator className="h-6 w-6 text-blue-500" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{partial.reward.name}</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {partial.reward.description}
                                </p>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className={getStatusColor(partial.status)}>
                                    {partial.status.charAt(0).toUpperCase() + partial.status.slice(1)}
                                  </Badge>
                                  <Badge variant="outline">
                                    {partial.currentPoints.toLocaleString()} / {partial.targetPointsCost.toLocaleString()} points
                                  </Badge>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span>Redemption progress</span>
                                    <span>{Math.round(progressPercent)}%</span>
                                  </div>
                                  <Progress value={progressPercent} className="h-2" />
                                  <p className="text-xs text-muted-foreground">
                                    {partial.remainingPoints > 0 
                                      ? `${partial.remainingPoints.toLocaleString()} points remaining`
                                      : "Ready to complete!"
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                Expires {format(new Date(partial.expiresAt), 'MMM dd, yyyy')}
                              </p>
                              {partial.status === 'active' && partial.remainingPoints <= (userProfile?.totalPoints || 0) && (
                                <Button size="sm" className="mt-2" data-testid={`button-complete-${partial.id}`}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Complete Redemption
                                </Button>
                              )}
                            </div>
                          </div>

                          {partial.status === 'expired' && (
                            <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                This partial redemption has expired. Points have been refunded to your account.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Alert>
                    <Calculator className="h-4 w-4" />
                    <AlertDescription>
                      No partial redemptions yet. When you don't have enough points for a reward, you can start a partial redemption and complete it later!
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  Gift, 
  Star, 
  Clock,
  CheckCircle,
  Zap,
  TrendingUp,
  Users,
  Trophy,
  Target,
  Sparkles,
  Snowflake,
  Sun,
  Leaf,
  Heart,
  Crown,
  Medal,
  Award,
  Timer,
  PlayCircle,
  Pause,
  RotateCcw,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, formatDistanceToNow, addDays, differenceInDays } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'seasonal' | 'milestone' | 'challenge' | 'special';
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'holiday' | 'special';
  startDate: string;
  endDate: string;
  isActive: boolean;
  pointsMultiplier: number;
  maxParticipants?: number;
  currentParticipants: number;
  rewards: CampaignReward[];
  requirements: CampaignRequirement[];
  backgroundImage?: string;
}

interface CampaignReward {
  id: string;
  campaignId: string;
  rewardType: 'points' | 'badge' | 'item' | 'discount';
  name: string;
  description: string;
  value: number;
  requirementThreshold: number;
  imageUrl?: string;
}

interface CampaignRequirement {
  id: string;
  campaignId: string;
  type: 'daily_login' | 'points_earned' | 'activities_completed' | 'referrals' | 'policies_purchased';
  name: string;
  description: string;
  targetValue: number;
  unit: string;
}

interface UserCampaignProgress {
  id: string;
  campaignId: string;
  userId: string;
  enrolledAt: string;
  status: 'enrolled' | 'completed' | 'abandoned';
  currentProgress: CampaignProgressItem[];
  earnedRewards: CampaignReward[];
  totalPointsEarned: number;
  completionPercentage: number;
  campaign: Campaign;
}

interface CampaignProgressItem {
  requirementId: string;
  currentValue: number;
  targetValue: number;
  completedAt?: string;
  requirement: CampaignRequirement;
}

interface CampaignLeaderboard {
  id: string;
  campaignId: string;
  userId: string;
  totalPoints: number;
  completionPercentage: number;
  rank: number;
  user: {
    displayName: string;
    email: string;
    avatar?: string;
    currentTier: string;
  };
}

const getSeasonIcon = (season: string) => {
  switch (season) {
    case 'spring': return <Leaf className="h-5 w-5 text-green-500" />;
    case 'summer': return <Sun className="h-5 w-5 text-yellow-500" />;
    case 'fall': return <Leaf className="h-5 w-5 text-orange-500" />;
    case 'winter': return <Snowflake className="h-5 w-5 text-blue-500" />;
    case 'holiday': return <Gift className="h-5 w-5 text-red-500" />;
    case 'special': return <Sparkles className="h-5 w-5 text-purple-500" />;
    default: return <Calendar className="h-5 w-5 text-gray-500" />;
  }
};

const getSeasonGradient = (season: string) => {
  switch (season) {
    case 'spring': return 'from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20';
    case 'summer': return 'from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20';
    case 'fall': return 'from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20';
    case 'winter': return 'from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20';
    case 'holiday': return 'from-red-100 to-green-100 dark:from-red-900/20 dark:to-green-900/20';
    case 'special': return 'from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20';
    default: return 'from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800';
  }
};

const getCampaignStatusColor = (campaign: Campaign, isEnrolled: boolean) => {
  if (!campaign.isActive) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  if (isEnrolled) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
};

const getRequirementIcon = (type: string) => {
  switch (type) {
    case 'daily_login': return <Calendar className="h-4 w-4" />;
    case 'points_earned': return <Star className="h-4 w-4" />;
    case 'activities_completed': return <Target className="h-4 w-4" />;
    case 'referrals': return <Users className="h-4 w-4" />;
    case 'policies_purchased': return <CheckCircle className="h-4 w-4" />;
    default: return <Trophy className="h-4 w-4" />;
  }
};

export default function SeasonalCampaignsPage() {
  const [activeTab, setActiveTab] = useState("available");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch available campaigns
  const { data: availableCampaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns/available'],
    enabled: activeTab === "available"
  });

  // Fetch user's enrolled campaigns
  const { data: enrolledCampaigns, isLoading: enrolledLoading } = useQuery<UserCampaignProgress[]>({
    queryKey: ['/api/campaigns/enrolled'],
    enabled: activeTab === "enrolled"
  });

  // Fetch campaign leaderboard
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<CampaignLeaderboard[]>({
    queryKey: ['/api/campaigns/leaderboard', selectedCampaign],
    enabled: activeTab === "leaderboard" && !!selectedCampaign
  });

  // Enroll in campaign mutation
  const enrollMutation = useMutation({
    mutationFn: (campaignId: string) =>
      apiRequest(`/api/campaigns/${campaignId}/enroll`, {
        method: 'POST'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({ description: "Successfully enrolled in campaign!" });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Failed to enroll in campaign. Please try again." 
      });
    }
  });

  // Abandon campaign mutation
  const abandonMutation = useMutation({
    mutationFn: (campaignId: string) =>
      apiRequest(`/api/campaigns/${campaignId}/abandon`, {
        method: 'POST'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({ description: "Campaign abandoned successfully." });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Failed to abandon campaign. Please try again." 
      });
    }
  });

  const handleEnrollInCampaign = (campaignId: string) => {
    enrollMutation.mutate(campaignId);
  };

  const handleAbandonCampaign = (campaignId: string) => {
    abandonMutation.mutate(campaignId);
  };

  const calculateDaysRemaining = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  const isEnrolledInCampaign = (campaignId: string) => {
    return enrolledCampaigns?.some(progress => progress.campaignId === campaignId && progress.status === 'enrolled') || false;
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Seasonal Campaigns</h2>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {enrolledCampaigns?.filter(c => c.status === 'enrolled').length || 0} Active
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available" data-testid="tab-available">
              <MapPin className="h-4 w-4 mr-2" />
              Available Campaigns
            </TabsTrigger>
            <TabsTrigger value="enrolled" data-testid="tab-enrolled">
              <PlayCircle className="h-4 w-4 mr-2" />
              My Campaigns
            </TabsTrigger>
            <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaignsLoading ? (
                [...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                  </Card>
                ))
              ) : availableCampaigns && availableCampaigns.length > 0 ? (
                availableCampaigns.map((campaign) => {
                  const daysRemaining = calculateDaysRemaining(campaign.endDate);
                  const isEnrolled = isEnrolledInCampaign(campaign.id);
                  
                  return (
                    <Card key={campaign.id} className="overflow-hidden" data-testid={`campaign-${campaign.id}`}>
                      <div className={`h-32 bg-gradient-to-br ${getSeasonGradient(campaign.season)} relative`}>
                        {campaign.backgroundImage && (
                          <img 
                            src={campaign.backgroundImage} 
                            alt={campaign.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute top-2 left-2">
                          {getSeasonIcon(campaign.season)}
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className={getCampaignStatusColor(campaign, isEnrolled)}>
                            {!campaign.isActive ? 'Ended' : isEnrolled ? 'Enrolled' : 'Available'}
                          </Badge>
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <Badge className="bg-black/70 text-white">
                            {campaign.pointsMultiplier}x Points
                          </Badge>
                        </div>
                      </div>
                      
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {campaign.name}
                          {campaign.type === 'special' && <Crown className="h-4 w-4 text-yellow-500" />}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {campaign.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Timer className="h-4 w-4 text-orange-500" />
                            {daysRemaining > 0 ? `${daysRemaining} days left` : 'Campaign ended'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-blue-500" />
                            {campaign.currentParticipants}
                            {campaign.maxParticipants && ` / ${campaign.maxParticipants}`}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Campaign Requirements:</div>
                          <div className="space-y-1">
                            {campaign.requirements.slice(0, 2).map((req) => (
                              <div key={req.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                {getRequirementIcon(req.type)}
                                <span>{req.name}: {req.targetValue} {req.unit}</span>
                              </div>
                            ))}
                            {campaign.requirements.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{campaign.requirements.length - 2} more requirements
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Rewards Preview:</div>
                          <div className="flex gap-1 flex-wrap">
                            {campaign.rewards.slice(0, 3).map((reward) => (
                              <Badge key={reward.id} variant="outline" className="text-xs">
                                {reward.rewardType === 'points' && <Star className="h-3 w-3 mr-1" />}
                                {reward.rewardType === 'badge' && <Medal className="h-3 w-3 mr-1" />}
                                {reward.rewardType === 'item' && <Gift className="h-3 w-3 mr-1" />}
                                {reward.name}
                              </Badge>
                            ))}
                            {campaign.rewards.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{campaign.rewards.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          {!isEnrolled && campaign.isActive && daysRemaining > 0 ? (
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleEnrollInCampaign(campaign.id)}
                              disabled={enrollMutation.isPending}
                              data-testid={`button-enroll-${campaign.id}`}
                            >
                              <PlayCircle className="h-4 w-4 mr-2" />
                              {campaign.maxParticipants && campaign.currentParticipants >= campaign.maxParticipants 
                                ? 'Full' : 'Join Campaign'}
                            </Button>
                          ) : isEnrolled ? (
                            <Button size="sm" variant="outline" className="flex-1" disabled>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Enrolled
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="flex-1" disabled>
                              <Clock className="h-4 w-4 mr-2" />
                              {!campaign.isActive ? 'Campaign Ended' : 'Not Available'}
                            </Button>
                          )}

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" data-testid={`button-details-${campaign.id}`}>
                                <Zap className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  {getSeasonIcon(campaign.season)}
                                  {campaign.name}
                                </DialogTitle>
                                <DialogDescription>
                                  {campaign.description}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold mb-2">All Requirements:</h4>
                                  <div className="space-y-2">
                                    {campaign.requirements.map((req) => (
                                      <div key={req.id} className="flex items-center gap-3 p-2 border rounded">
                                        {getRequirementIcon(req.type)}
                                        <div className="flex-1">
                                          <div className="font-medium">{req.name}</div>
                                          <div className="text-sm text-muted-foreground">{req.description}</div>
                                        </div>
                                        <Badge variant="outline">
                                          {req.targetValue} {req.unit}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">All Rewards:</h4>
                                  <div className="space-y-2">
                                    {campaign.rewards.map((reward) => (
                                      <div key={reward.id} className="flex items-center gap-3 p-2 border rounded">
                                        {reward.rewardType === 'points' && <Star className="h-4 w-4 text-yellow-500" />}
                                        {reward.rewardType === 'badge' && <Medal className="h-4 w-4 text-blue-500" />}
                                        {reward.rewardType === 'item' && <Gift className="h-4 w-4 text-green-500" />}
                                        <div className="flex-1">
                                          <div className="font-medium">{reward.name}</div>
                                          <div className="text-sm text-muted-foreground">{reward.description}</div>
                                        </div>
                                        <Badge variant="outline">
                                          {reward.value} {reward.rewardType === 'points' ? 'pts' : reward.rewardType}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full">
                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      No campaigns available at the moment. Check back soon for new seasonal challenges!
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="enrolled" className="space-y-4">
            {enrolledLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : enrolledCampaigns && enrolledCampaigns.length > 0 ? (
              <div className="space-y-4">
                {enrolledCampaigns.map((progress) => {
                  const daysRemaining = calculateDaysRemaining(progress.campaign.endDate);
                  
                  return (
                    <Card key={progress.id} data-testid={`enrolled-campaign-${progress.id}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg bg-gradient-to-br ${getSeasonGradient(progress.campaign.season)}`}>
                              {getSeasonIcon(progress.campaign.season)}
                            </div>
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                {progress.campaign.name}
                                <Badge variant="outline" className={getCampaignStatusColor(progress.campaign, true)}>
                                  {progress.status.charAt(0).toUpperCase() + progress.status.slice(1)}
                                </Badge>
                              </CardTitle>
                              <CardDescription>
                                Enrolled {formatDistanceToNow(new Date(progress.enrolledAt))} ago
                              </CardDescription>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {Math.round(progress.completionPercentage)}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {daysRemaining > 0 ? `${daysRemaining} days left` : 'Ended'}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Overall Progress</span>
                            <span className="text-sm text-muted-foreground">
                              {progress.totalPointsEarned.toLocaleString()} bonus points earned
                            </span>
                          </div>
                          <Progress value={progress.completionPercentage} className="h-3" />
                        </div>

                        <div className="space-y-3">
                          <div className="text-sm font-medium">Requirements Progress:</div>
                          {progress.currentProgress.map((reqProgress) => {
                            const progressPercent = Math.min(100, (reqProgress.currentValue / reqProgress.targetValue) * 100);
                            
                            return (
                              <div key={reqProgress.requirementId} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {getRequirementIcon(reqProgress.requirement.type)}
                                    <span className="text-sm">{reqProgress.requirement.name}</span>
                                    {reqProgress.completedAt && (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    )}
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {reqProgress.currentValue} / {reqProgress.targetValue} {reqProgress.requirement.unit}
                                  </span>
                                </div>
                                <Progress value={progressPercent} className="h-2" />
                              </div>
                            );
                          })}
                        </div>

                        {progress.earnedRewards.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Earned Rewards:</div>
                            <div className="flex gap-2 flex-wrap">
                              {progress.earnedRewards.map((reward) => (
                                <Badge key={reward.id} variant="secondary" className="flex items-center gap-1">
                                  {reward.rewardType === 'points' && <Star className="h-3 w-3" />}
                                  {reward.rewardType === 'badge' && <Medal className="h-3 w-3" />}
                                  {reward.rewardType === 'item' && <Gift className="h-3 w-3" />}
                                  {reward.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          {progress.status === 'enrolled' && progress.campaign.isActive && daysRemaining > 0 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAbandonCampaign(progress.campaignId)}
                              disabled={abandonMutation.isPending}
                              data-testid={`button-abandon-${progress.id}`}
                            >
                              <Pause className="h-4 w-4 mr-2" />
                              Abandon Campaign
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCampaign(progress.campaignId);
                              setActiveTab("leaderboard");
                            }}
                            data-testid={`button-leaderboard-${progress.id}`}
                          >
                            <Trophy className="h-4 w-4 mr-2" />
                            View Leaderboard
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Alert>
                <PlayCircle className="h-4 w-4" />
                <AlertDescription>
                  You haven't enrolled in any campaigns yet. Browse available campaigns to start earning bonus points!
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <select 
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedCampaign || ''}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  data-testid="select-campaign-leaderboard"
                >
                  <option value="">Select a campaign to view leaderboard</option>
                  {enrolledCampaigns?.map((progress) => (
                    <option key={progress.campaignId} value={progress.campaignId}>
                      {progress.campaign.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCampaign && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Campaign Leaderboard
                  </CardTitle>
                  <CardDescription>
                    Top performers in this campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {leaderboardLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[100px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : leaderboard && leaderboard.length > 0 ? (
                    <div className="space-y-4">
                      {leaderboard.map((entry, index) => (
                        <div 
                          key={entry.id} 
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20' : 'bg-card'
                          }`}
                          data-testid={`leaderboard-entry-${entry.rank}`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                              index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                              index === 2 ? 'bg-amber-600 text-white' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              <span className="text-sm font-bold">#{entry.rank}</span>
                            </div>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={entry.user.avatar} />
                              <AvatarFallback>{entry.user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium" data-testid={`text-user-${entry.id}`}>
                                {entry.user.displayName}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                  {entry.user.currentTier}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {entry.completionPercentage}% complete
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary" data-testid={`text-points-${entry.id}`}>
                              {entry.totalPoints.toLocaleString()} pts
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Campaign points
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <Trophy className="h-4 w-4" />
                      <AlertDescription>
                        No leaderboard data available for this campaign yet.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
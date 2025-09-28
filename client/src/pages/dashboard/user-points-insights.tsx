import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { 
  TrendingUp, Trophy, Star, Target, Gift, Calendar, 
  Award, RefreshCw, AlertCircle, Zap, Crown
} from 'lucide-react';

interface UserInsights {
  userId: string;
  currentBalance: number;
  lifetimePoints: number;
  tierLevel: string;
  recommendedRewards: RewardRecommendation[];
  pointsEarningRate: number;
  nextTierProgress: {
    current: number;
    required: number;
    percentage: number;
  };
}

interface RewardRecommendation {
  rewardId: number;
  rewardName: string;
  category: string;
  redemptionCount: number;
  pointsUsed: number;
  avgPointsPerRedemption: number;
}

const TIER_COLORS = {
  'Bronze': '#CD7F32',
  'Silver': '#C0C0C0', 
  'Gold': '#FFD700',
  'Platinum': '#E5E4E2',
  'Diamond': '#B9F2FF'
};

const TIER_INFO = {
  'Bronze': { min: 0, icon: '🥉', next: 'Silver', nextMin: 500 },
  'Silver': { min: 500, icon: '🥈', next: 'Gold', nextMin: 1500 },
  'Gold': { min: 1500, icon: '🥇', next: 'Platinum', nextMin: 5000 },
  'Platinum': { min: 5000, icon: '💎', next: 'Diamond', nextMin: 15000 },
  'Diamond': { min: 15000, icon: '💎', next: null, nextMin: null }
};

const UserPointsInsights = () => {
  // Fetch user insights
  const { data: insights, isLoading, error, refetch } = useQuery<UserInsights>({
    queryKey: ['/api/user/insights'],
    enabled: true
  });

  if (error) {
    return (
      <div className="container mx-auto p-6" data-testid="user-insights-error">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load your points insights. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return <UserInsightsSkeleton />;
  }

  if (!insights) {
    return (
      <div className="container mx-auto p-6" data-testid="user-insights-no-data">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No points data found. Start earning points by logging in daily and making purchases!
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentTier = TIER_INFO[insights.tierLevel as keyof typeof TIER_INFO];
  const nextTier = currentTier?.next ? TIER_INFO[currentTier.next as keyof typeof TIER_INFO] : null;

  return (
    <div className="container mx-auto p-6 space-y-8" data-testid="user-points-insights">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
            My Points Insights
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="page-description">
            Track your loyalty progress and discover personalized rewards
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" data-testid="button-refresh">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Current Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card data-testid="card-current-balance">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                <p className="text-3xl font-bold text-blue-600">{insights.currentBalance.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">points available</p>
              </div>
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-lifetime-points">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lifetime Earned</p>
                <p className="text-3xl font-bold text-green-600">{insights.lifetimePoints.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">total points earned</p>
              </div>
              <Star className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-earning-rate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Daily Average</p>
                <p className="text-3xl font-bold text-purple-600">{insights.pointsEarningRate}</p>
                <p className="text-xs text-muted-foreground mt-1">points per day</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress */}
      <Card data-testid="card-tier-progress">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Tier Progress
              </CardTitle>
              <CardDescription>
                Your current tier level and progress to the next tier
              </CardDescription>
            </div>
            <Badge 
              variant="secondary" 
              className="text-lg px-4 py-2"
              style={{ 
                backgroundColor: TIER_COLORS[insights.tierLevel as keyof typeof TIER_COLORS] + '20',
                color: TIER_COLORS[insights.tierLevel as keyof typeof TIER_COLORS]
              }}
              data-testid="badge-current-tier"
            >
              {currentTier?.icon} {insights.tierLevel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Current Points: {insights.lifetimePoints.toLocaleString()}</span>
              {nextTier && (
                <span>Next Tier: {nextTier.min.toLocaleString()} ({currentTier?.next})</span>
              )}
            </div>
            
            {nextTier ? (
              <>
                <Progress 
                  value={insights.nextTierProgress.percentage} 
                  className="h-3"
                  data-testid="progress-next-tier"
                />
                <div className="text-center text-sm text-muted-foreground">
                  {(nextTier.min - insights.lifetimePoints).toLocaleString()} points to reach {currentTier?.next} tier
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-lg font-semibold text-yellow-600">🎉 Maximum Tier Achieved!</div>
                <div className="text-sm text-muted-foreground">You've reached the highest tier level</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights Tabs */}
      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommendations" data-testid="tab-recommendations">
            <Gift className="h-4 w-4 mr-2" />
            Reward Recommendations
          </TabsTrigger>
          <TabsTrigger value="tips" data-testid="tab-tips">
            <Zap className="h-4 w-4 mr-2" />
            Earning Tips
          </TabsTrigger>
        </TabsList>

        {/* Reward Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card data-testid="card-recommended-rewards">
            <CardHeader>
              <CardTitle>Recommended Rewards</CardTitle>
              <CardDescription>
                Popular rewards you can afford with your current balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.recommendedRewards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.recommendedRewards.map((reward, index) => (
                    <div key={reward.rewardId} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors" data-testid={`reward-recommendation-${index}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">{reward.rewardName}</h4>
                          <p className="text-xs text-muted-foreground mb-2">{reward.category}</p>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1">
                              <Trophy className="h-3 w-3" />
                              {reward.avgPointsPerRedemption.toLocaleString()} pts
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {reward.redemptionCount} redeemed
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2">Popular</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No reward recommendations available.</p>
                  <p className="text-sm">Keep earning points to unlock rewards!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Earning Tips Tab */}
        <TabsContent value="tips" className="space-y-6">
          <Card data-testid="card-earning-tips">
            <CardHeader>
              <CardTitle>Ways to Earn More Points</CardTitle>
              <CardDescription>
                Maximize your points earning with these tips
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <EarningTip
                  icon={<Calendar className="h-5 w-5" />}
                  title="Daily Login Bonus"
                  description="Earn 10 points every day just by logging in"
                  points={10}
                  frequency="Daily"
                />
                <EarningTip
                  icon={<Trophy className="h-5 w-5" />}
                  title="Policy Purchases"
                  description="Get rewarded for purchasing new insurance policies"
                  points={500}
                  frequency="Per policy"
                />
                <EarningTip
                  icon={<Target className="h-5 w-5" />}
                  title="Claim Submissions"
                  description="Earn points when you submit insurance claims"
                  points={100}
                  frequency="Per claim"
                />
                {insights.pointsEarningRate < 50 && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Pro Tip</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Your current earning rate is {insights.pointsEarningRate} points/day. 
                      Try logging in daily to increase your earning rate!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Earning Tip Component
interface EarningTipProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  points: number;
  frequency: string;
}

const EarningTip = ({ icon, title, description, points, frequency }: EarningTipProps) => (
  <div className="flex items-start gap-4 p-4 border rounded-lg">
    <div className="text-blue-600">{icon}</div>
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-medium">{title}</h4>
        <div className="text-right">
          <div className="text-sm font-semibold text-green-600">+{points} pts</div>
          <div className="text-xs text-muted-foreground">{frequency}</div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

// Loading skeleton component
const UserInsightsSkeleton = () => (
  <div className="container mx-auto p-6 space-y-8" data-testid="user-insights-loading">
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
    
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-40 w-full" />
      </CardContent>
    </Card>
  </div>
);

export default UserPointsInsights;
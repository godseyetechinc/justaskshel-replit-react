import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Trophy, DollarSign, Award, 
  Calendar, RefreshCw, AlertCircle, BarChart3, PieChart as PieChartIcon, TrendingUpIcon
} from 'lucide-react';

// Color palettes for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const TIER_COLORS = {
  'Bronze': '#CD7F32',
  'Silver': '#C0C0C0', 
  'Gold': '#FFD700',
  'Platinum': '#E5E4E2',
  'Diamond': '#B9F2FF'
};

interface PointsMetrics {
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  currentBalance: number;
  redemptionRate: number;
}

interface RewardPopularity {
  rewardId: number;
  rewardName: string;
  category: string;
  redemptionCount: number;
  pointsUsed: number;
}

interface TierDistribution {
  tierLevel: string;
  userCount: number;
  percentage: number;
  avgPoints: number;
}

interface PointsTrend {
  date: string;
  pointsEarned: number;
  pointsRedeemed: number;
  netChange: number;
}

interface RedemptionFunnel {
  totalUsers: number;
  usersWithPoints: number;
  usersWhoRedeemed: number;
  conversionRate: number;
}

interface AnalyticsOverview {
  pointsMetrics: PointsMetrics;
  popularRewards: RewardPopularity[];
  tierDistribution: TierDistribution[];
  redemptionFunnel: RedemptionFunnel;
}

const PointsAnalyticsDashboard = () => {
  const [selectedDays, setSelectedDays] = useState('30');
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch analytics overview
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery<AnalyticsOverview>({
    queryKey: ['/api/admin/analytics/overview', refreshKey],
    enabled: true
  });

  // Fetch points trends
  const { data: trends, isLoading: trendsLoading } = useQuery<PointsTrend[]>({
    queryKey: ['/api/admin/analytics/points-trends', { days: selectedDays }],
    enabled: true
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (overviewError) {
    return (
      <div className="container mx-auto p-6" data-testid="analytics-error">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load analytics data. Please check your permissions and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8" data-testid="points-analytics-dashboard">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
            Points & Rewards Analytics
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="page-description">
            Comprehensive insights into your loyalty program performance
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" data-testid="button-refresh">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics Cards */}
      {overviewLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : overview?.pointsMetrics ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title="Total Points Issued"
            value={overview.pointsMetrics.totalPointsIssued.toLocaleString()}
            icon={<Award className="h-5 w-5" />}
            testId="metric-points-issued"
          />
          <MetricCard
            title="Points Redeemed"
            value={overview.pointsMetrics.totalPointsRedeemed.toLocaleString()}
            icon={<DollarSign className="h-5 w-5" />}
            testId="metric-points-redeemed"
          />
          <MetricCard
            title="Current Balance"
            value={overview.pointsMetrics.currentBalance.toLocaleString()}
            icon={<Trophy className="h-5 w-5" />}
            testId="metric-current-balance"
          />
          <MetricCard
            title="Redemption Rate"
            value={`${overview.pointsMetrics.redemptionRate}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            testId="metric-redemption-rate"
          />
        </div>
      ) : null}

      {/* Analytics Charts */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends" data-testid="tab-trends">
            <BarChart3 className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="rewards" data-testid="tab-rewards">
            <Trophy className="h-4 w-4 mr-2" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="tiers" data-testid="tab-tiers">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Tiers
          </TabsTrigger>
          <TabsTrigger value="funnel" data-testid="tab-funnel">
            <TrendingUpIcon className="h-4 w-4 mr-2" />
            Funnel
          </TabsTrigger>
        </TabsList>

        {/* Points Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card data-testid="card-points-trends">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Points Trends Over Time</CardTitle>
                  <CardDescription>
                    Track points earned vs redeemed over time
                  </CardDescription>
                </div>
                <Select value={selectedDays} onValueChange={setSelectedDays}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : trends && trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        value.toLocaleString(),
                        name === 'pointsEarned' ? 'Points Earned' : 
                        name === 'pointsRedeemed' ? 'Points Redeemed' : 'Net Change'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pointsEarned" 
                      stroke="#00C49F" 
                      strokeWidth={2}
                      name="Points Earned"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pointsRedeemed" 
                      stroke="#FF8042" 
                      strokeWidth={2}
                      name="Points Redeemed"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="netChange" 
                      stroke="#8884D8" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Net Change"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-80 text-muted-foreground">
                  <p>No trend data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reward Popularity Tab */}
        <TabsContent value="rewards" className="space-y-6">
          <Card data-testid="card-reward-popularity">
            <CardHeader>
              <CardTitle>Most Popular Rewards</CardTitle>
              <CardDescription>
                Rewards ranked by redemption frequency
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : overview?.popularRewards && overview.popularRewards.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={overview.popularRewards}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="rewardName" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Redemptions']}
                      labelFormatter={(label) => `Reward: ${label}`}
                    />
                    <Bar dataKey="redemptionCount" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-80 text-muted-foreground">
                  <p>No reward redemption data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tier Distribution Tab */}
        <TabsContent value="tiers" className="space-y-6">
          <Card data-testid="card-tier-distribution">
            <CardHeader>
              <CardTitle>User Tier Distribution</CardTitle>
              <CardDescription>
                Breakdown of users across tier levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : overview?.tierDistribution && overview.tierDistribution.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={overview.tierDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ tierLevel, percentage }) => `${tierLevel}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="userCount"
                      >
                        {overview.tierDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={TIER_COLORS[entry.tierLevel as keyof typeof TIER_COLORS] || COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${value} users (${props.payload.percentage}%)`,
                          props.payload.tierLevel
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Tier Breakdown</h4>
                    {overview.tierDistribution.map((tier, index) => (
                      <div key={tier.tierLevel} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: TIER_COLORS[tier.tierLevel as keyof typeof TIER_COLORS] || COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{tier.tierLevel}</span>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">{tier.userCount} users</div>
                          <div className="text-muted-foreground">{tier.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 text-muted-foreground">
                  <p>No tier distribution data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Redemption Funnel Tab */}
        <TabsContent value="funnel" className="space-y-6">
          <Card data-testid="card-redemption-funnel">
            <CardHeader>
              <CardTitle>Redemption Conversion Funnel</CardTitle>
              <CardDescription>
                Track user journey from signup to redemption
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : overview?.redemptionFunnel ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg border">
                      <div className="text-2xl font-bold text-blue-600" data-testid="funnel-total-users">
                        {overview.redemptionFunnel.totalUsers}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                    </div>
                    <div className="text-center p-4 rounded-lg border">
                      <div className="text-2xl font-bold text-green-600" data-testid="funnel-users-with-points">
                        {overview.redemptionFunnel.usersWithPoints}
                      </div>
                      <div className="text-sm text-muted-foreground">Users with Points</div>
                    </div>
                    <div className="text-center p-4 rounded-lg border">
                      <div className="text-2xl font-bold text-orange-600" data-testid="funnel-users-redeemed">
                        {overview.redemptionFunnel.usersWhoRedeemed}
                      </div>
                      <div className="text-sm text-muted-foreground">Users Who Redeemed</div>
                    </div>
                    <div className="text-center p-4 rounded-lg border">
                      <div className="text-2xl font-bold text-purple-600" data-testid="funnel-conversion-rate">
                        {overview.redemptionFunnel.conversionRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Conversion Rate</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 text-muted-foreground">
                  <p>No funnel data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  testId?: string;
}

const MetricCard = ({ title, value, icon, testId }: MetricCardProps) => (
  <Card data-testid={testId}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </div>
    </CardContent>
  </Card>
);

export default PointsAnalyticsDashboard;
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  Target, 
  Award, 
  Clock, 
  Users, 
  Phone,
  CheckCircle,
  AlertCircle,
  Star,
  Calendar,
  Download,
  Filter,
  BarChart3,
  TrendingDown
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface AgentPerformanceMetrics {
  agentId: string;
  agentEmail: string;
  quotesGenerated: number;
  activeClients: number;
  policiesSold: number;
  totalClaims: number;
  performanceRating: number;
  responseTime: number;
}

interface PerformanceHistory {
  month: string;
  quotesGenerated: number;
  newClients: number;
  policiesSold: number;
  performanceScore: number;
}

interface GoalsAndTargets {
  goals: {
    quotesTarget: number;
    clientsTarget: number;
    policiesTarget: number;
    revenueTarget: number;
  };
  current: {
    quotesActual: number;
    clientsActual: number;
    policiesActual: number;
    revenueActual: number;
  };
  achievement: {
    quotesPercentage: number;
    clientsPercentage: number;
    policiesPercentage: number;
    revenuePercentage: number;
  };
}

interface ProductivityMetrics {
  averageResponseTime: number;
  dailyQuoteAverage: number;
  weeklyClientAverage: number;
  productivityScore: number;
  thirtyDayActivity: {
    quotesGenerated: number;
    clientsAssigned: number;
  };
}

interface AgentRankings {
  rankings: Array<{
    agentId: string;
    agentEmail: string;
    rank: number;
    productivityScore: number;
    quotesGenerated: number;
    activeClients: number;
    performanceRating: number;
  }>;
  topPerformer: any;
  averageScore: number;
  totalAgents: number;
}

export default function AgentPerformancePage() {
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [timeRange, setTimeRange] = useState("6");
  const { hasMinimumPrivilegeLevel, isSuperAdmin } = useRoleAuth();
  const { user } = useAuth();

  // Fetch agent performance metrics
  const { data: performanceMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/organizations", user?.organizationId, "agent-performance"],
    enabled: hasMinimumPrivilegeLevel(1) && !!user?.organizationId, // TenantAdmin or higher
  }) as { data: AgentPerformanceMetrics[] | undefined; isLoading: boolean };

  // Fetch performance history for selected agent
  const { data: performanceHistory } = useQuery({
    queryKey: [`/api/agents/${selectedAgent}/performance-history`, { months: parseInt(timeRange) }],
    enabled: selectedAgent !== "all" && hasMinimumPrivilegeLevel(1),
  }) as { data: PerformanceHistory[] | undefined };

  // Fetch goals and targets for selected agent
  const { data: goalsAndTargets } = useQuery({
    queryKey: [`/api/agents/${selectedAgent}/goals`],
    enabled: selectedAgent !== "all" && hasMinimumPrivilegeLevel(1),
  }) as { data: GoalsAndTargets | undefined };

  // Fetch productivity metrics for selected agent
  const { data: productivityMetrics } = useQuery({
    queryKey: [`/api/agents/${selectedAgent}/productivity`],
    enabled: selectedAgent !== "all" && hasMinimumPrivilegeLevel(1),
  }) as { data: ProductivityMetrics | undefined };

  // Fetch agent rankings
  const { data: agentRankings } = useQuery({
    queryKey: ["/api/organizations", user?.organizationId, "agent-rankings"],
    enabled: hasMinimumPrivilegeLevel(1) && !!user?.organizationId,
  }) as { data: AgentRankings | undefined };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Very Good";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  if (metricsLoading) {
    return (
      <DashboardLayout title="Agent Performance" requiredRoles={["TenantAdmin", "SuperAdmin"]}>
        <div className="space-y-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Agent Performance" requiredRoles={["TenantAdmin", "SuperAdmin"]}>
      <div className="space-y-6" data-testid="agent-performance-page">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
              Agent Performance Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track and analyze agent performance metrics and productivity
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-48" data-testid="select-agent">
                <SelectValue placeholder="Select Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents Overview</SelectItem>
                {performanceMetrics?.map((agent) => (
                  <SelectItem key={agent.agentId} value={agent.agentId}>
                    {agent.agentEmail}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" data-testid="export-report">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Agents</p>
                  <p className="text-2xl font-bold">{performanceMetrics?.length || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Performance</p>
                  <p className="text-2xl font-bold">
                    {agentRankings ? agentRankings.averageScore.toFixed(1) : "0.0"}
                  </p>
                </div>
                <Award className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Quotes</p>
                  <p className="text-2xl font-bold">
                    {performanceMetrics?.reduce((sum, agent) => sum + agent.quotesGenerated, 0) || 0}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Policies</p>
                  <p className="text-2xl font-bold">
                    {performanceMetrics?.reduce((sum, agent) => sum + agent.policiesSold, 0) || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={selectedAgent === "all" ? "overview" : "individual"} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="individual" data-testid="tab-individual">Individual</TabsTrigger>
            <TabsTrigger value="rankings" data-testid="tab-rankings">Rankings</TabsTrigger>
            <TabsTrigger value="goals" data-testid="tab-goals">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Agent Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance Overview</CardTitle>
                <CardDescription>
                  Overall performance metrics for all agents in your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceMetrics?.map((agent) => (
                    <div 
                      key={agent.agentId} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`agent-overview-${agent.agentId}`}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {agent.agentEmail.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{agent.agentEmail}</div>
                          {renderStarRating(agent.performanceRating)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{agent.quotesGenerated}</div>
                          <div className="text-muted-foreground">Quotes</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{agent.activeClients}</div>
                          <div className="text-muted-foreground">Clients</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{agent.policiesSold}</div>
                          <div className="text-muted-foreground">Policies</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{agent.responseTime}h</div>
                          <div className="text-muted-foreground">Response</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="individual" className="space-y-6">
            {selectedAgent === "all" ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select an Agent</h3>
                  <p className="text-muted-foreground">
                    Choose an agent from the dropdown above to view detailed performance metrics.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Performance History Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Performance History
                      <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 Months</SelectItem>
                          <SelectItem value="6">6 Months</SelectItem>
                          <SelectItem value="12">12 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceHistory || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="quotesGenerated" stroke="#8884d8" name="Quotes" />
                          <Line type="monotone" dataKey="newClients" stroke="#82ca9d" name="New Clients" />
                          <Line type="monotone" dataKey="policiesSold" stroke="#ffc658" name="Policies Sold" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Productivity Metrics */}
                {productivityMetrics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                            <p className="text-2xl font-bold">{productivityMetrics.averageResponseTime}h</p>
                            <p className="text-xs text-muted-foreground mt-1">Average</p>
                          </div>
                          <Clock className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Daily Quotes</p>
                            <p className="text-2xl font-bold">{productivityMetrics.dailyQuoteAverage}</p>
                            <p className="text-xs text-muted-foreground mt-1">Average</p>
                          </div>
                          <BarChart3 className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Weekly Clients</p>
                            <p className="text-2xl font-bold">{productivityMetrics.weeklyClientAverage}</p>
                            <p className="text-xs text-muted-foreground mt-1">Average</p>
                          </div>
                          <Users className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Productivity</p>
                            <p className="text-2xl font-bold">{productivityMetrics.productivityScore}</p>
                            <p className="text-xs text-muted-foreground mt-1">Score</p>
                          </div>
                          <Award className="h-8 w-8 text-yellow-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rankings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance Rankings</CardTitle>
                <CardDescription>
                  Agent rankings based on productivity score and overall performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="agent-rankings">
                  {agentRankings?.rankings.map((agent, index) => (
                    <div 
                      key={agent.agentId} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`ranking-${agent.rank}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          agent.rank === 1 ? 'bg-yellow-500' : 
                          agent.rank === 2 ? 'bg-gray-400' : 
                          agent.rank === 3 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          {agent.rank}
                        </div>
                        <Avatar>
                          <AvatarFallback>
                            {agent.agentEmail.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{agent.agentEmail}</div>
                          {renderStarRating(agent.performanceRating)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{agent.productivityScore}</div>
                          <div className="text-muted-foreground">Score</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{agent.quotesGenerated}</div>
                          <div className="text-muted-foreground">Quotes</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{agent.activeClients}</div>
                          <div className="text-muted-foreground">Clients</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            {selectedAgent === "all" || !goalsAndTargets ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select an Agent</h3>
                  <p className="text-muted-foreground">
                    Choose an agent to view their goals and targets.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Monthly Goals Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Quotes</span>
                        <span className={`text-sm font-bold ${getPerformanceColor(goalsAndTargets.achievement.quotesPercentage)}`}>
                          {goalsAndTargets.achievement.quotesPercentage}%
                        </span>
                      </div>
                      <Progress value={goalsAndTargets.achievement.quotesPercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {goalsAndTargets.current.quotesActual} / {goalsAndTargets.goals.quotesTarget} quotes
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">New Clients</span>
                        <span className={`text-sm font-bold ${getPerformanceColor(goalsAndTargets.achievement.clientsPercentage)}`}>
                          {goalsAndTargets.achievement.clientsPercentage}%
                        </span>
                      </div>
                      <Progress value={goalsAndTargets.achievement.clientsPercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {goalsAndTargets.current.clientsActual} / {goalsAndTargets.goals.clientsTarget} clients
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Policies Sold</span>
                        <span className={`text-sm font-bold ${getPerformanceColor(goalsAndTargets.achievement.policiesPercentage)}`}>
                          {goalsAndTargets.achievement.policiesPercentage}%
                        </span>
                      </div>
                      <Progress value={goalsAndTargets.achievement.policiesPercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {goalsAndTargets.current.policiesActual} / {goalsAndTargets.goals.policiesTarget} policies
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Revenue</span>
                        <span className={`text-sm font-bold ${getPerformanceColor(goalsAndTargets.achievement.revenuePercentage)}`}>
                          {goalsAndTargets.achievement.revenuePercentage}%
                        </span>
                      </div>
                      <Progress value={goalsAndTargets.achievement.revenuePercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        ${goalsAndTargets.current.revenueActual.toLocaleString()} / ${goalsAndTargets.goals.revenueTarget.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Performance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-6 bg-muted rounded-lg">
                      <div className="text-3xl font-bold mb-2">
                        {Math.round((goalsAndTargets.achievement.quotesPercentage + 
                                   goalsAndTargets.achievement.clientsPercentage + 
                                   goalsAndTargets.achievement.policiesPercentage + 
                                   goalsAndTargets.achievement.revenuePercentage) / 4)}%
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">Overall Achievement</div>
                      <Badge variant="outline">
                        {getPerformanceLabel(Math.round((goalsAndTargets.achievement.quotesPercentage + 
                                                       goalsAndTargets.achievement.clientsPercentage + 
                                                       goalsAndTargets.achievement.policiesPercentage + 
                                                       goalsAndTargets.achievement.revenuePercentage) / 4))}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded">
                        <div className="font-bold text-blue-600">{goalsAndTargets.current.quotesActual}</div>
                        <div className="text-blue-600">Quotes This Month</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                        <div className="font-bold text-green-600">{goalsAndTargets.current.clientsActual}</div>
                        <div className="text-green-600">New Clients</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded">
                        <div className="font-bold text-purple-600">{goalsAndTargets.current.policiesActual}</div>
                        <div className="text-purple-600">Policies Sold</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded">
                        <div className="font-bold text-orange-600">
                          ${goalsAndTargets.current.revenueActual.toLocaleString()}
                        </div>
                        <div className="text-orange-600">Revenue</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
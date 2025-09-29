import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Trophy, 
  Star, 
  Medal, 
  Calendar,
  Users,
  Target,
  Gift,
  Share2,
  Lock,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  Crown,
  Award,
  Coins
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: 'Milestone' | 'Streak' | 'Activity' | 'Tier' | 'Referral';
  icon: string;
  pointsReward: number;
  requirements: any;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface UserAchievement {
  id: number;
  userId: string;
  achievementId: number;
  unlockedAt: string;
  pointsAwarded: number;
  achievement: Achievement;
}

const getAchievementIcon = (iconName: string, category: string) => {
  const iconProps = { className: "h-8 w-8" };
  
  switch (iconName) {
    case 'trophy': return <Trophy {...iconProps} />;
    case 'shield-check': return <Award {...iconProps} />;
    case 'coins': return <Coins {...iconProps} />;
    case 'calendar-check': return <Calendar {...iconProps} />;
    case 'medal': return <Medal {...iconProps} />;
    case 'star': return <Star {...iconProps} />;
    case 'users': return <Users {...iconProps} />;
    case 'target': return <Target {...iconProps} />;
    case 'crown': return <Crown {...iconProps} />;
    default: return <Trophy {...iconProps} />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Milestone': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'Streak': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'Activity': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Tier': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'Referral': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  progress?: number;
  isUnlocked: boolean;
}

const AchievementCard = ({ achievement, userAchievement, progress = 0, isUnlocked }: AchievementCardProps) => {
  const { toast } = useToast();
  
  const handleShare = () => {
    const shareText = `I just unlocked the "${achievement.name}" achievement on JustAskShel! 🏆`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Achievement Unlocked!',
        text: shareText,
        url: window.location.origin
      });
    } else {
      navigator.clipboard.writeText(shareText + ` ${window.location.origin}`);
      toast({
        title: "Copied to clipboard!",
        description: "Share your achievement with friends",
      });
    }
  };

  const getCardStyles = () => {
    if (isUnlocked) {
      return "border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20";
    } else if (progress > 0) {
      return "border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20";
    } else {
      return "border-gray-200 bg-gray-50 dark:bg-gray-800/50 opacity-75";
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${getCardStyles()}`}
          data-testid={`achievement-card-${achievement.id}`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                {getAchievementIcon(achievement.icon, achievement.category)}
              </div>
              <div className="flex items-center space-x-2">
                {isUnlocked ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : progress > 0 ? (
                  <Clock className="h-5 w-5 text-blue-600" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-400" />
                )}
                <Badge className={getCategoryColor(achievement.category)}>
                  {achievement.category}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg">{achievement.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {achievement.description}
              </p>
            </div>
            
            {!isUnlocked && progress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-1 text-sm font-medium text-yellow-600">
                <Coins className="h-4 w-4" />
                <span>+{achievement.pointsReward} pts</span>
              </div>
              {isUnlocked && (
                <span className="text-xs text-muted-foreground">
                  Unlocked {userAchievement && format(new Date(userAchievement.unlockedAt), 'MMM dd')}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-md" data-testid={`achievement-modal-${achievement.id}`}>
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-3 rounded-lg ${isUnlocked ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
              {getAchievementIcon(achievement.icon, achievement.category)}
            </div>
            <div>
              <DialogTitle className="text-xl">{achievement.name}</DialogTitle>
              <Badge className={getCategoryColor(achievement.category)}>
                {achievement.category}
              </Badge>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <DialogDescription className="text-base">
            {achievement.description}
          </DialogDescription>
          
          {!isUnlocked && (
            <div className="space-y-2">
              <h4 className="font-medium">Requirements:</h4>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                {achievement.requirements?.type === 'points_earned' && `Earn ${achievement.requirements.threshold} total points`}
                {achievement.requirements?.type === 'policy_count' && `Purchase ${achievement.requirements.threshold} insurance policies`}
                {achievement.requirements?.type === 'login_streak' && `Log in for ${achievement.requirements.threshold} consecutive days`}
                {achievement.requirements?.type === 'referrals_made' && `Successfully refer ${achievement.requirements.threshold} new users`}
                {achievement.requirements?.type === 'tier_reached' && `Reach ${achievement.requirements.threshold} tier status`}
                {achievement.requirements?.type === 'first_action' && 'Complete your first action on the platform'}
              </div>
              
              {progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Your Progress</span>
                    <span>{Math.round(progress)}% complete</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-300">
              <Gift className="h-5 w-5" />
              <span className="font-medium">Reward: +{achievement.pointsReward} points</span>
            </div>
          </div>
          
          {isUnlocked && (
            <div className="flex flex-col space-y-3">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-700 dark:text-green-300 font-medium">Achievement Unlocked!</p>
                {userAchievement && (
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(userAchievement.unlockedAt), 'MMMM dd, yyyy')}
                  </p>
                )}
              </div>
              
              <Button onClick={handleShare} variant="outline" className="w-full" data-testid="share-achievement">
                <Share2 className="h-4 w-4 mr-2" />
                Share Achievement
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AchievementsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <Card key={i} className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex space-x-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);

export default function AchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch all achievements
  const { data: achievements, isLoading: achievementsLoading, error: achievementsError } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  // Fetch user achievements
  const { data: userAchievements, isLoading: userAchievementsLoading } = useQuery<UserAchievement[]>({
    queryKey: ["/api/user/achievements"],
  });

  // Calculate achievement progress (simplified - in real implementation this would come from backend)
  const calculateProgress = (achievement: Achievement) => {
    // Mock progress calculation - replace with actual backend data
    const isUnlocked = userAchievements?.some(ua => ua.achievementId === achievement.id);
    if (isUnlocked) return 100;
    
    // Mock progress based on achievement type
    switch (achievement.requirements?.type) {
      case 'points_earned':
        return Math.min(85, Math.random() * 100); // Mock progress
      case 'login_streak':
        return Math.min(70, Math.random() * 100);
      case 'referrals_made':
        return Math.min(60, Math.random() * 100);
      default:
        return Math.random() > 0.7 ? Math.random() * 100 : 0;
    }
  };

  const isLoading = achievementsLoading || userAchievementsLoading;

  if (achievementsError) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6" data-testid="achievements-error">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load achievements. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const categories = ['all', 'Milestone', 'Streak', 'Activity', 'Tier', 'Referral'];
  
  const filteredAchievements = achievements?.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  ).sort((a, b) => a.sortOrder - b.sortOrder) || [];

  const stats = {
    total: achievements?.length || 0,
    unlocked: userAchievements?.length || 0,
    totalPoints: userAchievements?.reduce((sum, ua) => sum + ua.pointsAwarded, 0) || 0,
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-8" data-testid="achievements-page">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Achievements</h1>
              <p className="text-muted-foreground">
                Track your progress and unlock rewards for your accomplishments
              </p>
            </div>
          </div>

          {/* Achievement Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Achievements</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">{stats.unlocked}</span>
                  <span className="text-muted-foreground">/ {stats.total}</span>
                </div>
                {stats.total > 0 && (
                  <Progress 
                    value={(stats.unlocked / stats.total) * 100} 
                    className="mt-2 h-2" 
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Points Earned</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center space-x-2">
                  <Coins className="h-5 w-5 text-yellow-600" />
                  <span className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold">
                    {stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            {categories.map(category => (
              <TabsTrigger 
                key={category} 
                value={category} 
                className="capitalize"
                data-testid={`tab-${category}`}
              >
                {category === 'all' ? 'All' : category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(category => (
            <TabsContent key={category} value={category} className="space-y-6">
              {isLoading ? (
                <AchievementsSkeleton />
              ) : filteredAchievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAchievements.map(achievement => {
                    const userAchievement = userAchievements?.find(ua => ua.achievementId === achievement.id);
                    const isUnlocked = !!userAchievement;
                    const progress = calculateProgress(achievement);
                    
                    return (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        userAchievement={userAchievement}
                        progress={progress}
                        isUnlocked={isUnlocked}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">No achievements found</h3>
                  <p className="text-muted-foreground mt-2">
                    {category === 'all' 
                      ? 'Start using the platform to unlock your first achievement!'
                      : `No ${category.toLowerCase()} achievements available yet.`
                    }
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Recent Activity */}
        {userAchievements && userAchievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Recent Achievements</span>
              </CardTitle>
              <CardDescription>
                Your latest unlocked achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userAchievements
                  .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
                  .slice(0, 5)
                  .map(userAchievement => (
                    <div 
                      key={userAchievement.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      data-testid={`recent-achievement-${userAchievement.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                          {getAchievementIcon(userAchievement.achievement.icon, userAchievement.achievement.category)}
                        </div>
                        <div>
                          <p className="font-medium">{userAchievement.achievement.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(userAchievement.unlockedAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-yellow-600">
                        <Coins className="h-4 w-4" />
                        <span className="font-medium">+{userAchievement.pointsAwarded}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
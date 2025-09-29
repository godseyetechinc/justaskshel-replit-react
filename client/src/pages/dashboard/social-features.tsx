import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users2, 
  Trophy, 
  Star, 
  Medal,
  Crown,
  Share2,
  UserPlus,
  Eye,
  EyeOff,
  Zap,
  TrendingUp,
  Heart,
  MessageCircle,
  Copy,
  ExternalLink,
  Settings,
  Award,
  Target,
  Calendar,
  Gift
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface LeaderboardEntry {
  id: string;
  personId: string;
  displayName: string;
  email: string;
  totalPoints: number;
  currentTier: string;
  joinedAt: string;
  rank: number;
  avatar?: string;
}

interface SocialSettings {
  id: string;
  userId: string;
  showOnLeaderboard: boolean;
  allowFriendRequests: boolean;
  shareAchievements: boolean;
  publicProfile: boolean;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  fromUser: {
    displayName: string;
    email: string;
    avatar?: string;
  };
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: string;
  pointsReward: number;
  unlockedAt: string;
}

interface SharedAchievement {
  id: string;
  achievementId: number;
  userId: string;
  sharedAt: string;
  likes: number;
  comments: number;
  achievement: Achievement;
  user: {
    displayName: string;
    email: string;
    avatar?: string;
  };
}

const getTierIcon = (tier: string) => {
  switch (tier) {
    case 'Diamond': return <Crown className="h-5 w-5 text-purple-500" />;
    case 'Platinum': return <Medal className="h-5 w-5 text-gray-400" />;
    case 'Gold': return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 'Silver': return <Award className="h-5 w-5 text-gray-300" />;
    case 'Bronze': return <Star className="h-5 w-5 text-amber-600" />;
    default: return <Star className="h-5 w-5 text-gray-400" />;
  }
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'Diamond': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'Platinum': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    case 'Gold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'Silver': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    case 'Bronze': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

export default function SocialFeaturesPage() {
  const [activeTab, setActiveTab] = useState("leaderboard");
  const { toast } = useToast();

  // Fetch leaderboard data
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/social/leaderboard'],
    enabled: activeTab === "leaderboard"
  });

  // Fetch social settings
  const { data: socialSettings, isLoading: settingsLoading } = useQuery<SocialSettings>({
    queryKey: ['/api/social/settings']
  });

  // Fetch friend requests
  const { data: friendRequests, isLoading: friendRequestsLoading } = useQuery<FriendRequest[]>({
    queryKey: ['/api/social/friend-requests'],
    enabled: activeTab === "friends"
  });

  // Fetch shared achievements
  const { data: sharedAchievements, isLoading: sharedLoading } = useQuery<SharedAchievement[]>({
    queryKey: ['/api/social/shared-achievements'],
    enabled: activeTab === "achievements"
  });

  // Update social settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<SocialSettings>) => 
      apiRequest('/api/social/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/settings'] });
      toast({ description: "Privacy settings updated successfully!" });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Failed to update settings. Please try again." 
      });
    }
  });

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: (email: string) =>
      apiRequest('/api/social/friend-requests', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/friend-requests'] });
      toast({ description: "Friend request sent successfully!" });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Failed to send friend request. Please try again." 
      });
    }
  });

  // Share achievement mutation
  const shareAchievementMutation = useMutation({
    mutationFn: (achievementId: number) =>
      apiRequest('/api/social/share-achievement', {
        method: 'POST',
        body: JSON.stringify({ achievementId })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/shared-achievements'] });
      toast({ description: "Achievement shared successfully!" });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Failed to share achievement. Please try again." 
      });
    }
  });

  const handleSettingChange = (key: keyof SocialSettings, value: boolean) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const handleCopyProfile = () => {
    const profileUrl = window.location.origin + '/profile/shared';
    navigator.clipboard.writeText(profileUrl);
    toast({ description: "Profile link copied to clipboard!" });
  };

  const handleShareOnSocial = (platform: string, achievementId?: number) => {
    const baseUrl = window.location.origin;
    const text = achievementId 
      ? `I just unlocked a new achievement on JustAskShel! 🎉`
      : `Check out my progress on JustAskShel! 🏆`;
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(baseUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(baseUrl)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      if (achievementId) {
        shareAchievementMutation.mutate(achievementId);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Social Features</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleCopyProfile} data-testid="button-copy-profile">
              <Copy className="h-4 w-4 mr-2" />
              Copy Profile Link
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="friends" data-testid="tab-friends">
              <Users2 className="h-4 w-4 mr-2" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="achievements" data-testid="tab-achievements">
              <Share2 className="h-4 w-4 mr-2" />
              Shared Achievements
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="h-4 w-4 mr-2" />
              Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Points Leaderboard
                </CardTitle>
                <CardDescription>
                  See how you rank against other members in total points earned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
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
                            <AvatarImage src={entry.avatar} />
                            <AvatarFallback>{entry.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium" data-testid={`text-user-${entry.id}`}>
                              {entry.displayName}
                            </p>
                            <div className="flex items-center gap-2">
                              {getTierIcon(entry.currentTier)}
                              <Badge variant="secondary" className={getTierColor(entry.currentTier)}>
                                {entry.currentTier}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary" data-testid={`text-points-${entry.id}`}>
                            {entry.totalPoints.toLocaleString()} pts
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Joined {format(new Date(entry.joinedAt), 'MMM yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <Trophy className="h-4 w-4" />
                    <AlertDescription>
                      No leaderboard data available yet. Start earning points to see your ranking!
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="friends" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-blue-500" />
                    Add Friends
                  </CardTitle>
                  <CardDescription>
                    Connect with other members to share achievements and compete
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Enter friend's email address"
                        className="flex-1 px-3 py-2 border rounded-md"
                        data-testid="input-friend-email"
                      />
                      <Button 
                        onClick={() => {
                          const input = document.querySelector('[data-testid="input-friend-email"]') as HTMLInputElement;
                          if (input?.value) {
                            sendFriendRequestMutation.mutate(input.value);
                            input.value = '';
                          }
                        }}
                        disabled={sendFriendRequestMutation.isPending}
                        data-testid="button-send-request"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Send Request
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Send friend requests by email to connect with other JustAskShel members
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users2 className="h-5 w-5 text-green-500" />
                    Friend Requests
                  </CardTitle>
                  <CardDescription>
                    Pending friend requests from other members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {friendRequestsLoading ? (
                    <div className="space-y-3">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-[150px]" />
                        </div>
                      ))}
                    </div>
                  ) : friendRequests && friendRequests.length > 0 ? (
                    <div className="space-y-3">
                      {friendRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={request.fromUser.avatar} />
                              <AvatarFallback>{request.fromUser.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{request.fromUser.displayName}</p>
                              <p className="text-xs text-muted-foreground">{request.fromUser.email}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" data-testid={`button-accept-${request.id}`}>
                              Accept
                            </Button>
                            <Button size="sm" variant="ghost" data-testid={`button-decline-${request.id}`}>
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <Users2 className="h-4 w-4" />
                      <AlertDescription>
                        No pending friend requests at the moment.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-purple-500" />
                  Shared Achievements
                </CardTitle>
                <CardDescription>
                  Recent achievements shared by the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sharedLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[150px]" />
                            <Skeleton className="h-3 w-[100px]" />
                          </div>
                        </div>
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ))}
                  </div>
                ) : sharedAchievements && sharedAchievements.length > 0 ? (
                  <div className="space-y-4">
                    {sharedAchievements.map((shared) => (
                      <div key={shared.id} className="border rounded-lg p-4 space-y-3" data-testid={`shared-achievement-${shared.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={shared.user.avatar} />
                              <AvatarFallback>{shared.user.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{shared.user.displayName}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(shared.sharedAt), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" data-testid={`button-share-${shared.id}`}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                              <Trophy className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{shared.achievement.name}</h4>
                              <p className="text-sm text-muted-foreground">{shared.achievement.description}</p>
                              <Badge variant="secondary" className="mt-1">
                                +{shared.achievement.pointsReward} points
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <button className="flex items-center gap-1 hover:text-red-500">
                            <Heart className="h-4 w-4" />
                            {shared.likes}
                          </button>
                          <button className="flex items-center gap-1 hover:text-blue-500">
                            <MessageCircle className="h-4 w-4" />
                            {shared.comments}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <Share2 className="h-4 w-4" />
                    <AlertDescription>
                      No shared achievements yet. Be the first to share an achievement!
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-500" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control your visibility and social interactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settingsLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-6 w-[44px]" />
                      </div>
                    ))}
                  </div>
                ) : socialSettings ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-base font-medium">Show on Leaderboard</label>
                        <p className="text-sm text-muted-foreground">
                          Display your ranking and points on the public leaderboard
                        </p>
                      </div>
                      <Switch
                        checked={socialSettings.showOnLeaderboard}
                        onCheckedChange={(checked) => handleSettingChange('showOnLeaderboard', checked)}
                        data-testid="switch-leaderboard"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-base font-medium">Allow Friend Requests</label>
                        <p className="text-sm text-muted-foreground">
                          Let other members send you friend requests
                        </p>
                      </div>
                      <Switch
                        checked={socialSettings.allowFriendRequests}
                        onCheckedChange={(checked) => handleSettingChange('allowFriendRequests', checked)}
                        data-testid="switch-friend-requests"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-base font-medium">Share Achievements</label>
                        <p className="text-sm text-muted-foreground">
                          Automatically share achievements when unlocked
                        </p>
                      </div>
                      <Switch
                        checked={socialSettings.shareAchievements}
                        onCheckedChange={(checked) => handleSettingChange('shareAchievements', checked)}
                        data-testid="switch-share-achievements"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-base font-medium">Public Profile</label>
                        <p className="text-sm text-muted-foreground">
                          Make your profile visible to other members
                        </p>
                      </div>
                      <Switch
                        checked={socialSettings.publicProfile}
                        onCheckedChange={(checked) => handleSettingChange('publicProfile', checked)}
                        data-testid="switch-public-profile"
                      />
                    </div>
                  </>
                ) : (
                  <Alert>
                    <Settings className="h-4 w-4" />
                    <AlertDescription>
                      Unable to load privacy settings. Please refresh the page.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Share Your Profile</h4>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleShareOnSocial('twitter')}
                      data-testid="button-share-twitter"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Twitter
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleShareOnSocial('facebook')}
                      data-testid="button-share-facebook"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Facebook
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleShareOnSocial('linkedin')}
                      data-testid="button-share-linkedin"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      LinkedIn
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
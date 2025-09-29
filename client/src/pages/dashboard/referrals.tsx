import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Copy, 
  Share2, 
  Users, 
  CheckCircle2,
  Clock,
  XCircle,
  Coins,
  Link as LinkIcon,
  Mail,
  MessageSquare,
  Gift,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface ReferralCode {
  id: number;
  code: string;
  userId: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalPointsEarned: number;
  conversionRate: number;
}

interface ReferredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  signupDate: string;
  status: 'Pending' | 'Completed' | 'Expired';
  pointsEarned: number;
}

const ReferralCodeCard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: referralCode, isLoading: codeLoading } = useQuery<ReferralCode>({
    queryKey: ["/api/referrals/my-code"],
  });

  const generateCodeMutation = useMutation({
    mutationFn: () => apiRequest("/api/referrals/generate-code", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/my-code"] });
      toast({
        title: "New referral code generated!",
        description: "Your referral code is ready to share",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate referral code",
        variant: "destructive",
      });
    },
  });

  const copyCode = () => {
    if (referralCode) {
      const referralUrl = `${window.location.origin}/signup?ref=${referralCode.code}`;
      navigator.clipboard.writeText(referralUrl);
      toast({
        title: "Copied to clipboard!",
        description: "Share this link with your friends",
      });
    }
  };

  const shareCode = () => {
    if (referralCode) {
      const referralUrl = `${window.location.origin}/signup?ref=${referralCode.code}`;
      const shareText = `Join JustAskShel and get exclusive insurance deals! Use my referral link to get started: ${referralUrl}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Join JustAskShel',
          text: shareText,
          url: referralUrl
        });
      } else {
        navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to clipboard!",
          description: "Share this message with your friends",
        });
      }
    }
  };

  if (codeLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span>Your Referral Code</span>
        </CardTitle>
        <CardDescription>
          Share your unique code and earn points when friends sign up
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {referralCode ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="referral-code">Referral Link</Label>
              <div className="flex space-x-2">
                <Input
                  id="referral-code"
                  value={`${window.location.origin}/signup?ref=${referralCode.code}`}
                  readOnly
                  className="font-mono text-sm"
                  data-testid="referral-url"
                />
                <Button onClick={copyCode} variant="outline" size="icon" data-testid="copy-referral">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referral-code-only">Referral Code</Label>
              <div className="flex space-x-2">
                <Input
                  id="referral-code-only"
                  value={referralCode.code}
                  readOnly
                  className="font-mono text-lg font-bold text-center"
                  data-testid="referral-code"
                />
                <Button onClick={() => generateCodeMutation.mutate()} variant="outline" size="icon" data-testid="regenerate-code">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button onClick={shareCode} className="w-full" data-testid="share-general">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button 
                onClick={() => {
                  const subject = "Join JustAskShel - Exclusive Insurance Deals";
                  const body = `Hi!\n\nI wanted to share JustAskShel with you - it's an amazing platform for comparing and managing insurance policies.\n\nUse my referral link to get started: ${window.location.origin}/signup?ref=${referralCode.code}\n\nYou'll get access to exclusive deals and I'll earn some points too!\n\nBest regards`;
                  window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                }}
                variant="outline" 
                className="w-full"
                data-testid="share-email"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button 
                onClick={() => {
                  const text = `Join JustAskShel using my referral link: ${window.location.origin}/signup?ref=${referralCode.code}`;
                  window.open(`sms:?body=${encodeURIComponent(text)}`);
                }}
                variant="outline" 
                className="w-full"
                data-testid="share-sms"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                SMS
              </Button>
            </div>

            {referralCode.expiresAt && (
              <div className="text-sm text-muted-foreground">
                <Clock className="h-4 w-4 inline mr-1" />
                Expires on {format(new Date(referralCode.expiresAt), 'MMM dd, yyyy')}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">You don't have a referral code yet</p>
            <Button 
              onClick={() => generateCodeMutation.mutate()} 
              disabled={generateCodeMutation.isPending}
              data-testid="generate-first-code"
            >
              Generate My Referral Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ReferralStatsCards = () => {
  const { data: stats, isLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/referrals/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span className="text-2xl font-bold">{stats?.totalReferrals || 0}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Successful</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{stats?.successfulReferrals || 0}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Points Earned</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-yellow-600" />
            <span className="text-2xl font-bold text-yellow-600">{stats?.totalPointsEarned || 0}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span className="text-2xl font-bold text-purple-600">
              {stats ? Math.round(stats.conversionRate) : 0}%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ReferredUsersTable = () => {
  const { data: referredUsers, isLoading, error } = useQuery<ReferredUser[]>({
    queryKey: ["/api/referrals/referred-users"],
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referred Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load referred users. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Expired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'Pending': return <Clock className="h-4 w-4" />;
      case 'Expired': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referred Users</CardTitle>
        <CardDescription>
          Track the status of users you've referred to the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : referredUsers && referredUsers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Signup Date</TableHead>
                <TableHead>Points Earned</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referredUsers.map((user) => (
                <TableRow key={user.id} data-testid={`referred-user-${user.id}`}>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {format(new Date(user.signupDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Coins className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium">{user.pointsEarned}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(user.status)} flex items-center space-x-1 w-fit`}>
                      {getStatusIcon(user.status)}
                      <span>{user.status}</span>
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No referrals yet</h3>
            <p className="text-muted-foreground mt-2">
              Start sharing your referral code to see referred users here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function ReferralsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-8" data-testid="referrals-page">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Referral Program</h1>
              <p className="text-muted-foreground">
                Invite friends and earn points when they join JustAskShel
              </p>
            </div>
          </div>

          {/* How it works */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gift className="h-5 w-5 text-purple-600" />
                <span>How Referrals Work</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Share2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">1. Share Your Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Share your unique referral link with friends via email, SMS, or social media
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold">2. Friends Sign Up</h3>
                  <p className="text-sm text-muted-foreground">
                    When someone uses your link to create an account, they become your referral
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Coins className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold">3. Earn Points</h3>
                  <p className="text-sm text-muted-foreground">
                    Get rewarded with points for each successful referral that can be redeemed for rewards
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Code Card */}
        <ReferralCodeCard />

        {/* Stats */}
        <ReferralStatsCards />

        {/* Referred Users Table */}
        <ReferredUsersTable />
      </div>
    </DashboardLayout>
  );
}
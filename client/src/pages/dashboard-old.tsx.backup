import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  Heart,
  Users,
  Plus,
  Phone,
  MessageCircle,
  CreditCard,
  Headphones,
  Search,
  FileCheck,
} from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: policies, isLoading: policiesLoading } = useQuery({
    queryKey: ["/api/policies"],
    enabled: isAuthenticated,
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ["/api/claims"],
    enabled: isAuthenticated,
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  const { data: selectedQuotes, isLoading: selectedQuotesLoading } = useQuery({
    queryKey: ["/api/selected-quotes"],
    enabled: isAuthenticated,
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  const { data: wishlist, isLoading: wishlistLoading } = useQuery({
    queryKey: ["/api/wishlist"],
    enabled: isAuthenticated,
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  const { data: dependents, isLoading: dependentsLoading } = useQuery({
    queryKey: ["/api/dependents"],
    enabled: isAuthenticated,
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const activePolicies = policies?.length || 0;
  const pendingClaims = claims?.filter(claim => claim.status === 'pending').length || 0;
  const wishlistCount = wishlist?.length || 0;
  const dependentsCount = dependents?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              {user.profileImageUrl && (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover border-4 border-white/20 mr-4"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold">
                  {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Welcome'}
                </h2>
                <p className="text-blue-100">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex flex-col md:text-right">
              <span className="text-blue-100 text-sm">Dashboard Overview</span>
              <span className="text-3xl font-bold">Welcome Back!</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-primary mr-3" />
                <div>
                  <div className="text-2xl font-bold">{activePolicies}</div>
                  <p className="text-sm text-muted-foreground">Active Policies</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{pendingClaims}</div>
                  <p className="text-sm text-muted-foreground">Pending Claims</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{wishlistCount}</div>
                  <p className="text-sm text-muted-foreground">Wishlist Items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{dependentsCount}</div>
                  <p className="text-sm text-muted-foreground">Dependents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Active Policies */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Active Insurance Policies</CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Policy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {policiesLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : policies && policies.length > 0 ? (
                  <div className="space-y-4">
                    {policies.map((policy) => (
                      <div key={policy.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{policy.quote.type.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {policy.quote.provider.name} • {policy.policyNumber}
                            </p>
                            <div className="flex items-center mt-1 space-x-2">
                              <Badge variant="secondary">{policy.status}</Badge>
                              <span className="text-xs text-muted-foreground">
                                Next payment: {policy.nextPaymentDate ? new Date(policy.nextPaymentDate).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${policy.quote.coverageAmount}</div>
                          <div className="text-sm text-muted-foreground">${policy.quote.monthlyPremium}/month</div>
                          <Button variant="link" size="sm" className="p-0 h-auto">
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No active policies found</p>
                    <Button className="mt-4">Get Your First Quote</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="ghost" className="w-full justify-start">
                    <FileCheck className="h-4 w-4 mr-3" />
                    File a Claim
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Search className="h-4 w-4 mr-3" />
                    Get New Quotes
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <CreditCard className="h-4 w-4 mr-3" />
                    Update Payment
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Headphones className="h-4 w-4 mr-3" />
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Claims */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Claims</CardTitle>
                  <Button variant="link" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                {claimsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : claims && claims.length > 0 ? (
                  <div className="space-y-3">
                    {claims.slice(0, 3).map((claim) => (
                      <div key={claim.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{claim.description || 'Claim'}</div>
                          <div className="text-sm text-muted-foreground">{claim.claimNumber}</div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={claim.status === 'approved' ? 'default' : claim.status === 'pending' ? 'secondary' : 'destructive'}
                          >
                            {claim.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(claim.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FileCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No recent claims</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Support Contact */}
            <Card>
              <CardHeader>
                <CardTitle>24/7 Claims Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Get help when you need it most. Our claims specialists are available around the clock.
                </p>
                <div className="flex flex-col gap-3">
                  <Button className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Support
                  </Button>
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Live Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

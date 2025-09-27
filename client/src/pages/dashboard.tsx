import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import DashboardLayout from "@/components/dashboard-layout";
import { Shield, FileText, Star, Users, TrendingUp, Clock, BarChart3, UserPlus } from "lucide-react";
import { Link } from "wouter";

// Helper function to parse comprehensive claim data from JSON description
function parseClaimData(claim: any) {
  try {
    if (claim?.description && typeof claim.description === 'string' && claim.description.startsWith('{')) {
      const parsed = JSON.parse(claim.description);
      return {
        ...claim,
        description: parsed.originalDescription || claim.description,
        policyNumber: parsed.comprehensiveData?.policyNumber || '',
        providerName: parsed.comprehensiveData?.providerName || '',
        providerAddress: parsed.comprehensiveData?.providerAddress || '',
        contactPhone: parsed.comprehensiveData?.contactPhone || '',
        emergencyContact: parsed.comprehensiveData?.emergencyContact || '',
        emergencyPhone: parsed.comprehensiveData?.emergencyPhone || '',
        additionalNotes: parsed.comprehensiveData?.additionalNotes || '',
      };
    }
  } catch (error) {
    console.warn('Failed to parse claim description JSON:', error);
  }
  return claim;
}

export default function Dashboard() {
  const { user, userRole, isAdmin, isAgent } = useRoleAuth();
  
  const { data: policies } = useQuery({
    queryKey: ["/api/policies"],
  });

  const { data: claims } = useQuery({
    queryKey: ["/api/claims"],
  });

  const { data: selectedQuotes } = useQuery({
    queryKey: ["/api/selected-quotes"],
  });

  const { data: wishlist } = useQuery({
    queryKey: ["/api/wishlist"],
  });

  const { data: dependents } = useQuery({
    queryKey: ["/api/dependents"],
  });

  const { data: members } = useQuery({
    queryKey: ["/api/members"],
    enabled: isAgent,
  });

  const { data: applications } = useQuery({
    queryKey: ["/api/applications"],
  });

  const stats = [
    {
      name: "Active Policies",
      value: Array.isArray(policies) ? policies.length : 0,
      icon: Shield,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      roles: ["Member", "Agent", "LandlordAdmin", "SuperAdmin"]
    },
    {
      name: "Pending Claims",
      value: Array.isArray(claims) ? claims.filter((c: any) => c.status === "pending").length : 0,
      icon: FileText,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      roles: ["Member", "Agent", "LandlordAdmin", "SuperAdmin"]
    },
    {
      name: "Selected Quotes",
      value: Array.isArray(selectedQuotes) ? selectedQuotes.length : 0,
      icon: Star,
      color: "text-green-500",
      bgColor: "bg-green-50",
      roles: ["Member", "Agent", "LandlordAdmin", "SuperAdmin"]
    },
    {
      name: "Total Members",
      value: Array.isArray(members) ? members.length : 0,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      roles: ["Agent", "LandlordAdmin", "SuperAdmin"]
    },
    {
      name: "Applications",
      value: Array.isArray(applications) ? applications.length : 0,
      icon: UserPlus,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
      roles: ["Member", "Agent", "LandlordAdmin", "SuperAdmin"]
    }
  ];

  const filteredStats = stats.filter(stat => 
    stat.roles.includes(userRole)
  );

  return (
    <DashboardLayout title="Dashboard Overview">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName || "User"}!
        </h2>
        <p className="text-gray-600">
          Here's an overview of your insurance management dashboard.
        </p>
        <div className="mt-2">
          <Badge variant={userRole === "LandlordAdmin" || userRole === "SuperAdmin" ? "default" : "secondary"}>
            {userRole} Dashboard
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {filteredStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="card-material hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card className="card-material">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest insurance activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {claims && Array.isArray(claims) && claims.length > 0 ? (
              <div className="space-y-4">
                {claims.slice(0, 3).map((claim: any) => {
                  const parsedClaim = parseClaimData(claim);
                  return (
                    <div key={claim.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Claim #{parsedClaim.claimNumber}</p>
                        <p className="text-sm text-gray-600">{parsedClaim.description || 'No description provided'}</p>
                        {parsedClaim.providerName && (
                          <p className="text-xs text-gray-500 mt-1">Provider: {parsedClaim.providerName}</p>
                        )}
                      </div>
                      <Badge 
                        variant={parsedClaim.status === "approved" ? "default" : "secondary"}
                      >
                        {parsedClaim.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="card-material">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks to manage your insurance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/quotes">
                <Button className="w-full justify-start" variant="outline">
                  <Star className="h-4 w-4 mr-2" />
                  Compare Insurance Quotes
                </Button>
              </Link>
              
              <Link href="/dashboard/applications">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Applications
                </Button>
              </Link>
              
              <Link href="/dashboard/policies">
                <Button className="w-full justify-start" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  View Policies
                </Button>
              </Link>

              {isAgent && (
                <>
                  <Link href="/dashboard/members">
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Members
                    </Button>
                  </Link>
                  
                  <Link href="/dashboard/analytics">
                    <Button className="w-full justify-start" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
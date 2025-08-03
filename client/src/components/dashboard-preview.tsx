import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Clock, 
  Heart, 
  Users, 
  Plus,
  FileCheck,
  Search,
  CreditCard,
  Headphones,
  Star
} from "lucide-react";

export default function DashboardPreview() {
  // Mock data for demonstration
  const mockPolicies = [
    {
      id: 1,
      type: "Life Insurance - Term",
      provider: "XYZ Life Insurance",
      policyNumber: "LI-2023-0847",
      status: "Active",
      nextPayment: "Dec 15, 2023",
      coverage: "$250,000",
      premium: "$19.25",
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary-100",
    },
    {
      id: 2,
      type: "Health Insurance - Gold Plan", 
      provider: "Premium Health Plus",
      policyNumber: "HI-2023-1284",
      status: "Active",
      deductible: "$850 remaining",
      coverage: "$89.00",
      premium: "per month",
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-100",
    }
  ];

  const mockClaims = [
    {
      id: 1,
      type: "Dental Cleaning",
      claimNumber: "DC-2023-5847",
      status: "Processing",
      date: "Nov 28, 2023",
      statusColor: "bg-yellow-100 text-yellow-800",
      bgColor: "bg-yellow-50 border-yellow-200",
    },
    {
      id: 2,
      type: "Annual Physical",
      claimNumber: "AP-2023-4762", 
      status: "Approved",
      date: "Nov 15, 2023",
      statusColor: "bg-green-100 text-green-800",
      bgColor: "bg-green-50 border-green-200",
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comprehensive Member Dashboard
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Manage your policies, track claims, view savings, and access expert assistance all in one place
          </p>
        </div>

        {/* Dashboard Interface Preview */}
        <div className="bg-gray-50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Dashboard Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150&q=80" 
                  alt="User Profile" 
                  className="w-16 h-16 rounded-full object-cover border-4 border-white/20 mr-4"
                />
                <div>
                  <h2 className="text-2xl font-bold">John Smith</h2>
                  <p className="text-blue-100">Member since March 2023</p>
                  <div className="flex items-center mt-1">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-sm">Rewards Points: 2,450</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:text-right">
                <span className="text-blue-100 text-sm">Total Annual Savings</span>
                <span className="text-3xl font-bold">$2,847</span>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-200">
                <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="font-semibold text-gray-900">4</div>
                <div className="text-sm text-gray-600">Active Policies</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-200">
                <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">2</div>
                <div className="text-sm text-gray-600">Pending Claims</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-200">
                <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">3</div>
                <div className="text-sm text-gray-600">Wishlist Items</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-200">
                <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">3</div>
                <div className="text-sm text-gray-600">Dependents</div>
              </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Active Policies */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        Active Insurance Policies
                      </CardTitle>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Policy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-200">
                      {mockPolicies.map((policy) => (
                        <div key={policy.id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`w-12 h-12 ${policy.bgColor} rounded-lg flex items-center justify-center mr-4`}>
                                <policy.icon className={`${policy.color} h-6 w-6`} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{policy.type}</h4>
                                <p className="text-sm text-gray-600">
                                  {policy.provider} • {policy.policyNumber}
                                </p>
                                <div className="flex items-center mt-1">
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    {policy.status}
                                  </Badge>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {policy.nextPayment ? `Next payment: ${policy.nextPayment}` : policy.deductible}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">{policy.coverage}</div>
                              <div className="text-sm text-gray-600">{policy.premium}/month</div>
                              <Button variant="link" size="sm" className="text-primary hover:text-primary/80 p-0 h-auto mt-1">
                                Manage
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button variant="ghost" className="w-full justify-start p-3 h-auto">
                        <FileCheck className="h-5 w-5 text-primary mr-3" />
                        <span className="font-medium text-gray-700">File a Claim</span>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start p-3 h-auto">
                        <Search className="h-5 w-5 text-green-600 mr-3" />
                        <span className="font-medium text-gray-700">Get New Quotes</span>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start p-3 h-auto">
                        <CreditCard className="h-5 w-5 text-purple-600 mr-3" />
                        <span className="font-medium text-gray-700">Update Payment</span>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start p-3 h-auto">
                        <Headphones className="h-5 w-5 text-blue-600 mr-3" />
                        <span className="font-medium text-gray-700">Contact Support</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Claims */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900">Recent Claims</CardTitle>
                      <Button variant="link" size="sm">View All</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockClaims.map((claim) => (
                        <div key={claim.id} className={`flex items-center justify-between p-3 rounded-lg border ${claim.bgColor}`}>
                          <div>
                            <div className="font-medium text-gray-900">{claim.type}</div>
                            <div className="text-sm text-gray-600">{claim.claimNumber}</div>
                          </div>
                          <div className="text-right">
                            <Badge className={claim.statusColor}>
                              {claim.status}
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1">{claim.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

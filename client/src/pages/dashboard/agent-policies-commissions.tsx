import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Users,
  Shield,
  Calendar,
  Eye
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function AgentPoliciesCommissionsPage() {
  const { user } = useAuth();
  const { hasMinimumPrivilegeLevel } = useRoleAuth();
  const [policyTypeFilter, setPolicyTypeFilter] = useState<string>("all");
  const [commissionStatusFilter, setCommissionStatusFilter] = useState<string>("all");

  // Only agents and admins can access this page
  const isAgent = hasMinimumPrivilegeLevel(2);

  // Fetch agent policies summary
  const { data: policiesSummary, isLoading: summaryLoading } = useQuery({
    queryKey: [`/api/agents/${user?.id}/policies/summary`],
    enabled: !!user?.id && isAgent,
  });

  // Fetch agent policies (with type filter)
  const { data: policies = [], isLoading: policiesLoading } = useQuery({
    queryKey: policyTypeFilter === "all" 
      ? [`/api/agents/${user?.id}/policies`]
      : [`/api/agents/${user?.id}/policies?type=${policyTypeFilter}`],
    enabled: !!user?.id && isAgent,
  });

  // Fetch agent commissions (with status filter)
  const { data: commissions = [], isLoading: commissionsLoading } = useQuery({
    queryKey: commissionStatusFilter === "all"
      ? [`/api/agents/${user?.id}/commissions`]
      : [`/api/agents/${user?.id}/commissions?status=${commissionStatusFilter}`],
    enabled: !!user?.id && isAgent,
  });

  if (!isAgent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Restricted</CardTitle>
              <CardDescription>
                This page is only accessible to agents and administrators.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    inactive: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="agent-policies-commissions-page">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">My Policies & Commissions</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            View and manage your assigned policies and track commission earnings
          </p>
        </div>

        {/* Summary Cards */}
        {summaryLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : policiesSummary ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card data-testid="card-total-policies">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-policies">{policiesSummary.policyCounts?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {policiesSummary.policyCounts?.active || 0} active, {policiesSummary.policyCounts?.inactive || 0} inactive
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-selling-policies">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">As Selling Agent</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-selling-count">{policiesSummary.policyCounts?.selling || 0}</div>
                <p className="text-xs text-muted-foreground">Policies sold</p>
              </CardContent>
            </Card>

            <Card data-testid="card-servicing-policies">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">As Servicing Agent</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-servicing-count">{policiesSummary.policyCounts?.servicing || 0}</div>
                <p className="text-xs text-muted-foreground">Policies servicing</p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-commissions">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-commission-total">
                  ${Number(policiesSummary.commissions?.total || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${Number(policiesSummary.commissions?.paid || 0).toFixed(2)} paid
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Tabs for Policies and Commissions */}
        <Tabs defaultValue="policies" className="space-y-4">
          <TabsList>
            <TabsTrigger value="policies" data-testid="tab-policies">My Policies</TabsTrigger>
            <TabsTrigger value="commissions" data-testid="tab-commissions">My Commissions</TabsTrigger>
          </TabsList>

          {/* Policies Tab */}
          <TabsContent value="policies" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle data-testid="text-policies-title">Policy List</CardTitle>
                    <CardDescription>View all policies where you are the selling or servicing agent</CardDescription>
                  </div>
                  <Select value={policyTypeFilter} onValueChange={setPolicyTypeFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-policy-type">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Policies</SelectItem>
                      <SelectItem value="selling">Selling Agent</SelectItem>
                      <SelectItem value="servicing">Servicing Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {policiesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading policies...</div>
                ) : policies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No policies found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Policy Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Policy Owner</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policies.map((policy: any) => (
                        <TableRow key={policy.id} data-testid={`row-policy-${policy.id}`}>
                          <TableCell className="font-medium" data-testid={`text-policy-number-${policy.id}`}>{policy.policyNumber}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[policy.status?.toLowerCase()] || statusColors.inactive}>
                              {policy.status}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-policy-owner-${policy.id}`}>{policy.userId}</TableCell>
                          <TableCell>
                            {policy.sellingAgentId === user?.id && policy.servicingAgentId === user?.id ? (
                              <Badge variant="outline">Selling & Servicing</Badge>
                            ) : policy.sellingAgentId === user?.id ? (
                              <Badge variant="outline">Selling</Badge>
                            ) : (
                              <Badge variant="outline">Servicing</Badge>
                            )}
                          </TableCell>
                          <TableCell data-testid={`text-start-date-${policy.id}`}>
                            {policy.startDate ? format(new Date(policy.startDate), "MMM dd, yyyy") : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" data-testid={`button-view-${policy.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle data-testid="text-commissions-title">Commission Tracking</CardTitle>
                    <CardDescription>Track your commission earnings and payment status</CardDescription>
                  </div>
                  <Select value={commissionStatusFilter} onValueChange={setCommissionStatusFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-commission-status">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {commissionsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading commissions...</div>
                ) : commissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No commissions found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Policy Number</TableHead>
                        <TableHead>Commission Type</TableHead>
                        <TableHead>Base Amount</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((commission: any) => (
                        <TableRow key={commission.id} data-testid={`row-commission-${commission.id}`}>
                          <TableCell className="font-medium" data-testid={`text-policy-${commission.id}`}>
                            {commission.policyNumber || `Policy #${commission.policyId}`}
                          </TableCell>
                          <TableCell data-testid={`text-type-${commission.id}`}>
                            {commission.commissionType?.replace("_", " ").toUpperCase()}
                          </TableCell>
                          <TableCell data-testid={`text-base-${commission.id}`}>${Number(commission.baseAmount || 0).toFixed(2)}</TableCell>
                          <TableCell data-testid={`text-rate-${commission.id}`}>{commission.commissionRate}%</TableCell>
                          <TableCell className="font-semibold" data-testid={`text-amount-${commission.id}`}>
                            ${Number(commission.commissionAmount || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[commission.paymentStatus?.toLowerCase()] || statusColors.pending}>
                              {commission.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-payment-date-${commission.id}`}>
                            {commission.paymentDate 
                              ? format(new Date(commission.paymentDate), "MMM dd, yyyy") 
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Commission Summary Stats */}
            {policiesSummary?.commissions && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card data-testid="card-pending-commissions">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-pending-amount">
                      ${Number(policiesSummary.commissions.pending || 0).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-approved-commissions">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved</CardTitle>
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-approved-amount">
                      ${Number(policiesSummary.commissions.approved || 0).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-paid-commissions">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Paid</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-paid-amount">
                      ${Number(policiesSummary.commissions.paid || 0).toFixed(2)}
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

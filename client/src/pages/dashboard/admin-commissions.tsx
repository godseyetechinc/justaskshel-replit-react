import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Filter
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { format } from "date-fns";
import { CommissionApprovalDialog } from "@/components/commission-approval-dialog";

export default function AdminCommissionsPage() {
  const { user } = useAuth();
  const { hasMinimumPrivilegeLevel } = useRoleAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [dialogAction, setDialogAction] = useState<"approve" | "mark-paid" | null>(null);

  // Only admins can access this page
  const isAdmin = hasMinimumPrivilegeLevel(1);

  // Fetch organization commissions summary
  const { data: orgSummary, isLoading: summaryLoading } = useQuery({
    queryKey: user?.organizationId ? [`/api/organizations/${user.organizationId}/policies/summary`] : [],
    enabled: !!user?.organizationId && isAdmin,
  });

  // Fetch all commissions
  const { data: allCommissions = [], isLoading: commissionsLoading } = useQuery({
    queryKey: user?.organizationId 
      ? (statusFilter === "all" 
          ? [`/api/organizations/${user.organizationId}/commissions`]
          : [`/api/organizations/${user.organizationId}/commissions?status=${statusFilter}`])
      : (statusFilter === "all"
          ? ["/api/commissions"]
          : [`/api/commissions?status=${statusFilter}`]),
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Restricted</CardTitle>
              <CardDescription>
                This page is only accessible to administrators.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };

  const handleApprove = (commission: any) => {
    setSelectedCommission(commission);
    setDialogAction("approve");
  };

  const handleMarkPaid = (commission: any) => {
    setSelectedCommission(commission);
    setDialogAction("mark-paid");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="admin-commissions-page">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Commission Management</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Review, approve, and process agent commission payments
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
        ) : orgSummary?.commissions ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card data-testid="card-total-commissions">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-commissions">
                  ${Number(orgSummary.commissions.total || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {orgSummary.commissions.count || 0} total commissions
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-pending-commissions">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-pending-commissions">
                  ${Number(orgSummary.commissions.pending || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>

            <Card data-testid="card-approved-commissions">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-approved-commissions">
                  ${Number(orgSummary.commissions.approved || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Ready for payment</p>
              </CardContent>
            </Card>

            <Card data-testid="card-paid-commissions">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-paid-commissions">
                  ${Number(orgSummary.commissions.paid || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Completed payments</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Commissions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle data-testid="text-commissions-title">All Commissions</CardTitle>
                <CardDescription>Review and process agent commission payments</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
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
            ) : allCommissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No commissions found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Policy</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Base Amount</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Earned Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allCommissions.map((commission: any) => (
                    <TableRow key={commission.id} data-testid={`row-commission-${commission.id}`}>
                      <TableCell data-testid={`text-agent-${commission.id}`}>
                        {commission.agentEmail || commission.agentId}
                      </TableCell>
                      <TableCell className="font-medium" data-testid={`text-policy-${commission.id}`}>
                        {commission.policyNumber || `#${commission.policyId}`}
                      </TableCell>
                      <TableCell data-testid={`text-type-${commission.id}`}>
                        {commission.commissionType?.replace("_", " ").toUpperCase()}
                      </TableCell>
                      <TableCell data-testid={`text-base-${commission.id}`}>
                        ${Number(commission.baseAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell data-testid={`text-rate-${commission.id}`}>
                        {commission.commissionRate}%
                      </TableCell>
                      <TableCell className="font-semibold" data-testid={`text-amount-${commission.id}`}>
                        ${Number(commission.commissionAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[commission.paymentStatus?.toLowerCase()] || statusColors.pending}>
                          {commission.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-earned-${commission.id}`}>
                        {commission.earnedDate 
                          ? format(new Date(commission.earnedDate), "MMM dd, yyyy") 
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {commission.paymentStatus === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(commission)}
                              data-testid={`button-approve-${commission.id}`}
                            >
                              Approve
                            </Button>
                          )}
                          {commission.paymentStatus === "approved" && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkPaid(commission)}
                              data-testid={`button-mark-paid-${commission.id}`}
                            >
                              Mark Paid
                            </Button>
                          )}
                          {commission.paymentStatus === "paid" && (
                            <span className="text-xs text-muted-foreground">
                              Paid {commission.paymentDate && format(new Date(commission.paymentDate), "MMM dd")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Commission Approval Dialog */}
      {selectedCommission && dialogAction && (
        <CommissionApprovalDialog
          open={!!dialogAction}
          onOpenChange={(open) => {
            if (!open) {
              setDialogAction(null);
              setSelectedCommission(null);
            }
          }}
          commission={selectedCommission}
          action={dialogAction}
        />
      )}
    </DashboardLayout>
  );
}

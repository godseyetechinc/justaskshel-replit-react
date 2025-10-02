import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, Eye, UserPlus } from "lucide-react";

type AccessRequest = {
  id: number;
  userId: string;
  userEmail: string;
  organizationId: number;
  requestReason: string;
  desiredRole: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export default function AccessRequestsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  // Fetch current user to get organization
  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/auth/user"]
  });

  // Fetch access requests for organization
  const { data: requests, isLoading } = useQuery<AccessRequest[]>({
    queryKey: [`/api/organizations/${currentUser?.organizationId}/access-requests`, statusFilter],
    enabled: !!currentUser?.organizationId && (currentUser?.privilegeLevel ?? 99) <= 1,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      return apiRequest(`/api/organizations/access-requests/${id}/approve`, {
        method: "PUT",
        body: JSON.stringify({ reviewNotes: notes })
      });
    },
    onSuccess: () => {
      toast({
        title: "Request Approved",
        description: "The user has been granted access to the organization.",
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/organizations/${currentUser?.organizationId}/access-requests`] 
      });
      setApprovalDialogOpen(false);
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve access request",
        variant: "destructive",
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      return apiRequest(`/api/organizations/access-requests/${id}/reject`, {
        method: "PUT",
        body: JSON.stringify({ reviewNotes: notes })
      });
    },
    onSuccess: () => {
      toast({
        title: "Request Rejected",
        description: "The access request has been rejected.",
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/organizations/${currentUser?.organizationId}/access-requests`] 
      });
      setRejectionDialogOpen(false);
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject access request",
        variant: "destructive",
      });
    }
  });

  const handleApprove = (request: AccessRequest) => {
    setSelectedRequest(request);
    setApprovalDialogOpen(true);
  };

  const handleReject = (request: AccessRequest) => {
    setSelectedRequest(request);
    setRejectionDialogOpen(true);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  };

  if (!currentUser || currentUser.privilegeLevel > 1) {
    return (
      <DashboardLayout title="Access Requests" requiredRoles={["SuperAdmin", "TenantAdmin"]}>
        <Card>
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">You don't have permission to view access requests.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Access Requests" requiredRoles={["SuperAdmin", "TenantAdmin"]}>
      <div className="space-y-6" data-testid="page-access-requests">
        <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-pending-requests">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests?.filter((r: AccessRequest) => r.status === 'pending').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-approved-requests">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests?.filter((r: AccessRequest) => r.status === 'approved').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-rejected-requests">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests?.filter((r: AccessRequest) => r.status === 'rejected').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Access Requests</CardTitle>
              <CardDescription>
                Manage user access requests for your organization
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading requests...</div>
          ) : !requests || requests.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No access requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Desired Role</TableHead>
                  <TableHead>Request Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request: AccessRequest) => (
                  <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                    <TableCell className="font-medium">{request.userEmail}</TableCell>
                    <TableCell>{request.desiredRole || 'Member'}</TableCell>
                    <TableCell className="max-w-xs truncate">{request.requestReason}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[request.status]} variant="secondary">
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(request.createdAt), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      {request.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(request)}
                            data-testid={`button-approve-${request.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request)}
                            data-testid={`button-reject-${request.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRequest(request);
                          }}
                          data-testid={`button-view-${request.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent data-testid="dialog-approve-request">
          <DialogHeader>
            <DialogTitle>Approve Access Request</DialogTitle>
            <DialogDescription>
              Grant {selectedRequest?.userEmail} access to your organization as {selectedRequest?.desiredRole || 'Member'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Request Reason</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedRequest?.requestReason}
              </p>
            </div>
            <div>
              <Label htmlFor="approval-notes">Review Notes (Optional)</Label>
              <Textarea
                id="approval-notes"
                placeholder="Add any notes about this approval..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                data-testid="textarea-approval-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApprovalDialogOpen(false);
                setReviewNotes("");
              }}
              data-testid="button-cancel-approval"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedRequest) {
                  approveMutation.mutate({ id: selectedRequest.id, notes: reviewNotes });
                }
              }}
              disabled={approveMutation.isPending}
              data-testid="button-confirm-approval"
            >
              {approveMutation.isPending ? "Approving..." : "Approve Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent data-testid="dialog-reject-request">
          <DialogHeader>
            <DialogTitle>Reject Access Request</DialogTitle>
            <DialogDescription>
              Reject the access request from {selectedRequest?.userEmail}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Request Reason</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedRequest?.requestReason}
              </p>
            </div>
            <div>
              <Label htmlFor="rejection-notes">Reason for Rejection (Optional)</Label>
              <Textarea
                id="rejection-notes"
                placeholder="Explain why this request is being rejected..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                data-testid="textarea-rejection-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectionDialogOpen(false);
                setReviewNotes("");
              }}
              data-testid="button-cancel-rejection"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedRequest) {
                  rejectMutation.mutate({ id: selectedRequest.id, notes: reviewNotes });
                }
              }}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-rejection"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}

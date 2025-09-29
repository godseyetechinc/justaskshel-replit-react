import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Building2, Users, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface InvitationDetails {
  id: number;
  email: string;
  role: string;
  organizationId: number;
  organizationName: string;
  inviterName: string;
  expiresAt: string;
  status: string;
  createdAt: string;
}

export default function AcceptInvitation() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/accept-invitation/:token");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = params?.token;

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError("Invalid invitation link");
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest(`/api/invitations/${token}/details`);
        setInvitation(response);
      } catch (err: any) {
        setError(err.message || "Failed to load invitation details");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async () => {
      // Get current user from session
      const userResponse = await apiRequest("/api/auth/user");
      if (!userResponse.id) {
        throw new Error("Please log in to accept this invitation");
      }

      return await apiRequest(`/api/invitations/${token}/accept`, {
        method: "POST",
        body: JSON.stringify({ userId: userResponse.id }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitation Accepted!",
        description: "You have successfully joined the organization.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Redirect to dashboard after success
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Accept Invitation",
        description: error.message || "Please try again or contact support",
        variant: "destructive",
      });
    },
  });

  // Decline invitation mutation
  const declineInvitationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/invitations/${token}/decline`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitation Declined",
        description: "You have declined the organization invitation.",
      });
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Decline Invitation",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleAccept = () => {
    acceptInvitationMutation.mutate();
  };

  const handleDecline = () => {
    declineInvitationMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = invitation && new Date() > new Date(invitation.expiresAt);
  const isAlreadyProcessed = invitation && invitation.status !== "Pending";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500 animate-spin" />
              <span>Loading invitation...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || "Invitation not found"}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => setLocation("/")} 
              className="w-full mt-4"
              data-testid="button-go-home"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
            <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Organization Invitation</CardTitle>
          <CardDescription>
            You've been invited to join an organization
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Building2 className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium" data-testid="text-organization-name">
                  {invitation.organizationName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Organization</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Users className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium" data-testid="text-role">
                  {invitation.role}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium" data-testid="text-email">
                  {invitation.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Email Address</p>
              </div>
            </div>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>Invited by: <span className="font-medium">{invitation.inviterName}</span></p>
              <p>Expires: <span className="font-medium">{formatDate(invitation.expiresAt)}</span></p>
            </div>
          </div>

          {/* Status Messages */}
          {isExpired && (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation has expired. Please request a new invitation from the organization.
              </AlertDescription>
            </Alert>
          )}

          {isAlreadyProcessed && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation has already been {invitation.status.toLowerCase()}.
              </AlertDescription>
            </Alert>
          )}

          {!isExpired && !isAlreadyProcessed && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Accepting this invitation will add you to the organization and update your role.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {!isExpired && !isAlreadyProcessed && (
            <div className="flex space-x-3">
              <Button
                onClick={handleAccept}
                disabled={acceptInvitationMutation.isPending}
                className="flex-1"
                data-testid="button-accept-invitation"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {acceptInvitationMutation.isPending ? "Accepting..." : "Accept Invitation"}
              </Button>
              <Button
                onClick={handleDecline}
                disabled={declineInvitationMutation.isPending}
                variant="outline"
                className="flex-1"
                data-testid="button-decline-invitation"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {declineInvitationMutation.isPending ? "Declining..." : "Decline"}
              </Button>
            </div>
          )}

          {(isExpired || isAlreadyProcessed) && (
            <Button 
              onClick={() => setLocation("/")} 
              className="w-full"
              data-testid="button-go-home"
            >
              Go Home
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
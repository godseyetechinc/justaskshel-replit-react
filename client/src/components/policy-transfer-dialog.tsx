import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface PolicyTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: any;
}

export function PolicyTransferDialog({ open, onOpenChange, policy }: PolicyTransferDialogProps) {
  const [newAgentId, setNewAgentId] = useState<string>("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch available agents
  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: user?.organizationId ? [`/api/organizations/${user.organizationId}/agents`] : ["/api/users"],
    enabled: open,
  });

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/policies/${policy.id}/transfer-servicing`, {
        method: "PUT",
        body: JSON.stringify({ newAgentId, reason }),
      });
    },
    onSuccess: () => {
      // Invalidate all policy-related queries with predicate matching
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.startsWith('/api/policies');
        }
      });
      // Invalidate agent-specific queries including filtered variants
      if (user?.id) {
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key?.startsWith(`/api/agents/${user.id}/policies`);
          }
        });
      }
      // Invalidate organization-specific queries including filtered variants
      if (user?.organizationId) {
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key?.startsWith(`/api/organizations/${user.organizationId}/policies`);
          }
        });
      }
      toast({
        title: "Transfer Successful",
        description: "Policy servicing agent has been transferred successfully.",
      });
      onOpenChange(false);
      setNewAgentId("");
      setReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to transfer policy. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTransfer = () => {
    if (!newAgentId) {
      toast({
        title: "Validation Error",
        description: "Please select a new servicing agent.",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for the transfer.",
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-policy-transfer">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">Transfer Policy Servicing Agent</DialogTitle>
          <DialogDescription>
            Transfer the servicing responsibility for policy {policy?.policyNumber} to another agent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Agent */}
          <div className="space-y-2">
            <Label>Current Servicing Agent</Label>
            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted" data-testid="text-current-agent">
              <span className="font-medium">
                {policy?.servicingAgentId || "Not Assigned"}
              </span>
            </div>
          </div>

          {/* Arrow Indicator */}
          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          {/* New Agent Selection */}
          <div className="space-y-2">
            <Label htmlFor="new-agent" data-testid="label-new-agent">New Servicing Agent *</Label>
            {agentsLoading ? (
              <div className="flex items-center gap-2 p-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading agents...</span>
              </div>
            ) : (
              <Select value={newAgentId} onValueChange={setNewAgentId}>
                <SelectTrigger id="new-agent" data-testid="select-new-agent">
                  <SelectValue placeholder="Select new agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents
                    .filter((agent: any) => agent.id !== policy?.servicingAgentId && (agent.role === "Agent" || agent.privilegeLevel === 2))
                    .map((agent: any) => (
                      <SelectItem key={agent.id} value={agent.id} data-testid={`option-agent-${agent.id}`}>
                        {agent.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" data-testid="label-reason">Reason for Transfer *</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for this transfer..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              data-testid="input-reason"
            />
            <p className="text-xs text-muted-foreground">
              This will be recorded in the policy transfer history.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={transferMutation.isPending}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleTransfer}
            disabled={transferMutation.isPending || !newAgentId || !reason.trim()}
            data-testid="button-transfer"
          >
            {transferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Transfer Policy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

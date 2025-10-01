import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface CommissionApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commission: any;
  action: "approve" | "mark-paid";
}

export function CommissionApprovalDialog({ 
  open, 
  onOpenChange, 
  commission, 
  action 
}: CommissionApprovalDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/commissions/${commission.id}/approve`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/commissions"] });
      toast({
        title: "Commission Approved",
        description: "The commission has been approved successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve commission. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mark paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/commissions/${commission.id}/mark-paid`, {
        method: "PUT",
        body: JSON.stringify({ paymentMethod, paymentReference, notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/commissions"] });
      toast({
        title: "Payment Recorded",
        description: "The commission payment has been recorded successfully.",
      });
      onOpenChange(false);
      setPaymentMethod("");
      setPaymentReference("");
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Payment Recording Failed",
        description: error.message || "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (action === "approve") {
      approveMutation.mutate();
    } else {
      if (!paymentMethod.trim() || !paymentReference.trim()) {
        toast({
          title: "Validation Error",
          description: "Please provide payment method and reference.",
          variant: "destructive",
        });
        return;
      }
      markPaidMutation.mutate();
    }
  };

  const isPending = approveMutation.isPending || markPaidMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-commission-action">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {action === "approve" ? "Approve Commission" : "Mark Commission as Paid"}
          </DialogTitle>
          <DialogDescription>
            {action === "approve" 
              ? "Approve this commission for payment processing."
              : "Record the payment details for this commission."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Commission Details */}
          <div className="space-y-3 p-4 border rounded-md bg-muted/50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Agent</span>
              <span className="font-medium" data-testid="text-agent">{commission?.agentEmail || commission?.agentId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Policy</span>
              <span className="font-medium" data-testid="text-policy">
                {commission?.policyNumber || `#${commission?.policyId}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Commission Amount</span>
              <span className="font-bold text-lg text-green-600 dark:text-green-400" data-testid="text-amount">
                ${commission?.commissionAmount?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge data-testid="badge-status">{commission?.paymentStatus}</Badge>
            </div>
            {commission?.earnedDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Earned Date</span>
                <span className="text-sm" data-testid="text-earned-date">
                  {format(new Date(commission.earnedDate), "MMM dd, yyyy")}
                </span>
              </div>
            )}
          </div>

          {/* Payment Details (only for mark-paid action) */}
          {action === "mark-paid" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="payment-method" data-testid="label-payment-method">Payment Method *</Label>
                <Input
                  id="payment-method"
                  placeholder="e.g., Wire Transfer, Check, Direct Deposit"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  data-testid="input-payment-method"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-reference" data-testid="label-payment-reference">Payment Reference *</Label>
                <Input
                  id="payment-reference"
                  placeholder="e.g., Transaction ID, Check Number"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  data-testid="input-payment-reference"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" data-testid="label-notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional payment notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  data-testid="input-notes"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || (action === "mark-paid" && (!paymentMethod.trim() || !paymentReference.trim()))}
            data-testid="button-submit"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {action === "approve" ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Commission
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Mark as Paid
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

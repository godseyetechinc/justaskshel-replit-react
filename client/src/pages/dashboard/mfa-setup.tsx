import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle2, AlertCircle, Copy, Key } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import QRCode from "qrcode";
import DashboardLayout from "@/components/dashboard-layout";

type MfaSetupResponse = {
  success: boolean;
  secret: string;
  otpauthUrl: string;
  backupCodes: string[];
};

export default function MfaSetup() {
  const [setupStep, setSetupStep] = useState<"start" | "qrcode" | "verify" | "complete">("start");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation to initiate MFA setup
  const setupMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/auth/mfa/setup", {
        method: "POST",
      }) as Promise<MfaSetupResponse>;
    },
    onSuccess: async (data) => {
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      
      // Generate QR code from otpauthUrl
      try {
        const qrUrl = await QRCode.toDataURL(data.otpauthUrl);
        setQrCodeUrl(qrUrl);
        setSetupStep("qrcode");
      } catch (error) {
        console.error("QR code generation error:", error);
        toast({
          title: "Error",
          description: "Failed to generate QR code",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate MFA setup",
        variant: "destructive",
      });
    },
  });

  // Mutation to verify and enable MFA
  const verifyMutation = useMutation({
    mutationFn: async (token: string) => {
      return apiRequest("/api/auth/mfa/verify-setup", {
        method: "POST",
        body: JSON.stringify({ token }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      setSetupStep("complete");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "MFA has been enabled successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
    },
  });

  const handleStartSetup = () => {
    setupMutation.mutate();
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length === 6) {
      verifyMutation.mutate(verificationCode);
    }
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    toast({
      title: "Copied",
      description: "Backup codes copied to clipboard",
    });
  };

  if (setupStep === "start") {
    return (
      <DashboardLayout title="Two-Factor Authentication" requiredRoles={["SuperAdmin", "TenantAdmin", "Agent", "Member"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Two-Factor Authentication</h1>
            <p className="text-muted-foreground mt-1">Secure your account with an extra layer of protection</p>
          </div>

        <Card data-testid="card-mfa-start">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Enable Two-Factor Authentication</CardTitle>
                <CardDescription>Add an authenticator app to your account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Two-factor authentication (2FA) adds an additional layer of security to your account by requiring
              both your password and a verification code from your phone.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">What you'll need:</h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>An authenticator app (Google Authenticator, Authy, or similar)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Your mobile device to scan a QR code</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>A secure place to store backup codes</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleStartSetup}
              disabled={setupMutation.isPending}
              className="w-full"
              data-testid="button-start-setup"
            >
              {setupMutation.isPending ? "Initializing..." : "Start Setup"}
            </Button>
          </CardContent>
        </Card>
      </div>
      </DashboardLayout>
    );
  }

  if (setupStep === "qrcode") {
    return (
      <DashboardLayout title="Two-Factor Authentication" requiredRoles={["SuperAdmin", "TenantAdmin", "Agent", "Member"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Set Up Authenticator App</h1>
            <p className="text-muted-foreground mt-1">Scan the QR code with your authenticator app</p>
          </div>

        <Card data-testid="card-mfa-qrcode">
          <CardHeader>
            <CardTitle>Step 1: Scan QR Code</CardTitle>
            <CardDescription>Open your authenticator app and scan this code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {qrCodeUrl && (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" data-testid="img-qr-code" />
                </div>
                
                <div className="w-full space-y-2">
                  <Label>Or enter this key manually:</Label>
                  <div className="flex gap-2">
                    <Input
                      value={secret}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-secret"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(secret);
                        toast({ title: "Copied", description: "Secret key copied to clipboard" });
                      }}
                      data-testid="button-copy-secret"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                After scanning, your authenticator app will display a 6-digit code that changes every 30 seconds.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => setSetupStep("verify")}
              className="w-full"
              data-testid="button-next-verify"
            >
              Next: Verify Code
            </Button>
          </CardContent>
        </Card>
      </div>
      </DashboardLayout>
    );
  }

  if (setupStep === "verify") {
    return (
      <DashboardLayout title="Two-Factor Authentication" requiredRoles={["SuperAdmin", "TenantAdmin", "Agent", "Member"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Verify Setup</h1>
            <p className="text-muted-foreground mt-1">Enter the code from your authenticator app</p>
          </div>

        <Card data-testid="card-mfa-verify">
          <CardHeader>
            <CardTitle>Step 2: Verify Your Code</CardTitle>
            <CardDescription>Enter the 6-digit code from your authenticator app</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  data-testid="input-verification-code"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={verifyMutation.isPending || verificationCode.length !== 6}
                data-testid="button-verify"
              >
                {verifyMutation.isPending ? "Verifying..." : "Verify and Enable"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setSetupStep("qrcode")}
                data-testid="button-back-to-qr"
              >
                Back to QR Code
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      </DashboardLayout>
    );
  }

  if (setupStep === "complete") {
    return (
      <DashboardLayout title="Two-Factor Authentication" requiredRoles={["SuperAdmin", "TenantAdmin", "Agent", "Member"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Setup Complete!</h1>
            <p className="text-muted-foreground mt-1">Save your backup codes in a secure location</p>
          </div>

        <Card className="border-green-200 dark:border-green-800" data-testid="card-mfa-complete">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-green-900 dark:text-green-100">MFA Enabled Successfully</CardTitle>
                <CardDescription>Your account is now protected with two-factor authentication</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <Key className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                <strong>Save these backup codes!</strong> You can use them to access your account if you lose your
                authenticator device.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Label>Backup Recovery Codes</Label>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="py-1" data-testid={`backup-code-${index}`}>
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCopyBackupCodes}
                data-testid="button-copy-backup-codes"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy All Backup Codes
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                From now on, you'll need to enter a code from your authenticator app every time you log in.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => window.location.href = "/dashboard/my-profile"}
              className="w-full"
              data-testid="button-done"
            >
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
      </DashboardLayout>
    );
  }

  return null;
}

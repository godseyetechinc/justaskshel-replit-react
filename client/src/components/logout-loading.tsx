import { Loader2, LogOut } from "lucide-react";

export default function LogoutLoading() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <LogOut className="h-8 w-8 text-gray-400 mr-3" />
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Logging out...
        </h2>
        <p className="text-gray-600">
          Please wait while we securely sign you out.
        </p>
      </div>
    </div>
  );
}
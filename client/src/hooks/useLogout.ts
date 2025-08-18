import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function useLogout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: () => 
      apiRequest("/api/auth/logout", {
        method: "POST",
      }),
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      
      // Redirect to login page
      setLocation("/login");
    },
    onError: (error: any) => {
      console.error("Logout error:", error);
      // Even if logout fails on server, clear client data
      queryClient.clear();
      setLocation("/login");
    },
  });

  return {
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  };
}
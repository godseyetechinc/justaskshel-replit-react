import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

export function useLogout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLogoutPage, setShowLogoutPage] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Show loading page for logout operations that take longer than 300ms
      const timeoutId = setTimeout(() => {
        setShowLogoutPage(true);
      }, 300);
      
      try {
        const result = await apiRequest("/api/logout", {
          method: "POST",
        });
        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      
      // Hide loading page and redirect
      setShowLogoutPage(false);
      setLocation("/");
    },
    onError: (error: any) => {
      console.error("Logout error:", error);
      // Even if logout fails on server, clear client data
      queryClient.clear();
      setShowLogoutPage(false);
      setLocation("/");
    },
  });

  return {
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
    showLogoutPage,
  };
}
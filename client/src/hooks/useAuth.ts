import { useQuery } from "@tanstack/react-query";

let authCheckInProgress = false;

export function useAuth() {
  const { data: user, isLoading, error, isFetching } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      // Prevent multiple simultaneous auth requests
      if (authCheckInProgress) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return null;
      }
      
      authCheckInProgress = true;
      
      try {
        const res = await fetch("/api/auth/user", {
          credentials: "include",
        });
        
        // Return null for 401/403 (not authenticated) instead of throwing
        if (res.status === 401 || res.status === 403) {
          authCheckInProgress = false;
          return null;
        }
        
        if (!res.ok) {
          authCheckInProgress = false;
          return null;
        }
        
        const userData = await res.json();
        authCheckInProgress = false;
        return userData;
      } catch (err) {
        authCheckInProgress = false;
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: false, // Disable automatic refetching
    refetchOnMount: false, // Only fetch when explicitly needed
    staleTime: 1000 * 60 * 5, // 5 minutes - cache longer to prevent loops
  });

  // Consider user authenticated if we have user data
  const isAuthenticated = !!user;
  
  // Show loading state during initial load or when refetching after login
  const isLoadingAuth = isLoading || (isFetching && !user);



  return {
    user,
    isLoading: isLoadingAuth,
    isAuthenticated,
  };
}

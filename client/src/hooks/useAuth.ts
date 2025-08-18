import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error, isFetching } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", {
        credentials: "include",
      });
      
      // Return null for 401/403 (not authenticated) instead of throwing
      if (res.status === 401 || res.status === 403) {
        return null;
      }
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return await res.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always refetch to get latest auth state
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

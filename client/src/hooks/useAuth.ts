import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error, isFetching } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always refetch to get latest auth state
  });

  // Consider user authenticated if we have user data and no 401/403 error
  const isAuthenticated = !!user && !error;
  
  // Show loading state during initial load or when refetching after login
  const isLoadingAuth = isLoading || (isFetching && !user);

  return {
    user,
    isLoading: isLoadingAuth,
    isAuthenticated,
  };
}

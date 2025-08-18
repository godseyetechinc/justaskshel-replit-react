import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always refetch to get latest auth state
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}

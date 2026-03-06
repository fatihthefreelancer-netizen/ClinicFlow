import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getAccessToken } from "@/lib/supabase";

export function useProfile() {
  const { data, isLoading, error } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(api.auth.me.path, { headers });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return api.auth.me.responses[200].parse(await res.json());
    },
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("401")) return false;
      return failureCount < 3;
    },
  });

  return {
    user: data?.user,
    role: data?.role,
    isLoading,
    isAuthenticated: !!data,
  };
}

import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getAccessToken } from "@/lib/supabase";

export function useAnalytics(dateRange: { startDate: string; endDate: string }) {
  const queryKey = [api.analytics.get.path, dateRange.startDate, dateRange.endDate];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams(dateRange);
      const url = `${api.analytics.get.path}?${params.toString()}`;
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch analytics");
      }
      const data = await res.json();
      return api.analytics.get.responses[200].parse(data);
    },
    retry: 1,
    staleTime: 5000,
  });
}

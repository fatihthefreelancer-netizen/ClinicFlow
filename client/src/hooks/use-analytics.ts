import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useAnalytics(dateRange: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: [api.analytics.get.path, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams(dateRange);
      const url = `${api.analytics.get.path}?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch analytics");
      }
      const data = await res.json();
      console.log("Analytics data received:", data);
      return api.analytics.get.responses[200].parse(data);
    },
    retry: 1,
  });
}

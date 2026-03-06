import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertVisit } from "@shared/schema";
import { getAccessToken } from "@/lib/supabase";

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export function useVisits(params?: { date?: string; startDate?: string; endDate?: string }) {
  const queryParams = params ? new URLSearchParams(params as any).toString() : "";
  const queryString = queryParams ? `?${queryParams}` : "";
  
  return useQuery({
    queryKey: [api.visits.list.path, params],
    queryFn: async () => {
      const url = api.visits.list.path + queryString;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch visits");
      return api.visits.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertVisit) => {
      const res = await fetch(api.visits.create.path, {
        method: api.visits.create.method,
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create visit");
      }
      return api.visits.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.visits.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.analytics.get.path] });
    },
  });
}

export function useUpdateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertVisit>) => {
      const url = buildUrl(api.visits.update.path, { id });
      const res = await fetch(url, {
        method: api.visits.update.method,
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update visit");
      return api.visits.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.visits.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.analytics.get.path] });
    },
  });
}

export function useDeleteVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.visits.delete.path, { id });
      const res = await fetch(url, {
        method: api.visits.delete.method,
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete visit");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.visits.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.analytics.get.path] });
    },
  });
}

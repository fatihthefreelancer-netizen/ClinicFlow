import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { supabase } from "@/lib/supabase";

export function useRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // We listen to the public 'visits' table for any INSERT, UPDATE, or DELETE operations.
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, and DELETE
          schema: 'public',
          table: 'visits',
        },
        (_payload) => {
          // Invalidate visits and analytics queries so TanStack Query triggers a refetch
          queryClient.invalidateQueries({ queryKey: [api.visits.list.path] });
          queryClient.invalidateQueries({ queryKey: [api.analytics.get.path] });
        }
      )
      .subscribe();

    return () => {
      // Clean up the subscription when the component unmounts
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ws, api } from "@shared/routes";
import type { Visit } from "@shared/schema";
import { useAuth } from "./use-auth";
import { supabase } from "@/lib/supabase";

export function useWebSocket() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const url = `${protocol}//${host}/ws`;

    const connect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify({ type: "AUTH", token: session.access_token }));
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          const invalidateAnalytics = () => {
            queryClient.invalidateQueries({ queryKey: [api.analytics.get.path] });
          };

          const updateResult = ws.receive.visitUpdate.safeParse(message);
          if (updateResult.success) {
            updateVisitInCache(updateResult.data.data);
            invalidateAnalytics();
            return;
          }

          const createResult = ws.receive.visitCreate.safeParse(message);
          if (createResult.success) {
            addVisitToCache(createResult.data.data);
            invalidateAnalytics();
            return;
          }

          const deleteResult = ws.receive.visitDelete.safeParse(message);
          if (deleteResult.success) {
            removeVisitFromCache(deleteResult.data.id);
            invalidateAnalytics();
            return;
          }

        } catch {
        }
      };

      socket.onclose = () => {
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [queryClient, user?.id]);

  const updateVisitInCache = (updatedVisit: Visit) => {
    queryClient.setQueriesData({ queryKey: [api.visits.list.path] }, (oldData: Visit[] | undefined) => {
      if (!oldData) return [updatedVisit];
      return oldData.map(v => v.id === updatedVisit.id ? updatedVisit : v);
    });
  };

  const addVisitToCache = (newVisit: Visit) => {
    queryClient.setQueriesData({ queryKey: [api.visits.list.path] }, (oldData: Visit[] | undefined) => {
      if (!oldData) return [newVisit];
      if (oldData.some(v => v.id === newVisit.id)) return oldData;
      return [...oldData, newVisit];
    });
  };

  const removeVisitFromCache = (id: number) => {
    queryClient.setQueriesData({ queryKey: [api.visits.list.path] }, (oldData: Visit[] | undefined) => {
      if (!oldData) return [];
      return oldData.filter(v => v.id !== id);
    });
  };
}

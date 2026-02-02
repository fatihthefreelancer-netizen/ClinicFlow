import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ws, api, type Visit } from "@shared/routes";
import { z } from "zod";

export function useWebSocket() {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Determine WS protocol based on current page protocol
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const url = `${protocol}//${host}/ws`;

    const connect = () => {
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle Visit Update
          const updateResult = ws.receive.visitUpdate.safeParse(message);
          if (updateResult.success) {
            updateVisitInCache(updateResult.data.data);
            return;
          }

          // Handle Visit Create
          const createResult = ws.receive.visitCreate.safeParse(message);
          if (createResult.success) {
            addVisitToCache(createResult.data.data);
            return;
          }

          // Handle Visit Delete
          const deleteResult = ws.receive.visitDelete.safeParse(message);
          if (deleteResult.success) {
            removeVisitFromCache(deleteResult.data.id);
            return;
          }

        } catch (err) {
          console.error("Failed to parse WS message", err);
        }
      };

      socket.onclose = () => {
        // Simple reconnect logic with delay
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [queryClient]);

  // Helper to optimistically update cache
  const updateVisitInCache = (updatedVisit: Visit) => {
    queryClient.setQueriesData({ queryKey: [api.visits.list.path] }, (oldData: Visit[] | undefined) => {
      if (!oldData) return [updatedVisit];
      return oldData.map(v => v.id === updatedVisit.id ? updatedVisit : v);
    });
  };

  const addVisitToCache = (newVisit: Visit) => {
    queryClient.setQueriesData({ queryKey: [api.visits.list.path] }, (oldData: Visit[] | undefined) => {
      if (!oldData) return [newVisit];
      // Check if already exists to prevent duplicates
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

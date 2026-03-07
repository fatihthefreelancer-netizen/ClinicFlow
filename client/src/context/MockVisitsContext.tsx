import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { mockVisitsByDate, type MockVisit } from "../../data/mockVisits";

/** Visit-like type used by the UI; arrivalTime can be string (mock) or Date. */
export type VisitLike = Omit<MockVisit, "arrivalTime"> & { arrivalTime: string | Date };

function deepCopyByDate(): Record<string, MockVisit[]> {
  const next: Record<string, MockVisit[]> = {};
  for (const [date, list] of Object.entries(mockVisitsByDate)) {
    next[date] = list.map((v) => ({ ...v }));
  }
  return next;
}

function findVisitAndDate(data: Record<string, MockVisit[]>, id: number): { visit: MockVisit; date: string } | null {
  for (const [date, list] of Object.entries(data)) {
    const visit = list.find((v) => v.id === id);
    if (visit) return { visit, date };
  }
  return null;
}

type MockVisitsContextValue = {
  getVisitsForDate: (date: string) => VisitLike[];
  addVisit: (date: string, data: Omit<MockVisit, "id" | "accountId" | "arrivalTime" | "visitDate"> & { price?: number | null; nextStep?: string | null; lastUpdatedBy?: string | null }) => VisitLike;
  updateVisit: (id: number, data: Partial<MockVisit>) => void;
  deleteVisit: (id: number) => void;
  getAllVisits: () => VisitLike[];
  getVisitsInRange: (startDate: string, endDate: string) => VisitLike[];
};

const MockVisitsContext = createContext<MockVisitsContextValue | null>(null);

let nextId = 1000;

export function MockVisitsProvider({ children }: { children: React.ReactNode }) {
  const [byDate, setByDate] = useState<Record<string, MockVisit[]>>(deepCopyByDate);

  const getVisitsForDate = useCallback(
    (date: string): VisitLike[] => {
      const list = byDate[date] ?? [];
      return [...list].sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime));
    },
    [byDate]
  );

  const addVisit = useCallback(
    (date: string, data: Omit<MockVisit, "id" | "accountId" | "arrivalTime" | "visitDate">): VisitLike => {
      const now = new Date();
      const arrivalIso = now.toISOString();
      const id = nextId++;
      const newVisit: MockVisit = {
        id,
        accountId: "mock-account",
        patientName: data.patientName,
        phoneNumber: data.phoneNumber ?? null,
        age: data.age ?? null,
        mutuelle: data.mutuelle ?? "Non",
        mutuelleRemplie: data.mutuelleRemplie ?? "Non",
        arrivalTime: arrivalIso,
        condition: data.condition,
        status: data.status ?? "waiting",
        price: data.price ?? null,
        nextStep: data.nextStep ?? null,
        lastUpdatedBy: null,
        visitDate: date,
      };
      setByDate((prev) => {
        const next = { ...prev };
        const list = next[date] ?? [];
        next[date] = [...list, newVisit];
        return next;
      });
      return newVisit;
    },
    []
  );

  const updateVisit = useCallback((id: number, data: Partial<MockVisit>) => {
    setByDate((prev) => {
      const found = findVisitAndDate(prev, id);
      if (!found) return prev;
      const next = { ...prev };
      const list = [...(next[found.date] ?? [])];
      const idx = list.findIndex((v) => v.id === id);
      if (idx === -1) return prev;
      list[idx] = { ...list[idx], ...data };
      next[found.date] = list;
      return next;
    });
  }, []);

  const deleteVisit = useCallback((id: number) => {
    setByDate((prev) => {
      const found = findVisitAndDate(prev, id);
      if (!found) return prev;
      const next = { ...prev };
      next[found.date] = (next[found.date] ?? []).filter((v) => v.id !== id);
      return next;
    });
  }, []);

  const getAllVisits = useCallback((): VisitLike[] => {
    const out: VisitLike[] = [];
    for (const list of Object.values(byDate)) {
      out.push(...list);
    }
    return out;
  }, [byDate]);

  const getVisitsInRange = useCallback(
    (startDate: string, endDate: string): VisitLike[] => {
      const out: VisitLike[] = [];
      for (const [date, list] of Object.entries(byDate)) {
        if (date >= startDate && date <= endDate) out.push(...list);
      }
      return out;
    },
    [byDate]
  );

  const value = useMemo(
    () => ({
      getVisitsForDate,
      addVisit,
      updateVisit,
      deleteVisit,
      getAllVisits,
      getVisitsInRange,
    }),
    [getVisitsForDate, addVisit, updateVisit, deleteVisit, getAllVisits, getVisitsInRange]
  );

  return <MockVisitsContext.Provider value={value}>{children}</MockVisitsContext.Provider>;
}

export function useMockVisits(): MockVisitsContextValue {
  const ctx = useContext(MockVisitsContext);
  if (!ctx) throw new Error("useMockVisits must be used within MockVisitsProvider");
  return ctx;
}

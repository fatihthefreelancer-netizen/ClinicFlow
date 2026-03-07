import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { MockVisit } from "../../data/mockVisits";
import * as visitsService from "@/services/visitsService";

/** Visit-like type used by the UI; arrivalTime can be string (mock) or Date. */
export type VisitLike = Omit<MockVisit, "arrivalTime"> & { arrivalTime: string | Date };

type AddVisitData = Omit<MockVisit, "id" | "accountId" | "arrivalTime" | "visitDate"> & {
  price?: number | null;
  nextStep?: string | null;
  lastUpdatedBy?: string | null;
};

type MockVisitsContextValue = {
  getVisitsForDate: (date: string) => VisitLike[];
  getVisitsInRange: (startDate: string, endDate: string) => VisitLike[];
  loadVisitsForDate: (date: string) => Promise<void>;
  loadVisitsInRange: (startDate: string, endDate: string) => Promise<void>;
  isLoadingDate: boolean;
  isLoadingRange: boolean;
  addVisit: (date: string, data: AddVisitData) => Promise<VisitLike>;
  updateVisit: (id: number, data: Partial<VisitLike>, refetchDate?: string) => Promise<void>;
  deleteVisit: (id: number, refetchDate?: string) => Promise<void>;
  getAllVisits: () => VisitLike[];
};

const MockVisitsContext = createContext<MockVisitsContextValue | null>(null);

export function MockVisitsProvider({ children }: { children: React.ReactNode }) {
  const [cacheByDate, setCacheByDate] = useState<Record<string, visitsService.VisitDTO[]>>({});
  const [rangeCache, setRangeCache] = useState<Record<string, visitsService.VisitDTO[]>>({});
  const [isLoadingDate, setIsLoadingDate] = useState(false);
  const [isLoadingRange, setIsLoadingRange] = useState(false);

  const loadVisitsForDate = useCallback(async (date: string) => {
    console.log("========== CONTEXT: loadVisitsForDate ==========");
    console.log("DATE:", date);
    setIsLoadingDate(true);
    try {
      const list = await visitsService.getVisitsForDate(date);
      console.log("CONTEXT: loadVisitsForDate RESULT - count:", list.length, "data:", list);
      setCacheByDate((prev) => ({ ...prev, [date]: list }));
    } catch (err) {
      console.error("CONTEXT: loadVisitsForDate ERROR:", err);
      throw err;
    } finally {
      setIsLoadingDate(false);
    }
  }, []);

  const loadVisitsInRange = useCallback(async (startDate: string, endDate: string) => {
    console.log("========== CONTEXT: loadVisitsInRange ==========");
    console.log("START DATE:", startDate, "END DATE:", endDate);
    const key = `${startDate}-${endDate}`;
    setIsLoadingRange(true);
    try {
      const list = await visitsService.getVisitsInRange(startDate, endDate);
      console.log("CONTEXT: loadVisitsInRange RESULT - count:", list.length);
      setRangeCache((prev) => ({ ...prev, [key]: list }));
    } catch (err) {
      console.error("CONTEXT: loadVisitsInRange ERROR:", err);
      throw err;
    } finally {
      setIsLoadingRange(false);
    }
  }, []);

  const getVisitsForDate = useCallback(
    (date: string): VisitLike[] => {
      const list = cacheByDate[date] ?? [];
      return [...list].sort((a, b) => String(a.arrivalTime).localeCompare(String(b.arrivalTime))) as VisitLike[];
    },
    [cacheByDate]
  );

  const getVisitsInRange = useCallback(
    (startDate: string, endDate: string): VisitLike[] => {
      const key = `${startDate}-${endDate}`;
      return (rangeCache[key] ?? []) as VisitLike[];
    },
    [rangeCache]
  );

  const addVisit = useCallback(async (date: string, data: AddVisitData): Promise<VisitLike> => {
    console.log("========== CONTEXT: addVisit ==========");
    console.log("DATE:", date);
    console.log("ADD VISIT DATA:", data);
    const created = await visitsService.createVisit(date, {
      patientName: data.patientName,
      phoneNumber: data.phoneNumber ?? null,
      age: data.age ?? null,
      mutuelle: data.mutuelle ?? "Non",
      mutuelleRemplie: data.mutuelleRemplie ?? "Non",
      condition: data.condition,
      status: data.status ?? "waiting",
      price: data.price ?? null,
      nextStep: data.nextStep ?? null,
    });
    console.log("CONTEXT: addVisit CREATED:", created);
    await loadVisitsForDate(date);
    return created as VisitLike;
  }, [loadVisitsForDate]);

  const updateVisit = useCallback(
    async (id: number, data: Partial<VisitLike>, refetchDate?: string): Promise<void> => {
      console.log("========== CONTEXT: updateVisit ==========");
      console.log("VISIT ID:", id);
      console.log("UPDATE DATA:", data);
      const dto: Partial<visitsService.VisitDTO> = {};
      if (data.patientName !== undefined) dto.patientName = data.patientName;
      if (data.phoneNumber !== undefined) dto.phoneNumber = data.phoneNumber;
      if (data.age !== undefined) dto.age = data.age;
      if (data.mutuelle !== undefined) dto.mutuelle = data.mutuelle;
      if (data.mutuelleRemplie !== undefined) dto.mutuelleRemplie = data.mutuelleRemplie;
      if (data.condition !== undefined) dto.condition = data.condition;
      if (data.status !== undefined) dto.status = data.status;
      if (data.price !== undefined) dto.price = data.price;
      if (data.nextStep !== undefined) dto.nextStep = data.nextStep;
      console.log("CONTEXT: updateVisit DTO:", dto);
      await visitsService.updateVisit(id, dto);
      console.log("CONTEXT: updateVisit SUCCESS");
      if (refetchDate) await loadVisitsForDate(refetchDate);
    },
    [loadVisitsForDate]
  );

  const deleteVisit = useCallback(
    async (id: number, refetchDate?: string): Promise<void> => {
      console.log("========== CONTEXT: deleteVisit ==========");
      console.log("VISIT ID:", id);
      await visitsService.deleteVisit(id);
      console.log("CONTEXT: deleteVisit SUCCESS");
      if (refetchDate) await loadVisitsForDate(refetchDate);
    },
    [loadVisitsForDate]
  );

  const getAllVisits = useCallback((): VisitLike[] => {
    const out: VisitLike[] = [];
    for (const list of Object.values(cacheByDate)) {
      out.push(...(list as VisitLike[]));
    }
    return out;
  }, [cacheByDate]);

  const value = useMemo(
    () => ({
      getVisitsForDate,
      getVisitsInRange,
      loadVisitsForDate,
      loadVisitsInRange,
      isLoadingDate,
      isLoadingRange,
      addVisit,
      updateVisit,
      deleteVisit,
      getAllVisits,
    }),
    [
      getVisitsForDate,
      getVisitsInRange,
      loadVisitsForDate,
      loadVisitsInRange,
      isLoadingDate,
      isLoadingRange,
      addVisit,
      updateVisit,
      deleteVisit,
      getAllVisits,
    ]
  );

  return <MockVisitsContext.Provider value={value}>{children}</MockVisitsContext.Provider>;
}

export function useMockVisits(): MockVisitsContextValue {
  const ctx = useContext(MockVisitsContext);
  if (!ctx) throw new Error("useMockVisits must be used within MockVisitsProvider");
  return ctx;
}

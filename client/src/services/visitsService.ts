/**
 * Visits data service — Supabase CRUD for the "visits" table.
 * Real schema: id, uid, patient_name, phone, age, condition, status,
 * mutuelle, mutuelle_remplie, price, next_step, arrival_time, created_at, last_updated.
 * Maps between DB snake_case and UI camelCase. Used by the visits context.
 */

import { supabase } from "@/lib/supabase";

/** Supabase row shape (snake_case) — matches real schema */
type VisitRow = {
  id: number;
  uid: string | null;
  patient_name: string;
  phone: string | null;
  age: number | null;
  mutuelle: string;
  mutuelle_remplie: string;
  arrival_time: string;
  condition: string;
  status: string;
  price: number | null;
  next_step: string | null;
  created_at: string | null;
  last_updated: string | null;
};

/** UI shape (camelCase) — matches VisitLike from context; visitDate derived from arrival_time */
export type VisitDTO = {
  id: number;
  accountId: string | null;
  patientName: string;
  phoneNumber: string | null;
  age: number | null;
  mutuelle: string;
  mutuelleRemplie: string;
  arrivalTime: string;
  condition: string;
  status: string;
  price: number | null;
  nextStep: string | null;
  lastUpdatedBy: string | null;
  visitDate: string;
};

function rowToDTO(row: VisitRow): VisitDTO {
  const arrivalTime = row.arrival_time ?? "";
  const visitDate = arrivalTime ? arrivalTime.slice(0, 10) : "";
  return {
    id: row.id,
    accountId: row.uid ?? null,
    patientName: row.patient_name,
    phoneNumber: row.phone ?? null,
    age: row.age ?? null,
    mutuelle: row.mutuelle,
    mutuelleRemplie: row.mutuelle_remplie,
    arrivalTime,
    condition: row.condition,
    status: row.status,
    price: row.price ?? null,
    nextStep: row.next_step ?? null,
    lastUpdatedBy: null,
    visitDate,
  };
}

/** Start of day (UTC) for a YYYY-MM-DD date string */
function startOfDay(date: string): string {
  return `${date}T00:00:00.000Z`;
}

/** End of day (UTC) for a YYYY-MM-DD date string */
function endOfDay(date: string): string {
  return `${date}T23:59:59.999Z`;
}

/** Get visits for a single day (by arrival_time range). Returns UI format. */
export async function getVisitsForDate(date: string): Promise<VisitDTO[]> {
  const startOfDayIso = startOfDay(date);
  const endOfDayIso = endOfDay(date);
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .gte("arrival_time", startOfDayIso)
    .lte("arrival_time", endOfDayIso)
    .order("arrival_time", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToDTO);
}

/** Get visits in a date range (inclusive, by arrival_time). For dashboard. */
export async function getVisitsInRange(startDate: string, endDate: string): Promise<VisitDTO[]> {
  const startOfDayIso = startOfDay(startDate);
  const endOfDayIso = endOfDay(endDate);
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .gte("arrival_time", startOfDayIso)
    .lte("arrival_time", endOfDayIso)
    .order("arrival_time", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToDTO);
}

/** Insert payload (camelCase) — uid set from session; arrival_time set to current time. */
export type CreateVisitInput = {
  patientName: string;
  phoneNumber?: string | null;
  age?: number | null;
  mutuelle?: string;
  mutuelleRemplie?: string;
  condition: string;
  status?: string;
  price?: number | null;
  nextStep?: string | null;
};

export async function createVisit(date: string, input: CreateVisitInput): Promise<VisitDTO> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session?.user?.id) throw new Error("Non authentifié");

  const row = {
    uid: session.user.id,
    patient_name: input.patientName,
    phone: input.phoneNumber ?? null,
    age: input.age ?? null,
    mutuelle: input.mutuelle ?? "Non",
    mutuelle_remplie: input.mutuelleRemplie ?? "Non",
    condition: input.condition,
    status: input.status ?? "En attente",
    price: input.price ?? null,
    next_step: input.nextStep ?? null,
    arrival_time: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("visits").insert(row).select().single();
  if (error) throw error;
  return rowToDTO(data as VisitRow);
}

/** Update by id. Partial camelCase fields. last_updated is set by DB trigger. */
export async function updateVisit(id: number, updates: Partial<VisitDTO>): Promise<VisitDTO> {
  const row: Record<string, unknown> = {};
  if (updates.patientName !== undefined) row.patient_name = updates.patientName;
  if (updates.phoneNumber !== undefined) row.phone = updates.phoneNumber;
  if (updates.age !== undefined) row.age = updates.age;
  if (updates.mutuelle !== undefined) row.mutuelle = updates.mutuelle;
  if (updates.mutuelleRemplie !== undefined) row.mutuelle_remplie = updates.mutuelleRemplie;
  if (updates.condition !== undefined) row.condition = updates.condition;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.price !== undefined) row.price = updates.price;
  if (updates.nextStep !== undefined) row.next_step = updates.nextStep;

  if (Object.keys(row).length === 0) {
    throw new Error("No fields to update");
  }
  const { data, error } = await supabase.from("visits").update(row).eq("id", id).select().single();
  if (error) throw error;
  return rowToDTO(data as VisitRow);
}

/** Delete by id. */
export async function deleteVisit(id: number): Promise<void> {
  const { error } = await supabase.from("visits").delete().eq("id", id);
  if (error) throw error;
}

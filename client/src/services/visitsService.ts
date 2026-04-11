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
  console.log("========== QUERY: getVisitsForDate ==========");
  console.log("QUERY START");
  console.log("TABLE: visits");
  console.log("OPERATION: select");
  console.log("FILTERS:", { date, gte: startOfDay(date), lte: endOfDay(date) });

  // Log current session before query
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  console.log("SESSION USER ID (before query):", currentSession?.user?.id);
  console.log("SESSION EXISTS (before query):", !!currentSession);
  console.log("ACCESS TOKEN PRESENT (before query):", !!currentSession?.access_token);

  const startOfDayIso = startOfDay(date);
  const endOfDayIso = endOfDay(date);
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .gte("arrival_time", startOfDayIso)
    .lte("arrival_time", endOfDayIso)
    .order("arrival_time", { ascending: true });

  console.log("QUERY RESULT DATA:", data);
  console.log("QUERY RESULT DATA LENGTH:", data?.length);
  console.log("QUERY ERROR:", error);
  if (error) {
    console.error("ERROR MESSAGE:", error?.message);
    console.error("ERROR CODE:", error?.code);
    console.error("ERROR DETAILS:", error?.details);
    console.error("ERROR HINT:", error?.hint);
    throw error;
  }
  console.log("========== END QUERY: getVisitsForDate ==========");
  return (data ?? []).map(rowToDTO);
}

/** Get visits in a date range (inclusive, by arrival_time). For dashboard. */
export async function getVisitsInRange(startDate: string, endDate: string): Promise<VisitDTO[]> {
  console.log("========== QUERY: getVisitsInRange ==========");
  console.log("QUERY START");
  console.log("TABLE: visits");
  console.log("OPERATION: select");
  console.log("FILTERS:", { startDate, endDate, gte: startOfDay(startDate), lte: endOfDay(endDate) });

  // Log current session before query
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  console.log("SESSION USER ID (before query):", currentSession?.user?.id);
  console.log("SESSION EXISTS (before query):", !!currentSession);
  console.log("ACCESS TOKEN PRESENT (before query):", !!currentSession?.access_token);

  const startOfDayIso = startOfDay(startDate);
  const endOfDayIso = endOfDay(endDate);
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .gte("arrival_time", startOfDayIso)
    .lte("arrival_time", endOfDayIso)
    .order("arrival_time", { ascending: true });

  console.log("QUERY RESULT DATA:", data);
  console.log("QUERY RESULT DATA LENGTH:", data?.length);
  console.log("QUERY ERROR:", error);
  if (error) {
    console.error("ERROR MESSAGE:", error?.message);
    console.error("ERROR CODE:", error?.code);
    console.error("ERROR DETAILS:", error?.details);
    console.error("ERROR HINT:", error?.hint);
    throw error;
  }
  console.log("========== END QUERY: getVisitsInRange ==========");
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
  console.log("========== QUERY: createVisit ==========");
  console.log("CREATE VISIT FUNCTION CALLED");
  console.log("QUERY START");
  console.log("TABLE: visits");
  console.log("OPERATION: insert");
  console.log("INPUT:", input);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  console.log("========== RLS CONTEXT CHECK (createVisit) ==========");
  console.log("SESSION OBJECT:", session);
  console.log("SESSION EXISTS:", !!session);
  console.log("SESSION ERROR:", sessionError);
  console.log("AUTH USER:", session?.user);
  console.log("AUTH USER ID:", session?.user?.id);
  console.log("AUTH USER EMAIL:", session?.user?.email);
  console.log("ACCESS TOKEN PRESENT:", !!session?.access_token);
  console.log("ACCESS TOKEN (first 20 chars):", session?.access_token?.substring(0, 20));

  if (sessionError || !session?.user?.id) {
    console.error("AUTHENTICATION CHECK FAILED");
    console.error("SESSION:", session);
    console.error("SESSION ERROR:", sessionError);
    console.error("USER ID PRESENT:", !!session?.user?.id);
    throw new Error("Non authentifié");
  }

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

  console.log("PAYLOAD (row to insert):", row);
  console.log("SESSION USER ID:", session.user.id);
  console.log("UID SENT TO DATABASE:", row.uid);
  console.log("UID MATCH:", row.uid === session.user.id);

  // Also call getUser() to verify token-based identity
  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.log("getUser() USER:", userData?.user);
  console.log("getUser() USER ID:", userData?.user?.id);
  console.log("getUser() ERROR:", userError);
  console.log("getUser() ID MATCHES SESSION ID:", userData?.user?.id === session.user.id);

  console.log("EXECUTING INSERT QUERY NOW...");
  const { data, error } = await supabase.from("visits").insert(row).select().single();

  console.log("QUERY RESULT DATA:", data);
  console.log("QUERY ERROR:", error);
  if (error) {
    console.error("INSERT FAILED!");
    console.error("ERROR MESSAGE:", error?.message);
    console.error("ERROR CODE:", error?.code);
    console.error("ERROR DETAILS:", error?.details);
    console.error("ERROR HINT:", error?.hint);
    console.error("ERROR STATUS:", (error as any)?.status);
    console.error("FULL ERROR OBJECT:", JSON.stringify(error, null, 2));
    throw error;
  }
  console.log("INSERT SUCCESS - returned row:", data);
  console.log("========== END QUERY: createVisit ==========");
  return rowToDTO(data as VisitRow);
}

/** Update by id. Partial camelCase fields. last_updated is set by DB trigger. */
export async function updateVisit(id: number, updates: Partial<VisitDTO>): Promise<VisitDTO> {
  console.log("========== QUERY: updateVisit ==========");
  console.log("QUERY START");
  console.log("TABLE: visits");
  console.log("OPERATION: update");
  console.log("VISIT ID:", id);
  console.log("UPDATES:", updates);

  // Log current session before query
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  console.log("SESSION USER ID (before update):", currentSession?.user?.id);
  console.log("SESSION EXISTS (before update):", !!currentSession);
  console.log("ACCESS TOKEN PRESENT (before update):", !!currentSession?.access_token);

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

  console.log("PAYLOAD (row to update):", row);

  if (Object.keys(row).length === 0) {
    console.error("UPDATE ERROR: No fields to update");
    throw new Error("No fields to update");
  }

  console.log("EXECUTING UPDATE QUERY NOW...");
  const { data, error } = await supabase.from("visits").update(row).eq("id", id).select().single();

  console.log("QUERY RESULT DATA:", data);
  console.log("QUERY ERROR:", error);
  if (error) {
    console.error("UPDATE FAILED!");
    console.error("ERROR MESSAGE:", error?.message);
    console.error("ERROR CODE:", error?.code);
    console.error("ERROR DETAILS:", error?.details);
    console.error("ERROR HINT:", error?.hint);
    throw error;
  }
  console.log("UPDATE SUCCESS - returned row:", data);
  console.log("========== END QUERY: updateVisit ==========");
  return rowToDTO(data as VisitRow);
}

/** Delete by id. */
export async function deleteVisit(id: number): Promise<void> {
  console.log("========== QUERY: deleteVisit ==========");
  console.log("QUERY START");
  console.log("TABLE: visits");
  console.log("OPERATION: delete");
  console.log("VISIT ID:", id);

  // Log current session before query
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  console.log("SESSION USER ID (before delete):", currentSession?.user?.id);
  console.log("SESSION EXISTS (before delete):", !!currentSession);
  console.log("ACCESS TOKEN PRESENT (before delete):", !!currentSession?.access_token);

  console.log("EXECUTING DELETE QUERY NOW...");
  const { error } = await supabase.from("visits").delete().eq("id", id);

  console.log("QUERY ERROR:", error);
  if (error) {
    console.error("DELETE FAILED!");
    console.error("ERROR MESSAGE:", error?.message);
    console.error("ERROR CODE:", error?.code);
    console.error("ERROR DETAILS:", error?.details);
    console.error("ERROR HINT:", error?.hint);
    throw error;
  }
  console.log("DELETE SUCCESS");
  console.log("========== END QUERY: deleteVisit ==========");
}

/** Search patients by name for auto-complete (returns unique recent patients) */
export async function searchPatientsByName(query: string): Promise<VisitDTO[]> {
  console.log("========== QUERY: searchPatientsByName ==========");
  console.log("QUERY START");
  console.log("FILTERS:", { query: `%${query}%` });

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.user?.id) {
    console.error("AUTHENTICATION CHECK FAILED in searchPatientsByName");
    throw new Error("Non authentifié");
  }

  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .ilike("patient_name", `%${query}%`)
    .eq("uid", session.user.id)
    .order("arrival_time", { ascending: false })
    .limit(10);

  if (error) {
    console.error("ERROR in searchPatientsByName:", error?.message);
    throw error;
  }
  
  // Return the MOST RECENT record per patient (avoid duplicates)
  const uniquePatients = new Map<string, VisitRow>();
  if (data) {
    for (const row of data as VisitRow[]) {
      const lowerName = row.patient_name.toLowerCase();
      if (!uniquePatients.has(lowerName)) {
        uniquePatients.set(lowerName, row);
      }
    }
  }

  console.log("========== END QUERY: searchPatientsByName ==========");
  return Array.from(uniquePatients.values()).map(rowToDTO);
}

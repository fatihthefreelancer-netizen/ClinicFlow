import { db } from "./db";
import { visits, type InsertVisit, type UpdateVisitRequest, type Visit } from "../../shared/schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

export async function getVisits(options?: {
  date?: string;
  startDate?: string;
  endDate?: string;
  accountId?: string;
}): Promise<Visit[]> {
  const conditions: any[] = [];

  if (options?.accountId) {
    conditions.push(eq(visits.accountId, options.accountId as any));
  }

  if (options?.date) {
    conditions.push(eq(visits.visitDate, options.date as any));
  } else if (options?.startDate && options?.endDate) {
    conditions.push(gte(visits.visitDate, options.startDate as any));
    conditions.push(lte(visits.visitDate, options.endDate as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  return await db.select().from(visits).where(whereClause).orderBy(desc(visits.arrivalTime));
}

export async function getVisit(id: number): Promise<Visit | undefined> {
  const [visit] = await db.select().from(visits).where(eq(visits.id, id));
  return visit;
}

export async function createVisit(visit: InsertVisit & { accountId: string }): Promise<Visit> {
  const [newVisit] = await db.insert(visits).values(visit as any).returning();
  return newVisit;
}

export async function updateVisit(id: number, updates: UpdateVisitRequest): Promise<Visit> {
  const [updatedVisit] = await db.update(visits).set(updates as any).where(eq(visits.id, id)).returning();
  return updatedVisit;
}

export async function deleteVisit(id: number): Promise<void> {
  await db.delete(visits).where(eq(visits.id, id));
}

export async function getAnalytics(startDate: string, endDate: string, accountId?: string): Promise<{
  totalPatients: number;
  totalRevenue: number;
  averagePrice: number;
  patientsPerDay: { date: string; total: number; mutuelle: number; mutuelleRemplie: number }[];
}> {
  const baseConditions: any[] = [
    gte(visits.visitDate, startDate as any),
    lte(visits.visitDate, endDate as any),
    sql`${visits.status} IN ('waiting', 'in_consultation', 'done')`,
  ];

  if (accountId) {
    baseConditions.push(eq(visits.accountId, accountId as any));
  }

  const result = await db
    .select({
      count: sql<number>`count(*)`,
      revenue: sql<number>`sum(${visits.price})`,
      avgPrice: sql<number>`avg(${visits.price})`,
    })
    .from(visits)
    .where(and(...baseConditions));

  const stats = result[0] || { count: 0, revenue: 0, avgPrice: 0 };

  const dailyStats = await db
    .select({
      date: visits.visitDate,
      total: sql<number>`count(*)`,
      mutuelle: sql<number>`count(*) filter (where ${visits.mutuelle} = 'Oui')`,
      mutuelleRemplie: sql<number>`count(*) filter (where ${visits.mutuelle} = 'Oui' and ${visits.mutuelleRemplie} = 'Oui')`,
    })
    .from(visits)
    .where(and(...baseConditions))
    .groupBy(visits.visitDate)
    .orderBy(visits.visitDate);

  return {
    totalPatients: Number(stats.count || 0),
    totalRevenue: Number(stats.revenue || 0),
    averagePrice: Number(stats.avgPrice || 0),
    patientsPerDay: dailyStats.map((d) => ({
      date: String(d.date),
      total: Number(d.total),
      mutuelle: Number(d.mutuelle),
      mutuelleRemplie: Number(d.mutuelleRemplie),
    })),
  };
}


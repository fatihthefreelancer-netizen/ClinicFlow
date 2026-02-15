import { db } from "./db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { 
  users, profiles, visits, 
  type User, type Profile, type InsertProfile,
  type Visit, type InsertVisit, type UpdateVisitRequest
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  
  getVisits(options?: { date?: string; startDate?: string; endDate?: string; accountId?: string }): Promise<Visit[]>;
  getVisit(id: number): Promise<Visit | undefined>;
  createVisit(visit: InsertVisit & { accountId: string }): Promise<Visit>;
  updateVisit(id: number, visit: UpdateVisitRequest): Promise<Visit>;
  deleteVisit(id: number): Promise<void>;
  
  getAnalytics(startDate: string, endDate: string, accountId?: string): Promise<{
    totalPatients: number;
    totalRevenue: number;
    averagePrice: number;
    patientsPerDay: { date: string; total: number; mutuelle: number; mutuelleRemplie: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  async getVisits(options?: { date?: string; startDate?: string; endDate?: string; accountId?: string }): Promise<Visit[]> {
    const conditions = [];

    if (options?.accountId) {
      conditions.push(eq(visits.accountId, options.accountId));
    }

    if (options?.date) {
      conditions.push(eq(visits.visitDate, options.date));
    } else if (options?.startDate && options?.endDate) {
      conditions.push(gte(visits.visitDate, options.startDate));
      conditions.push(lte(visits.visitDate, options.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db.select().from(visits).where(whereClause).orderBy(desc(visits.arrivalTime));
  }

  async getVisit(id: number): Promise<Visit | undefined> {
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    return visit;
  }

  async createVisit(visit: InsertVisit & { accountId: string }): Promise<Visit> {
    const [newVisit] = await db.insert(visits).values(visit).returning();
    return newVisit;
  }

  async updateVisit(id: number, updates: UpdateVisitRequest): Promise<Visit> {
    const [updatedVisit] = await db
      .update(visits)
      .set(updates)
      .where(eq(visits.id, id))
      .returning();
    return updatedVisit;
  }

  async deleteVisit(id: number): Promise<void> {
    await db.delete(visits).where(eq(visits.id, id));
  }

  async getAnalytics(startDate: string, endDate: string, accountId?: string) {
    try {
      const validStatuses = ["waiting", "in_consultation", "done"];

      const baseConditions = [
        gte(visits.visitDate, startDate),
        lte(visits.visitDate, endDate),
        sql`${visits.status} IN ('waiting', 'in_consultation', 'done')`
      ];

      if (accountId) {
        baseConditions.push(eq(visits.accountId, accountId) as any);
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
        patientsPerDay: dailyStats.map(d => ({
          date: String(d.date),
          total: Number(d.total),
          mutuelle: Number(d.mutuelle),
          mutuelleRemplie: Number(d.mutuelleRemplie)
        }))
      };
    } catch (error) {
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();

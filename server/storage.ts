import { db } from "./db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { 
  users, profiles, visits, 
  type User, type Profile, type InsertProfile,
  type Visit, type InsertVisit, type UpdateVisitRequest
} from "@shared/schema";
import { authStorage } from "./replit_integrations/auth/storage";

export interface IStorage {
  // Auth & Profile
  getUser(id: string): Promise<User | undefined>;
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  
  // Visits
  getVisits(options?: { date?: string; startDate?: string; endDate?: string }): Promise<Visit[]>;
  getVisit(id: number): Promise<Visit | undefined>;
  createVisit(visit: InsertVisit): Promise<Visit>;
  updateVisit(id: number, visit: UpdateVisitRequest): Promise<Visit>;
  deleteVisit(id: number): Promise<void>;
  
  // Analytics
  getAnalytics(startDate: string, endDate: string): Promise<{
    totalPatients: number;
    totalRevenue: number;
    averagePrice: number;
    patientsPerDay: { date: string; count: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // Delegate user methods to authStorage or implement directly
  async getUser(id: string): Promise<User | undefined> {
    return authStorage.getUser(id);
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  async getVisits(options?: { date?: string; startDate?: string; endDate?: string }): Promise<Visit[]> {
    let query = db.select().from(visits);

    if (options?.date) {
      query = query.where(eq(visits.visitDate, options.date)) as any;
    } else if (options?.startDate && options?.endDate) {
      query = query.where(
        and(
          gte(visits.visitDate, options.startDate),
          lte(visits.visitDate, options.endDate)
        )
      ) as any;
    }

    // Default order by arrival time
    return await query.orderBy(desc(visits.arrivalTime));
  }

  async getVisit(id: number): Promise<Visit | undefined> {
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    return visit;
  }

  async createVisit(visit: InsertVisit): Promise<Visit> {
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

  async getAnalytics(startDate: string, endDate: string) {
    try {
      const result = await db
        .select({
          count: sql<number>`count(*)`,
          revenue: sql<number>`sum(${visits.price})`,
          avgPrice: sql<number>`avg(${visits.price})`,
        })
        .from(visits)
        .where(
          and(
            gte(visits.visitDate, startDate),
            lte(visits.visitDate, endDate)
          )
        );

      const stats = result[0] || { count: 0, revenue: 0, avgPrice: 0 };

      const dailyStats = await db
        .select({
          date: visits.visitDate,
          count: sql<number>`count(*)`,
        })
        .from(visits)
        .where(
          and(
            gte(visits.visitDate, startDate),
            lte(visits.visitDate, endDate)
          )
        )
        .groupBy(visits.visitDate)
        .orderBy(visits.visitDate);

      return {
        totalPatients: Number(stats.count || 0),
        totalRevenue: Number(stats.revenue || 0),
        averagePrice: Number(stats.avgPrice || 0),
        patientsPerDay: dailyStats.map(d => ({
          date: String(d.date),
          count: Number(d.count)
        }))
      };
    } catch (error) {
      console.error("Database analytics error:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();

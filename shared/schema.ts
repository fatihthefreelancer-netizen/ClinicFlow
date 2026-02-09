import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./models/auth";

// Export everything from auth
export * from "./models/auth";

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["doctor", "assistant"] }).notNull().default("assistant"),
});

export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  phoneNumber: text("phone_number"),
  age: integer("age"),
  mutuelle: text("mutuelle", { enum: ["Oui", "Non"] }).notNull().default("Non"),
  mutuelleRemplie: text("mutuelle_remplie", { enum: ["Oui", "Non"] }).notNull().default("Non"),
  arrivalTime: timestamp("arrival_time", { withTimezone: true }).defaultNow().notNull(),
  condition: text("condition").notNull(),
  status: text("status", { enum: ["waiting", "in_consultation", "done", "left"] }).notNull().default("waiting"),
  price: integer("price"), // Stored in cents or just raw number
  nextStep: text("next_step"),
  lastUpdatedBy: text("last_updated_by").references(() => users.id), // User ID of who last updated it
  visitDate: date("visit_date").defaultNow().notNull(), // To easily query by day
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertVisitSchema = createInsertSchema(visits).omit({ id: true, arrivalTime: true, visitDate: true });

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Visit = typeof visits.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;

// API Types
export type CreateVisitRequest = InsertVisit;
export type UpdateVisitRequest = Partial<InsertVisit>;

export type VisitResponse = Visit & { lastUpdatedByName?: string }; // Enriched with user name

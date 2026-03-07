import { pgTable, text, serial, integer, timestamp, date, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  role: text("role", { enum: ["doctor", "assistant"] }).notNull().default("assistant"),
});

export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  accountId: uuid("account_id"),
  patientName: text("patient_name").notNull(),
  phoneNumber: text("phone_number"),
  age: integer("age"),
  mutuelle: text("mutuelle", { enum: ["Oui", "Non"] }).notNull().default("Non"),
  mutuelleRemplie: text("mutuelle_remplie", { enum: ["Oui", "Non"] }).notNull().default("Non"),
  arrivalTime: timestamp("arrival_time", { withTimezone: true }).defaultNow().notNull(),
  condition: text("condition").notNull(),
  status: text("status", { enum: ["waiting", "in_consultation", "done", "left"] }).notNull().default("waiting"),
  price: integer("price"),
  nextStep: text("next_step"),
  lastUpdatedBy: uuid("last_updated_by"),
  visitDate: date("visit_date").defaultNow().notNull(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertVisitSchema = createInsertSchema(visits).omit({ id: true, arrivalTime: true, visitDate: true, accountId: true });

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Visit = typeof visits.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;

export type CreateVisitRequest = InsertVisit;
export type UpdateVisitRequest = Partial<InsertVisit>;

export type VisitResponse = Visit & { lastUpdatedByName?: string };

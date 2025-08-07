import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  taxId: varchar("tax_id", { length: 20 }).notNull().unique(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: text("email"),
  website: text("website"),
  industry: text("industry"),
  contactPerson: text("contact_person"),
  account: text("account"),
  password: text("password"),
  bankAccount: text("bank_account"),
  bankName: text("bank_name"),
  customFields: jsonb("custom_fields").$type<Record<string, string>>().default({}),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const documentTransactions = pgTable("document_transactions", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(),
  transactionType: text("transaction_type").notNull(), // "giao" or "nhận"
  handledBy: text("handled_by").notNull(),
  transactionDate: timestamp("transaction_date").default(sql`CURRENT_TIMESTAMP`).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
});

export const updateBusinessSchema = insertBusinessSchema.partial().extend({
  id: z.number(),
});

export const searchBusinessSchema = z.object({
  field: z.enum(["name", "namePartial", "taxId", "industry", "contactPerson", "phone", "email", "website", "address", "addressPartial", "account", "bankAccount", "bankName"]),
  value: z.string().min(1),
});

export const deleteBusinessSchema = z.object({
  id: z.number(),
  password: z.string(),
});

export const insertDocumentTransactionSchema = createInsertSchema(documentTransactions).omit({
  id: true,
  createdAt: true,
  transactionDate: true,
}).extend({
  transactionDate: z.string().optional(),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
});

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type UpdateBusiness = z.infer<typeof updateBusinessSchema>;
export type Business = typeof businesses.$inferSelect;
export type SearchBusiness = z.infer<typeof searchBusinessSchema>;
export type DeleteBusiness = z.infer<typeof deleteBusinessSchema>;
export type DocumentTransaction = typeof documentTransactions.$inferSelect;
export type InsertDocumentTransaction = z.infer<typeof insertDocumentTransactionSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;

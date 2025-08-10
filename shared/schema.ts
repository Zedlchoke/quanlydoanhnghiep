import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, serial, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  taxId: varchar("tax_id", { length: 20 }).notNull().unique(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: text("email"),
  website: text("website"),
  industry: text("industry"),
  contactPerson: text("contact_person"), // Người đại diện
  
  // Thông tin thành lập
  establishmentDate: text("establishment_date"), // Ngày thành lập
  charterCapital: text("charter_capital"), // Vốn điều lệ
  auditWebsite: text("audit_website"), // Website kiểm toán
  
  // Thông tin tài khoản cơ bản
  account: text("account"),
  password: text("password"),
  bankAccount: text("bank_account"),
  bankName: text("bank_name"),
  
  // Các tài khoản cơ bản của doanh nghiệp
  // Tài khoản khai thuế, nộp thuế
  taxAccountId: text("tax_account_id"),
  taxAccountPass: text("tax_account_pass"),
  
  // Tài khoản tra cứu HĐĐT
  invoiceLookupId: text("invoice_lookup_id"),
  invoiceLookupPass: text("invoice_lookup_pass"),
  
  // Web HĐĐT
  webInvoiceWebsite: text("web_invoice_website"),
  webInvoiceId: text("web_invoice_id"),
  webInvoicePass: text("web_invoice_pass"),
  
  // Tài khoản bảo hiểm XH-YT
  socialInsuranceCode: text("social_insurance_code"), // Mã bảo hiểm
  socialInsuranceId: text("social_insurance_id"),
  socialInsuranceMainPass: text("social_insurance_main_pass"), // Pass chính
  socialInsuranceSecondaryPass: text("social_insurance_secondary_pass"), // Pass phụ
  
  // Tài khoản TOKEN
  tokenId: text("token_id"),
  tokenPass: text("token_pass"),
  tokenProvider: text("token_provider"), // Đơn vị cung cấp
  tokenRegistrationDate: text("token_registration_date"), // Ngày đăng ký
  tokenExpirationDate: text("token_expiration_date"), // Ngày hết hạn
  tokenManagementLocation: text("token_management_location"), // Nơi quản lý
  
  // Tài khoản thống kê
  statisticsId: text("statistics_id"),
  statisticsPass: text("statistics_pass"),
  
  // Tài khoản phần mềm kiểm toán
  auditSoftwareWebsite: text("audit_software_website"),
  auditSoftwareId: text("audit_software_id"),
  auditSoftwarePass: text("audit_software_pass"),
  
  customFields: jsonb("custom_fields").$type<Record<string, string>>().default({}),
  notes: text("notes"),
  accessCode: text("access_code"), // Mã truy cập riêng cho từng doanh nghiệp
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Bảng riêng cho các tài khoản của doanh nghiệp
export const businessAccounts = pgTable("business_accounts", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  
  // Tài khoản tra cứu HĐĐT
  invoiceLookupId: text("invoice_lookup_id"),
  invoiceLookupPass: text("invoice_lookup_pass"),
  
  // Tài khoản Web HĐĐT
  webInvoiceWebsite: text("web_invoice_website"),
  webInvoiceId: text("web_invoice_id"),
  webInvoicePass: text("web_invoice_pass"),
  
  // Tài khoản Bảo hiểm XH-YT
  socialInsuranceCode: text("social_insurance_code"), // Mã bảo hiểm
  socialInsuranceId: text("social_insurance_id"),
  socialInsuranceMainPass: text("social_insurance_main_pass"), // Pass chính
  socialInsuranceSecondaryPass: text("social_insurance_secondary_pass"), // Pass ly
  socialInsuranceContact: text("social_insurance_contact"), // Liên hệ
  
  // Tài khoản thống kê
  statisticsId: text("statistics_id"),
  statisticsPass: text("statistics_pass"),
  
  // Tài khoản TOKEN
  tokenId: text("token_id"),
  tokenPass: text("token_pass"),
  tokenProvider: text("token_provider"), // Đơn vị cung cấp
  tokenRegistrationDate: text("token_registration_date"), // Ngày đăng ký
  tokenExpirationDate: text("token_expiration_date"), // Ngày hết hạn
  
  // Tài khoản khai thuế, nộp thuế
  taxAccountId: text("tax_account_id"),
  taxAccountPass: text("tax_account_pass"),
  
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const documentTransactions = pgTable("document_transactions", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  documentNumber: text("document_number"), // Số văn bản
  documentType: text("document_type").notNull(), // Loại hồ sơ chính
  
  // Hỗ trợ multi-document transactions với chi tiết đầy đủ
  documentDetails: jsonb("document_details").$type<Record<string, {quantity: number, unit: string, notes?: string}>>().default({}).notNull(), // Chi tiết hồ sơ: loại -> {số lượng, đơn vị, ghi chú}

  deliveryCompany: text("delivery_company").notNull(), // Công ty giao
  receivingCompany: text("receiving_company").notNull(), // Công ty nhận
  deliveryPerson: text("delivery_person"), // Người giao
  receivingPerson: text("receiving_person"), // Người nhận
  deliveryDate: text("delivery_date").notNull(), // Ngày giao
  receivingDate: text("receiving_date"), // Ngày nhận
  handledBy: text("handled_by").notNull(), // Người xử lý
  notes: text("notes"), // Ghi chú
  status: text("status").default("pending"), // Trạng thái
  signedFilePath: text("signed_file_path"), // Đường dẫn file PDF đã ký
  pdfFilePath: text("pdf_file_path"), // Đường dẫn file PDF đính kèm
  pdfFileName: text("pdf_file_name"), // Tên file PDF gốc
  isHidden: boolean("is_hidden").default(false), // Ẩn giao dịch
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

export const insertBusinessAccountSchema = createInsertSchema(businessAccounts).omit({
  id: true,
  createdAt: true,
});

export const updateBusinessAccountSchema = insertBusinessAccountSchema.partial();

export const searchBusinessSchema = z.object({
  field: z.enum(["name", "namePartial", "taxId", "industry", "contactPerson", "phone", "email", "website", "address", "addressPartial", "account", "bankAccount", "bankName"]),
  value: z.string().min(1),
});

export const deleteBusinessSchema = z.object({
  id: z.number(),
  password: z.string(),
});

export const deleteDocumentTransactionSchema = z.object({
  id: z.number(),
  password: z.string(),
});

export const insertDocumentTransactionSchema = createInsertSchema(documentTransactions).omit({
  id: true,
  createdAt: true,
});

export const uploadSignedDocumentSchema = z.object({
  documentTransactionId: z.number(),
  signedFilePath: z.string(),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

// Schema cho user authentication mới
export const userLoginSchema = z.object({
  userType: z.enum(["admin", "employee"]),
  identifier: z.string().min(1), // username cho admin/employee
  password: z.string().min(1), // password cho admin/employee
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
export type BusinessAccount = typeof businessAccounts.$inferSelect;
export type InsertBusinessAccount = z.infer<typeof insertBusinessAccountSchema>;
export type UpdateBusinessAccount = z.infer<typeof updateBusinessAccountSchema>;
export type SearchBusiness = z.infer<typeof searchBusinessSchema>;
export type DeleteBusiness = z.infer<typeof deleteBusinessSchema>;
export type DeleteDocumentTransaction = z.infer<typeof deleteDocumentTransactionSchema>;
export type DocumentTransaction = typeof documentTransactions.$inferSelect;
export type InsertDocumentTransaction = z.infer<typeof insertDocumentTransactionSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type UserLoginRequest = z.infer<typeof userLoginSchema>;
export type UploadSignedDocumentRequest = z.infer<typeof uploadSignedDocumentSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;

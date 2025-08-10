var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminUsers: () => adminUsers,
  businessAccounts: () => businessAccounts,
  businesses: () => businesses,
  changePasswordSchema: () => changePasswordSchema,
  deleteBusinessSchema: () => deleteBusinessSchema,
  deleteDocumentTransactionSchema: () => deleteDocumentTransactionSchema,
  documentTransactions: () => documentTransactions,
  insertAdminUserSchema: () => insertAdminUserSchema,
  insertBusinessAccountSchema: () => insertBusinessAccountSchema,
  insertBusinessSchema: () => insertBusinessSchema,
  insertDocumentTransactionSchema: () => insertDocumentTransactionSchema,
  loginSchema: () => loginSchema,
  searchBusinessSchema: () => searchBusinessSchema,
  updateBusinessAccountSchema: () => updateBusinessAccountSchema,
  updateBusinessSchema: () => updateBusinessSchema,
  uploadSignedDocumentSchema: () => uploadSignedDocumentSchema,
  userLoginSchema: () => userLoginSchema
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, serial, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var businesses, businessAccounts, documentTransactions, adminUsers, insertBusinessSchema, updateBusinessSchema, insertBusinessAccountSchema, updateBusinessAccountSchema, searchBusinessSchema, deleteBusinessSchema, deleteDocumentTransactionSchema, insertDocumentTransactionSchema, uploadSignedDocumentSchema, insertAdminUserSchema, userLoginSchema, loginSchema, changePasswordSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    businesses = pgTable("businesses", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      taxId: varchar("tax_id", { length: 20 }).notNull().unique(),
      address: text("address"),
      phone: varchar("phone", { length: 20 }),
      email: text("email"),
      website: text("website"),
      industry: text("industry"),
      contactPerson: text("contact_person"),
      // Người đại diện
      // Thông tin thành lập
      establishmentDate: text("establishment_date"),
      // Ngày thành lập
      charterCapital: text("charter_capital"),
      // Vốn điều lệ
      auditWebsite: text("audit_website"),
      // Website kiểm toán
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
      socialInsuranceCode: text("social_insurance_code"),
      // Mã bảo hiểm
      socialInsuranceId: text("social_insurance_id"),
      socialInsuranceMainPass: text("social_insurance_main_pass"),
      // Pass chính
      socialInsuranceSecondaryPass: text("social_insurance_secondary_pass"),
      // Pass phụ
      // Tài khoản TOKEN
      tokenId: text("token_id"),
      tokenPass: text("token_pass"),
      tokenProvider: text("token_provider"),
      // Đơn vị cung cấp
      tokenRegistrationDate: text("token_registration_date"),
      // Ngày đăng ký
      tokenExpirationDate: text("token_expiration_date"),
      // Ngày hết hạn
      tokenManagementLocation: text("token_management_location"),
      // Nơi quản lý
      // Tài khoản thống kê
      statisticsId: text("statistics_id"),
      statisticsPass: text("statistics_pass"),
      // Tài khoản phần mềm kiểm toán
      auditSoftwareWebsite: text("audit_software_website"),
      auditSoftwareId: text("audit_software_id"),
      auditSoftwarePass: text("audit_software_pass"),
      customFields: jsonb("custom_fields").$type().default({}),
      notes: text("notes"),
      accessCode: text("access_code"),
      // Mã truy cập riêng cho từng doanh nghiệp
      createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
    });
    businessAccounts = pgTable("business_accounts", {
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
      socialInsuranceCode: text("social_insurance_code"),
      // Mã bảo hiểm
      socialInsuranceId: text("social_insurance_id"),
      socialInsuranceMainPass: text("social_insurance_main_pass"),
      // Pass chính
      socialInsuranceSecondaryPass: text("social_insurance_secondary_pass"),
      // Pass ly
      socialInsuranceContact: text("social_insurance_contact"),
      // Liên hệ
      // Tài khoản thống kê
      statisticsId: text("statistics_id"),
      statisticsPass: text("statistics_pass"),
      // Tài khoản TOKEN
      tokenId: text("token_id"),
      tokenPass: text("token_pass"),
      tokenProvider: text("token_provider"),
      // Đơn vị cung cấp
      tokenRegistrationDate: text("token_registration_date"),
      // Ngày đăng ký
      tokenExpirationDate: text("token_expiration_date"),
      // Ngày hết hạn
      // Tài khoản khai thuế, nộp thuế
      taxAccountId: text("tax_account_id"),
      taxAccountPass: text("tax_account_pass"),
      createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
    });
    documentTransactions = pgTable("document_transactions", {
      id: serial("id").primaryKey(),
      businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
      documentNumber: text("document_number"),
      // Số văn bản
      documentType: text("document_type").notNull(),
      // Loại hồ sơ chính
      // Hỗ trợ multi-document transactions với chi tiết đầy đủ
      documentDetails: jsonb("document_details").$type().default({}).notNull(),
      // Chi tiết hồ sơ: loại -> {số lượng, đơn vị, ghi chú}
      deliveryCompany: text("delivery_company").notNull(),
      // Công ty giao
      receivingCompany: text("receiving_company").notNull(),
      // Công ty nhận
      deliveryPerson: text("delivery_person"),
      // Người giao
      receivingPerson: text("receiving_person"),
      // Người nhận
      deliveryDate: text("delivery_date").notNull(),
      // Ngày giao
      receivingDate: text("receiving_date"),
      // Ngày nhận
      handledBy: text("handled_by").notNull(),
      // Người xử lý
      notes: text("notes"),
      // Ghi chú
      status: text("status").default("pending"),
      // Trạng thái
      signedFilePath: text("signed_file_path"),
      // Đường dẫn file PDF đã ký
      pdfFilePath: text("pdf_file_path"),
      // Đường dẫn file PDF đính kèm
      pdfFileName: text("pdf_file_name"),
      // Tên file PDF gốc
      isHidden: boolean("is_hidden").default(false),
      // Ẩn giao dịch
      createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
    });
    adminUsers = pgTable("admin_users", {
      id: serial("id").primaryKey(),
      username: text("username").notNull().unique(),
      password: text("password").notNull(),
      createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
    });
    insertBusinessSchema = createInsertSchema(businesses).omit({
      id: true,
      createdAt: true
    });
    updateBusinessSchema = insertBusinessSchema.partial().extend({
      id: z.number()
    });
    insertBusinessAccountSchema = createInsertSchema(businessAccounts).omit({
      id: true,
      createdAt: true
    });
    updateBusinessAccountSchema = insertBusinessAccountSchema.partial();
    searchBusinessSchema = z.object({
      field: z.enum(["name", "namePartial", "taxId", "industry", "contactPerson", "phone", "email", "website", "address", "addressPartial", "account", "bankAccount", "bankName"]),
      value: z.string().min(1)
    });
    deleteBusinessSchema = z.object({
      id: z.number(),
      password: z.string()
    });
    deleteDocumentTransactionSchema = z.object({
      id: z.number(),
      password: z.string()
    });
    insertDocumentTransactionSchema = createInsertSchema(documentTransactions).omit({
      id: true,
      createdAt: true
    });
    uploadSignedDocumentSchema = z.object({
      documentTransactionId: z.number(),
      signedFilePath: z.string()
    });
    insertAdminUserSchema = createInsertSchema(adminUsers).omit({
      id: true,
      createdAt: true
    });
    userLoginSchema = z.object({
      userType: z.enum(["admin", "employee"]),
      identifier: z.string().min(1),
      // username cho admin/employee
      password: z.string().min(1)
      // password cho admin/employee
    });
    loginSchema = z.object({
      username: z.string().min(1),
      password: z.string().min(1)
    });
    changePasswordSchema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(1)
    });
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool
});
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var connectionConfig, pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    connectionConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 1e4,
      idleTimeoutMillis: 3e4,
      max: 10,
      min: 1
    };
    pool = new Pool(connectionConfig);
    db = drizzle(pool, { schema: schema_exports });
    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
    });
    process.on("SIGINT", async () => {
      console.log("Received SIGINT, closing database connections...");
      await pool.end();
      process.exit(0);
    });
    process.on("SIGTERM", async () => {
      console.log("Received SIGTERM, closing database connections...");
      await pool.end();
      process.exit(0);
    });
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
init_schema();
init_db();
import { eq, like, sql as sql2 } from "drizzle-orm";
var DatabaseStorage = class {
  async createBusiness(business) {
    const [createdBusiness] = await db.insert(businesses).values(business).returning();
    return createdBusiness;
  }
  async getBusinessById(id) {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business || void 0;
  }
  async getAllBusinesses(page = 1, limit = 10, sortBy = "createdAt", sortOrder = "asc") {
    const offset = (page - 1) * limit;
    let orderByColumn;
    switch (sortBy) {
      case "name":
        orderByColumn = businesses.name;
        break;
      case "taxId":
        orderByColumn = businesses.taxId;
        break;
      case "createdAt":
      default:
        orderByColumn = businesses.createdAt;
        break;
    }
    const [businessList, totalResult] = await Promise.all([
      db.select().from(businesses).orderBy(sortOrder === "desc" ? sql2`${orderByColumn} DESC` : orderByColumn).limit(limit).offset(offset),
      db.select({ count: sql2`count(*)` }).from(businesses)
    ]);
    return {
      businesses: businessList,
      total: totalResult[0]?.count || 0
    };
  }
  async getAllBusinessesForAutocomplete() {
    const businessList = await db.select().from(businesses).orderBy(businesses.name);
    return businessList;
  }
  async updateBusiness(business) {
    const { id, ...updateData } = business;
    const [updatedBusiness] = await db.update(businesses).set(updateData).where(eq(businesses.id, id)).returning();
    return updatedBusiness || void 0;
  }
  async deleteBusiness(id) {
    const result = await db.delete(businesses).where(eq(businesses.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  async searchBusinesses(search) {
    const { field, value } = search;
    switch (field) {
      case "address":
        return await db.select().from(businesses).where(eq(businesses.address, value));
      case "addressPartial":
        return await db.select().from(businesses).where(like(businesses.address, `%${value}%`));
      case "name":
        return await db.select().from(businesses).where(eq(businesses.name, value));
      case "namePartial":
        return await db.select().from(businesses).where(like(businesses.name, `%${value}%`));
      case "taxId":
        return await db.select().from(businesses).where(eq(businesses.taxId, value));
      case "industry":
        return await db.select().from(businesses).where(eq(businesses.industry, value));
      case "contactPerson":
        return await db.select().from(businesses).where(eq(businesses.contactPerson, value));
      case "phone":
        return await db.select().from(businesses).where(eq(businesses.phone, value));
      case "email":
        return await db.select().from(businesses).where(eq(businesses.email, value));
      case "website":
        return await db.select().from(businesses).where(eq(businesses.website, value));
      case "account":
        return await db.select().from(businesses).where(eq(businesses.account, value));
      case "bankAccount":
        return await db.select().from(businesses).where(eq(businesses.bankAccount, value));
      case "bankName":
        return await db.select().from(businesses).where(eq(businesses.bankName, value));
      default:
        return [];
    }
  }
  // Document transaction operations
  async createDocumentTransaction(transaction) {
    const [createdTransaction] = await db.insert(documentTransactions).values(transaction).returning();
    return createdTransaction;
  }
  async getDocumentTransactionsByBusinessId(businessId) {
    return await db.select().from(documentTransactions).where(eq(documentTransactions.businessId, businessId)).orderBy(documentTransactions.createdAt);
  }
  async getAllDocumentTransactions() {
    return await db.select().from(documentTransactions).orderBy(documentTransactions.createdAt);
  }
  async getDocumentTransactionsByCompany(companyName) {
    return await db.select().from(documentTransactions).where(
      sql2`${documentTransactions.deliveryCompany} = ${companyName} OR ${documentTransactions.receivingCompany} = ${companyName}`
    ).orderBy(documentTransactions.createdAt);
  }
  async updateDocumentNumber(id, documentNumber) {
    try {
      const result = await db.update(documentTransactions).set({ documentNumber }).where(eq(documentTransactions.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error updating document number:", error);
      return false;
    }
  }
  async updateSignedFilePath(id, signedFilePath) {
    try {
      const result = await db.update(documentTransactions).set({ signedFilePath }).where(eq(documentTransactions.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error updating signed file path:", error);
      return false;
    }
  }
  async deleteDocumentTransaction(id) {
    const result = await db.delete(documentTransactions).where(eq(documentTransactions.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  async updateDocumentTransactionSignedFile(id, signedFilePath) {
    try {
      const result = await db.update(documentTransactions).set({ signedFilePath }).where(eq(documentTransactions.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error updating document transaction signed file:", error);
      return false;
    }
  }
  async updateDocumentTransactionPdf(id, pdfFilePath, pdfFileName) {
    try {
      console.log("Updating PDF for transaction:", { id, pdfFilePath, pdfFileName });
      const result = await db.update(documentTransactions).set({ pdfFilePath, pdfFileName }).where(eq(documentTransactions.id, id)).returning();
      console.log("Update result:", result);
      return result.length > 0;
    } catch (error) {
      console.error("Error updating document transaction PDF:", error);
      return false;
    }
  }
  async getDocumentTransaction(id) {
    const [transaction] = await db.select().from(documentTransactions).where(eq(documentTransactions.id, id));
    return transaction || void 0;
  }
  async getDocumentTransactionsByTaxId(taxId) {
    const [business] = await db.select().from(businesses).where(eq(businesses.taxId, taxId));
    if (!business) {
      return [];
    }
    return await db.select().from(documentTransactions).where(
      sql2`${documentTransactions.deliveryCompany} = ${business.name} OR ${documentTransactions.receivingCompany} = ${business.name}`
    ).orderBy(documentTransactions.createdAt);
  }
  // Admin operations
  async createAdminUser(user) {
    const [createdUser] = await db.insert(adminUsers).values(user).returning();
    return createdUser;
  }
  async authenticateAdmin(login) {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, login.username));
    if (user && user.password === login.password) {
      return user;
    }
    return null;
  }
  async changeAdminPassword(username, request) {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    if (!user || user.password !== request.currentPassword) {
      return false;
    }
    const result = await db.update(adminUsers).set({ password: request.newPassword }).where(eq(adminUsers.username, username));
    return (result.rowCount ?? 0) > 0;
  }
  async getAdminByUsername(username) {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user || void 0;
  }
  async initializeDatabase() {
    try {
      const client = await pool.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS businesses (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          tax_id VARCHAR(100) UNIQUE,
          address TEXT,
          phone VARCHAR(50),
          email VARCHAR(255),
          website VARCHAR(255),
          industry VARCHAR(255),
          contact_person VARCHAR(255),
          account VARCHAR(255),
          password VARCHAR(255),
          bank_account VARCHAR(255),
          bank_name VARCHAR(255),
          custom_fields JSONB DEFAULT '{}',
          notes TEXT,
          access_code VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS document_transactions (
          id SERIAL PRIMARY KEY,
          business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          document_type VARCHAR(255) NOT NULL,
          transaction_type VARCHAR(50) NOT NULL,
          handled_by VARCHAR(255) NOT NULL,
          transaction_date TIMESTAMP NOT NULL,
          notes TEXT,
          signed_file_path VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      client.release();
      console.log("Database tables created successfully");
    } catch (error) {
      console.error("Error creating tables:", error);
    }
    try {
      await this.createAdminUser({
        username: "quanadmin",
        password: "01020811"
      });
      console.log("Admin user created successfully");
    } catch (error) {
      console.log("Admin user already exists or creation failed:", error);
    }
    console.log("Database initialization completed");
  }
  // Business Account implementation
  async getBusinessAccountByBusinessId(businessId) {
    return this.getBusinessAccount(businessId);
  }
  async getBusinessAccount(businessId) {
    const [account] = await db.select().from(businessAccounts).where(eq(businessAccounts.businessId, businessId));
    return account || null;
  }
  async createBusinessAccount(account) {
    const [createdAccount] = await db.insert(businessAccounts).values(account).returning();
    return createdAccount;
  }
  async updateBusinessAccount(businessId, account) {
    const [updatedAccount] = await db.update(businessAccounts).set(account).where(eq(businessAccounts.businessId, businessId)).returning();
    if (!updatedAccount) {
      return this.createBusinessAccount({ ...account, businessId });
    }
    return updatedAccount;
  }
  async updateDocumentPdf(id, pdfPath) {
    try {
      const result = await db.update(documentTransactions).set({ signedFilePath: pdfPath }).where(eq(documentTransactions.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error updating document PDF:", error);
      return false;
    }
  }
  // New authentication methods
  async authenticateUser(login) {
    const { userType, identifier, password } = login;
    switch (userType) {
      case "admin":
        const admin = await this.authenticateAdmin({ username: identifier, password });
        if (admin) {
          return { userType: "admin", userData: admin };
        }
        break;
      case "employee":
        if (password === "royalvietnam") {
          return {
            userType: "employee",
            userData: {
              id: 0,
              username: identifier,
              role: "employee"
            }
          };
        }
        break;
    }
    return null;
  }
  async getBusinessByTaxId(taxId) {
    const [business] = await db.select().from(businesses).where(eq(businesses.taxId, taxId));
    return business || void 0;
  }
  async updateBusinessAccessCode(id, accessCode) {
    try {
      const result = await db.update(businesses).set({ accessCode }).where(eq(businesses.id, id));
      return true;
    } catch (error) {
      console.error("Error updating business access code:", error);
      return false;
    }
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
init_schema();
import { z as z2 } from "zod";

// server/objectStorage.ts
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
var REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
var objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    },
    universe_domain: "googleapis.com"
  },
  projectId: ""
});
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
var ObjectStorageService = class {
  constructor() {
  }
  // Gets the private object directory.
  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }
  // Gets the upload URL for an object entity.
  async getObjectEntityUploadURL() {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900
    });
  }
  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath) {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }
  normalizeObjectEntityPath(rawPath) {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }
  // Downloads an object to the response.
  async downloadObject(file, res, cacheTtlSec = 3600, customFilename) {
    try {
      const [metadata] = await file.getMetadata();
      let contentDisposition = `attachment; filename="${metadata.name}"`;
      if (customFilename) {
        const asciiFileName = customFilename.replace(/[^\x00-\x7F]/g, "_");
        const encodedFileName = encodeURIComponent(customFilename);
        contentDisposition = `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodedFileName}`;
      }
      res.set({
        "Content-Type": metadata.contentType || "application/pdf",
        "Content-Length": metadata.size,
        "Cache-Control": `private, max-age=${cacheTtlSec}`,
        "Content-Disposition": contentDisposition
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
  // Delete an object from storage
  async deleteObject(objectPath) {
    const objectFile = await this.getObjectEntityFile(objectPath);
    await objectFile.delete();
  }
};
function parseObjectPath(path3) {
  if (!path3.startsWith("/")) {
    path3 = `/${path3}`;
  }
  const pathParts = path3.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

// server/routes.ts
var DELETE_PASSWORD = "0102";
async function registerRoutes(app2) {
  app2.get("/api/health", async (req, res) => {
    try {
      const { pool: pool2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const client = await pool2.connect();
      await client.query("SELECT 1 as health_check");
      client.release();
      res.json({
        status: "ok",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        database: "connected"
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({
        status: "error",
        message: "Database connection failed",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app2.post("/api/initialize-db", async (req, res) => {
    try {
      console.log("Initializing database...");
      await storage.initializeDatabase();
      res.json({ message: "Database initialized successfully" });
    } catch (error) {
      console.error("Database initialization failed:", error);
      res.status(500).json({ message: "Database initialization failed", error: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.post("/api/migrate", async (req, res) => {
    try {
      console.log("Running production migration...");
      const { pool: pool2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const client = await pool2.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS businesses (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          tax_id VARCHAR(100) UNIQUE,
          address TEXT,
          phone VARCHAR(50),
          email VARCHAR(255),
          website VARCHAR(255),
          industry VARCHAR(255),
          contact_person VARCHAR(255),
          account VARCHAR(255),
          password VARCHAR(255),
          bank_account VARCHAR(255),
          bank_name VARCHAR(255),
          custom_fields JSONB DEFAULT '{}',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS document_transactions (
          id SERIAL PRIMARY KEY,
          business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          document_type VARCHAR(255) NOT NULL,
          transaction_type VARCHAR(50) NOT NULL,
          handled_by VARCHAR(255) NOT NULL,
          transaction_date TIMESTAMP NOT NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await client.query(`
        INSERT INTO admin_users (username, password) 
        VALUES ('quanadmin', '01020811')
        ON CONFLICT (username) DO NOTHING
      `);
      client.release();
      console.log("Migration completed successfully");
      res.json({ message: "Migration completed successfully" });
    } catch (error) {
      console.error("Migration failed:", error);
      res.status(500).json({ message: "Migration failed", error: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.get("/api/businesses", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const sortBy = req.query.sortBy || "createdAt";
      const sortOrder = req.query.sortOrder || "asc";
      const result = await storage.getAllBusinesses(page, limit, sortBy, sortOrder);
      res.json(result);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      res.status(500).json({ message: "L\u1ED7i khi t\u1EA3i danh s\xE1ch doanh nghi\u1EC7p" });
    }
  });
  app2.get("/api/businesses/all", async (req, res) => {
    try {
      const businesses2 = await storage.getAllBusinessesForAutocomplete();
      res.json(businesses2);
    } catch (error) {
      console.error("Error fetching all businesses:", error);
      res.status(500).json({ message: "L\u1ED7i khi t\u1EA3i danh s\xE1ch doanh nghi\u1EC7p" });
    }
  });
  app2.get("/api/businesses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const business = await storage.getBusinessById(id);
      if (!business) {
        return res.status(404).json({ message: "Kh\xF4ng t\xECm th\u1EA5y doanh nghi\u1EC7p" });
      }
      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ message: "L\u1ED7i khi t\u1EA3i th\xF4ng tin doanh nghi\u1EC7p" });
    }
  });
  app2.post("/api/businesses", async (req, res) => {
    try {
      const validatedData = insertBusinessSchema.parse(req.body);
      const business = await storage.createBusiness(validatedData);
      res.status(201).json(business);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "D\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7",
          errors: error.errors
        });
      }
      if (error instanceof Error && error.message.includes("duplicate key")) {
        return res.status(400).json({ message: "M\xE3 s\u1ED1 thu\u1EBF \u0111\xE3 t\u1ED3n t\u1EA1i" });
      }
      console.error("Error creating business:", error);
      res.status(500).json({ message: "L\u1ED7i khi t\u1EA1o doanh nghi\u1EC7p m\u1EDBi" });
    }
  });
  app2.put("/api/businesses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const validatedData = updateBusinessSchema.parse({ ...req.body, id });
      const business = await storage.updateBusiness(validatedData);
      if (!business) {
        return res.status(404).json({ message: "Kh\xF4ng t\xECm th\u1EA5y doanh nghi\u1EC7p" });
      }
      res.json(business);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "D\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7",
          errors: error.errors
        });
      }
      console.error("Error updating business:", error);
      res.status(500).json({ message: "L\u1ED7i khi c\u1EADp nh\u1EADt doanh nghi\u1EC7p" });
    }
  });
  app2.post("/api/businesses/search", async (req, res) => {
    try {
      const validatedData = searchBusinessSchema.parse(req.body);
      const businesses2 = await storage.searchBusinesses(validatedData);
      res.json(businesses2);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "D\u1EEF li\u1EC7u t\xECm ki\u1EBFm kh\xF4ng h\u1EE3p l\u1EC7",
          errors: error.errors
        });
      }
      console.error("Error searching businesses:", error);
      res.status(500).json({ message: "L\u1ED7i khi t\xECm ki\u1EBFm doanh nghi\u1EC7p" });
    }
  });
  app2.delete("/api/businesses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const validatedData = deleteBusinessSchema.parse({ ...req.body, id });
      if (validatedData.password !== DELETE_PASSWORD) {
        return res.status(403).json({ message: "M\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng" });
      }
      const success = await storage.deleteBusiness(id);
      if (!success) {
        return res.status(404).json({ message: "Kh\xF4ng t\xECm th\u1EA5y doanh nghi\u1EC7p" });
      }
      res.json({ message: "X\xF3a doanh nghi\u1EC7p th\xE0nh c\xF4ng" });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "D\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7",
          errors: error.errors
        });
      }
      console.error("Error deleting business:", error);
      res.status(500).json({ message: "L\u1ED7i khi x\xF3a doanh nghi\u1EC7p" });
    }
  });
  const authTokens = /* @__PURE__ */ new Map();
  function generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = userLoginSchema.parse(req.body);
      const authResult = await storage.authenticateUser(validatedData);
      if (!authResult) {
        return res.status(401).json({ message: "Th\xF4ng tin \u0111\u0103ng nh\u1EADp kh\xF4ng \u0111\xFAng" });
      }
      const token = generateToken();
      authTokens.set(token, authResult);
      res.json({
        success: true,
        token,
        user: {
          userType: authResult.userType,
          userData: authResult.userData
        }
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "D\u1EEF li\u1EC7u \u0111\u0103ng nh\u1EADp kh\xF4ng h\u1EE3p l\u1EC7",
          errors: error.errors
        });
      }
      console.error("Error during login:", error);
      res.status(500).json({ message: "L\u1ED7i khi \u0111\u0103ng nh\u1EADp" });
    }
  });
  app2.post("/api/auth/admin-login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const admin = await storage.authenticateAdmin(validatedData);
      if (!admin) {
        return res.status(401).json({ message: "T\xE0i kho\u1EA3n ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng" });
      }
      const token = generateToken();
      authTokens.set(token, { userType: "admin", userData: admin });
      res.json({
        success: true,
        token,
        admin: { id: admin.id, username: admin.username }
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "D\u1EEF li\u1EC7u \u0111\u0103ng nh\u1EADp kh\xF4ng h\u1EE3p l\u1EC7",
          errors: error.errors
        });
      }
      console.error("Error during admin login:", error);
      res.status(500).json({ message: "L\u1ED7i khi \u0111\u0103ng nh\u1EADp admin" });
    }
  });
  app2.post("/api/auth/logout", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      authTokens.delete(token);
    }
    res.json({ success: true });
  });
  app2.get("/api/auth/me", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const authData = token ? authTokens.get(token) : null;
    if (authData) {
      res.json({
        isAuthenticated: true,
        user: {
          userType: authData.userType,
          userData: authData.userData
        }
      });
    } else {
      res.json({ isAuthenticated: false });
    }
  });
  app2.post("/api/auth/change-password", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const authData = token ? authTokens.get(token) : null;
      if (!authData || authData.userType !== "admin") {
        return res.status(401).json({ message: "Ch\u01B0a \u0111\u0103ng nh\u1EADp ho\u1EB7c kh\xF4ng c\xF3 quy\u1EC1n" });
      }
      const validatedData = changePasswordSchema.parse(req.body);
      const success = await storage.changeAdminPassword(authData.userData.username, validatedData);
      if (!success) {
        return res.status(400).json({ message: "M\u1EADt kh\u1EA9u hi\u1EC7n t\u1EA1i kh\xF4ng \u0111\xFAng" });
      }
      res.json({ success: true, message: "\u0110\u1ED5i m\u1EADt kh\u1EA9u th\xE0nh c\xF4ng" });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "D\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7",
          errors: error.errors
        });
      }
      console.error("Error changing password:", error);
      res.status(500).json({ message: "L\u1ED7i khi \u0111\u1ED5i m\u1EADt kh\u1EA9u" });
    }
  });
  app2.put("/api/businesses/:id/access-code", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const authData = token ? authTokens.get(token) : null;
      if (!authData || authData.userType !== "admin") {
        return res.status(401).json({ message: "Ch\u1EC9 admin m\u1EDBi c\xF3 quy\u1EC1n thay \u0111\u1ED5i m\xE3 truy c\u1EADp" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const { accessCode } = req.body;
      if (!accessCode || typeof accessCode !== "string") {
        return res.status(400).json({ message: "M\xE3 truy c\u1EADp kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const success = await storage.updateBusinessAccessCode(id, accessCode);
      if (!success) {
        return res.status(404).json({ message: "Kh\xF4ng t\xECm th\u1EA5y doanh nghi\u1EC7p ho\u1EB7c c\u1EADp nh\u1EADt th\u1EA5t b\u1EA1i" });
      }
      res.json({ success: true, message: "C\u1EADp nh\u1EADt m\xE3 truy c\u1EADp th\xE0nh c\xF4ng" });
    } catch (error) {
      console.error("Error updating access code:", error);
      res.status(500).json({ message: "L\u1ED7i khi c\u1EADp nh\u1EADt m\xE3 truy c\u1EADp" });
    }
  });
  app2.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });
  app2.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });
  app2.put("/api/documents/:id/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const { pdfUrl, fileName } = req.body;
      if (!pdfUrl || !fileName) {
        return res.status(400).json({ message: "URL PDF v\xE0 t\xEAn file l\xE0 b\u1EAFt bu\u1ED9c" });
      }
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(pdfUrl);
      console.log("Calling updateDocumentTransactionPdf with:", { id, normalizedPath, fileName });
      const success = await storage.updateDocumentTransactionPdf(id, normalizedPath, fileName);
      console.log("updateDocumentTransactionPdf result:", success);
      if (!success) {
        return res.status(404).json({ message: "Kh\xF4ng t\xECm th\u1EA5y giao d\u1ECBch" });
      }
      res.json({ success: true, objectPath: normalizedPath });
    } catch (error) {
      console.error("Error updating PDF:", error);
      res.status(500).json({ message: "L\u1ED7i khi c\u1EADp nh\u1EADt file PDF" });
    }
  });
  app2.delete("/api/documents/:id/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const transaction = await storage.getDocumentTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: "Kh\xF4ng t\xECm th\u1EA5y giao d\u1ECBch" });
      }
      if (transaction.pdfFilePath) {
        try {
          const objectStorageService = new ObjectStorageService();
          await objectStorageService.deleteObject(transaction.pdfFilePath);
        } catch (error) {
          console.warn("Could not delete file from storage:", error);
        }
      }
      const success = await storage.updateDocumentTransactionPdf(id, null, null);
      if (!success) {
        return res.status(500).json({ message: "L\u1ED7i khi x\xF3a th\xF4ng tin file" });
      }
      res.json({ success: true, message: "X\xF3a file PDF th\xE0nh c\xF4ng" });
    } catch (error) {
      console.error("Error deleting PDF:", error);
      res.status(500).json({ message: "L\u1ED7i khi x\xF3a file PDF" });
    }
  });
  app2.get("/api/documents/:id/pdf/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const transaction = await storage.getDocumentTransaction(id);
      if (!transaction || !transaction.pdfFilePath) {
        return res.status(404).json({ message: "Kh\xF4ng t\xECm th\u1EA5y file PDF" });
      }
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(transaction.pdfFilePath);
      const fileName = transaction.pdfFileName || `transaction_${id}.pdf`;
      await objectStorageService.downloadObject(objectFile, res, 3600, fileName);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "L\u1ED7i khi t\u1EA3i file PDF" });
      }
    }
  });
  app2.get("/api/businesses/:id/accounts", async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "ID doanh nghi\u1EC7p kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const account = await storage.getBusinessAccount(businessId);
      return res.json(account);
    } catch (error) {
      console.error("Error fetching business account:", error);
      return res.status(500).json({ message: "L\u1ED7i khi t\u1EA3i th\xF4ng tin t\xE0i kho\u1EA3n" });
    }
  });
  app2.post("/api/businesses/:id/accounts", async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const data = req.body;
      const account = await storage.createBusinessAccount({ ...data, businessId });
      return res.status(201).json(account);
    } catch (error) {
      console.error("Error creating business account:", error);
      return res.status(500).json({ message: "L\u1ED7i khi t\u1EA1o t\xE0i kho\u1EA3n" });
    }
  });
  app2.put("/api/businesses/:id/accounts", async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const data = req.body;
      const account = await storage.updateBusinessAccount(businessId, data);
      return res.json(account);
    } catch (error) {
      console.error("Error updating business account:", error);
      return res.status(500).json({ message: "L\u1ED7i khi c\u1EADp nh\u1EADt t\xE0i kho\u1EA3n" });
    }
  });
  app2.post("/api/businesses/:businessId/documents", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "ID doanh nghi\u1EC7p kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const validatedData = insertDocumentTransactionSchema.parse({
        ...req.body,
        businessId
      });
      console.log(`\u{1F50D} Server received request body:`, req.body);
      console.log(`\u{1F50D} Server documentDetails:`, req.body.documentDetails);
      console.log(`\u{1F50D} Validated data documentDetails:`, validatedData.documentDetails);
      console.log(`Creating document transaction for business ID: ${businessId}`, { businessId, documentDetails: validatedData.documentDetails, deliveryCompany: validatedData.deliveryCompany });
      const transaction = await storage.createDocumentTransaction(validatedData);
      console.log(`Created transaction with ID: ${transaction.id} for business ${businessId}`);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "D\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7",
          errors: error.errors
        });
      }
      console.error("Error creating document transaction:", error);
      res.status(500).json({ message: "L\u1ED7i khi t\u1EA1o giao d\u1ECBch h\u1ED3 s\u01A1" });
    }
  });
  app2.get("/api/businesses/:businessId/documents", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "ID doanh nghi\u1EC7p kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      console.log(`Fetching documents for business ID: ${businessId}`);
      const transactions = await storage.getDocumentTransactionsByBusinessId(businessId);
      console.log(`Found ${transactions.length} transactions for business ${businessId}:`, transactions.map((t) => ({ id: t.id, businessId: t.businessId, documentDetails: t.documentDetails })));
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching document transactions:", error);
      res.status(500).json({ message: "L\u1ED7i khi t\u1EA3i l\u1ECBch s\u1EED giao nh\u1EADn h\u1ED3 s\u01A1" });
    }
  });
  app2.get("/api/documents", async (req, res) => {
    try {
      const transactions = await storage.getAllDocumentTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching all document transactions:", error);
      res.status(500).json({ message: "L\u1ED7i khi t\u1EA3i danh s\xE1ch giao d\u1ECBch h\u1ED3 s\u01A1" });
    }
  });
  app2.get("/api/documents/company/:companyName", async (req, res) => {
    try {
      const companyName = decodeURIComponent(req.params.companyName);
      const transactions = await storage.getDocumentTransactionsByCompany(companyName);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching document transactions by company:", error);
      res.status(500).json({ message: "L\u1ED7i khi t\u1EA3i h\u1ED3 s\u01A1 theo c\xF4ng ty" });
    }
  });
  app2.get("/api/documents/tax-id/:taxId", async (req, res) => {
    try {
      const taxId = req.params.taxId;
      const transactions = await storage.getDocumentTransactionsByTaxId(taxId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching document transactions by tax ID:", error);
      res.status(500).json({ message: "L\u1ED7i khi t\u1EA3i h\u1ED3 s\u01A1 theo m\xE3 s\u1ED1 thu\u1EBF" });
    }
  });
  app2.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const validatedData = deleteDocumentTransactionSchema.parse({
        id,
        password: req.body.password
      });
      if (validatedData.password !== DELETE_PASSWORD) {
        return res.status(403).json({ message: "M\u1EADt kh\u1EA9u x\xF3a kh\xF4ng \u0111\xFAng" });
      }
      const success = await storage.deleteDocumentTransaction(id);
      if (!success) {
        return res.status(404).json({ message: "Kh\xF4ng t\xECm th\u1EA5y giao d\u1ECBch h\u1ED3 s\u01A1" });
      }
      res.json({ message: "X\xF3a giao d\u1ECBch h\u1ED3 s\u01A1 th\xE0nh c\xF4ng" });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "D\u1EEF li\u1EC7u x\xF3a kh\xF4ng h\u1EE3p l\u1EC7",
          errors: error.errors
        });
      }
      console.error("Error deleting document transaction:", error);
      res.status(500).json({ message: "L\u1ED7i khi x\xF3a giao d\u1ECBch h\u1ED3 s\u01A1" });
    }
  });
  app2.post("/api/businesses/:businessId/accounts", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "ID doanh nghi\u1EC7p kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const validatedData = insertBusinessAccountSchema.parse({
        ...req.body,
        businessId
      });
      const account = await storage.createBusinessAccount(validatedData);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "D\u1EEF li\u1EC7u t\xE0i kho\u1EA3n kh\xF4ng h\u1EE3p l\u1EC7",
          errors: error.errors
        });
      }
      console.error("Error creating business account:", error);
      res.status(500).json({ message: "L\u1ED7i khi t\u1EA1o t\xE0i kho\u1EA3n doanh nghi\u1EC7p" });
    }
  });
  app2.get("/api/businesses/:businessId/accounts", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "ID doanh nghi\u1EC7p kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const account = await storage.getBusinessAccountByBusinessId(businessId);
      res.json(account || null);
    } catch (error) {
      console.error("Error fetching business account:", error);
      res.status(500).json({ message: "L\u1ED7i khi l\u1EA5y th\xF4ng tin t\xE0i kho\u1EA3n" });
    }
  });
  app2.put("/api/businesses/:businessId/accounts", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "ID doanh nghi\u1EC7p kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const validatedData = updateBusinessAccountSchema.parse(req.body);
      const account = await storage.updateBusinessAccount(businessId, validatedData);
      if (!account) {
        return res.status(404).json({ message: "Kh\xF4ng t\xECm th\u1EA5y t\xE0i kho\u1EA3n" });
      }
      res.json(account);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "D\u1EEF li\u1EC7u c\u1EADp nh\u1EADt kh\xF4ng h\u1EE3p l\u1EC7",
          errors: error.errors
        });
      }
      console.error("Error updating business account:", error);
      res.status(500).json({ message: "L\u1ED7i khi c\u1EADp nh\u1EADt t\xE0i kho\u1EA3n" });
    }
  });
  app2.post("/api/documents/pdf-upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting PDF upload URL:", error);
      res.status(500).json({ error: "Failed to get PDF upload URL" });
    }
  });
  app2.get("/documents/:documentPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const pdfFile = await objectStorageService.getObjectEntityFile(`/objects/${req.params.documentPath}`);
      objectStorageService.downloadObject(pdfFile, res);
    } catch (error) {
      console.error("Error accessing PDF document:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });
  app2.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });
  app2.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(`/objects/${req.params.objectPath}`);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error downloading object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });
  app2.put("/api/documents/:id/number", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const authData = token ? authTokens.get(token) : null;
      if (!authData) {
        return res.status(401).json({ message: "Ch\u01B0a \u0111\u0103ng nh\u1EADp" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const { documentNumber } = req.body;
      if (typeof documentNumber !== "string") {
        return res.status(400).json({ message: "S\u1ED1 v\u0103n b\u1EA3n kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const success = await storage.updateDocumentNumber(id, documentNumber);
      if (!success) {
        return res.status(404).json({ message: "Kh\xF4ng t\xECm th\u1EA5y giao d\u1ECBch h\u1ED3 s\u01A1" });
      }
      res.json({ message: "C\u1EADp nh\u1EADt s\u1ED1 v\u0103n b\u1EA3n th\xE0nh c\xF4ng" });
    } catch (error) {
      console.error("Error updating document number:", error);
      res.status(500).json({ message: "L\u1ED7i khi c\u1EADp nh\u1EADt s\u1ED1 v\u0103n b\u1EA3n" });
    }
  });
  app2.put("/api/documents/:id/upload-pdf", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const authData = token ? authTokens.get(token) : null;
      if (!authData) {
        return res.status(401).json({ message: "Ch\u01B0a \u0111\u0103ng nh\u1EADp" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const { pdfPath } = req.body;
      if (typeof pdfPath !== "string") {
        return res.status(400).json({ message: "\u0110\u01B0\u1EDDng d\u1EABn PDF kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(pdfPath);
      const success = await storage.updateDocumentPdf(id, normalizedPath);
      if (!success) {
        return res.status(404).json({ message: "Kh\xF4ng t\xECm th\u1EA5y giao d\u1ECBch h\u1ED3 s\u01A1" });
      }
      res.json({ message: "T\u1EA3i l\xEAn PDF th\xE0nh c\xF4ng", pdfPath: normalizedPath });
    } catch (error) {
      console.error("Error uploading PDF:", error);
      res.status(500).json({ message: "L\u1ED7i khi t\u1EA3i l\xEAn PDF" });
    }
  });
  app2.get("/api/documents/tax-id/:taxId", async (req, res) => {
    try {
      const taxId = req.params.taxId;
      const transactions = await storage.getDocumentTransactionsByTaxId(taxId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching document transactions by tax ID:", error);
      res.status(500).json({ message: "L\u1ED7i khi t\u1EA3i danh s\xE1ch giao d\u1ECBch h\u1ED3 s\u01A1 theo m\xE3 s\u1ED1 thu\u1EBF" });
    }
  });
  app2.get("/api/documents/tax-id/:taxId", async (req, res) => {
    try {
      const taxId = req.params.taxId;
      const transactions = await storage.getDocumentTransactionsByTaxId(taxId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching document transactions by tax ID:", error);
      res.status(500).json({ message: "L\u1ED7i khi t\u1EA3i danh s\xE1ch giao d\u1ECBch h\u1ED3 s\u01A1 theo m\xE3 s\u1ED1 thu\u1EBF" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/middleware.ts
function errorHandler(err, req, res, next) {
  console.error("Error details:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message || "Internal Server Error";
  res.status(status).json({
    success: false,
    message,
    ...process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err
    }
  });
}
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
}
function timeoutHandler(timeoutMs = 3e4) {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: "Request timeout"
        });
      }
    }, timeoutMs);
    res.on("finish", () => {
      clearTimeout(timeout);
    });
    next();
  };
}
function bodyParserErrorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && "body" in err) {
    console.error("Body parsing error:", err.message);
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in request body"
    });
  }
  next(err);
}

// server/index.ts
var app = express2();
app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(timeoutHandler(3e4));
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParserErrorHandler);
if (process.env.NODE_ENV !== "production") {
  app.use(requestLogger);
}
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    log("Initializing database...");
    await storage.initializeDatabase();
    log("Database initialization completed");
  } catch (error) {
    log(`Database initialization failed: ${error}`);
  }
  const server = await registerRoutes(app);
  app.use(errorHandler);
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();

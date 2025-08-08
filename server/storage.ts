import { 
  businesses, 
  documentTransactions, 
  adminUsers,
  type Business, 
  type InsertBusiness, 
  type UpdateBusiness, 
  type SearchBusiness,
  type DocumentTransaction,
  type InsertDocumentTransaction,
  type AdminUser,
  type InsertAdminUser,
  type LoginRequest,
  type ChangePasswordRequest
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, like, sql, desc } from "drizzle-orm";

export interface IStorage {
  // Business operations
  createBusiness(business: InsertBusiness): Promise<Business>;
  getBusinessById(id: number): Promise<Business | undefined>;
  getAllBusinesses(page?: number, limit?: number): Promise<{ businesses: Business[], total: number }>;
  updateBusiness(business: UpdateBusiness): Promise<Business | undefined>;
  deleteBusiness(id: number): Promise<boolean>;
  searchBusinesses(search: SearchBusiness): Promise<Business[]>;
  
  // Document transaction operations
  createDocumentTransaction(transaction: InsertDocumentTransaction): Promise<DocumentTransaction>;
  getDocumentTransactionsByBusinessId(businessId: number): Promise<DocumentTransaction[]>;
  deleteDocumentTransaction(id: number): Promise<boolean>;
  
  // Admin operations
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  authenticateAdmin(login: LoginRequest): Promise<AdminUser | null>;
  changeAdminPassword(username: string, request: ChangePasswordRequest): Promise<boolean>;
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  
  // Database initialization
  initializeDatabase(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createBusiness(business: InsertBusiness): Promise<Business> {
    const [createdBusiness] = await db
      .insert(businesses)
      .values(business)
      .returning();
    return createdBusiness;
  }

  async getBusinessById(id: number): Promise<Business | undefined> {
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, id));
    return business || undefined;
  }

  async getAllBusinesses(page = 1, limit = 10): Promise<{ businesses: Business[], total: number }> {
    const offset = (page - 1) * limit;
    
    const [businessList, totalResult] = await Promise.all([
      db
        .select()
        .from(businesses)
        .orderBy(desc(businesses.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(businesses)
    ]);

    return {
      businesses: businessList,
      total: totalResult[0]?.count || 0
    };
  }

  async updateBusiness(business: UpdateBusiness): Promise<Business | undefined> {
    const { id, ...updateData } = business;
    const [updatedBusiness] = await db
      .update(businesses)
      .set(updateData)
      .where(eq(businesses.id, id))
      .returning();
    return updatedBusiness || undefined;
  }

  async deleteBusiness(id: number): Promise<boolean> {
    const result = await db
      .delete(businesses)
      .where(eq(businesses.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async searchBusinesses(search: SearchBusiness): Promise<Business[]> {
    const { field, value } = search;
    
    switch (field) {
      case "address":
        return await db
          .select()
          .from(businesses)
          .where(eq(businesses.address, value));
      case "addressPartial":
        return await db
          .select()
          .from(businesses)
          .where(like(businesses.address, `%${value}%`));
      case "name":
        return await db
          .select()
          .from(businesses)
          .where(eq(businesses.name, value));
      case "namePartial":
        return await db
          .select()
          .from(businesses)
          .where(like(businesses.name, `%${value}%`));
      case "taxId":
        return await db
          .select()
          .from(businesses)
          .where(eq(businesses.taxId, value));
      case "industry":
        return await db
          .select()
          .from(businesses)
          .where(eq(businesses.industry, value));
      case "contactPerson":
        return await db
          .select()
          .from(businesses)
          .where(eq(businesses.contactPerson, value));
      case "phone":
        return await db
          .select()
          .from(businesses)
          .where(eq(businesses.phone, value));
      case "email":
        return await db
          .select()
          .from(businesses)
          .where(eq(businesses.email, value));
      case "website":
        return await db
          .select()
          .from(businesses)
          .where(eq(businesses.website, value));
      case "account":
        return await db
          .select()
          .from(businesses)
          .where(eq(businesses.account, value));
      case "bankAccount":
        return await db
          .select()
          .from(businesses)
          .where(eq(businesses.bankAccount, value));
      case "bankName":
        return await db
          .select()
          .from(businesses)
          .where(eq(businesses.bankName, value));
      default:
        return [];
    }
  }

  // Document transaction operations
  async createDocumentTransaction(transaction: InsertDocumentTransaction): Promise<DocumentTransaction> {
    const transactionData = {
      ...transaction,
      transactionDate: transaction.transactionDate 
        ? new Date(transaction.transactionDate) 
        : new Date()
    };
    
    const [createdTransaction] = await db
      .insert(documentTransactions)
      .values(transactionData)
      .returning();
    return createdTransaction;
  }

  async getDocumentTransactionsByBusinessId(businessId: number): Promise<DocumentTransaction[]> {
    return await db
      .select()
      .from(documentTransactions)
      .where(eq(documentTransactions.businessId, businessId))
      .orderBy(desc(documentTransactions.transactionDate));
  }

  async deleteDocumentTransaction(id: number): Promise<boolean> {
    const result = await db
      .delete(documentTransactions)
      .where(eq(documentTransactions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Admin operations
  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const [createdUser] = await db
      .insert(adminUsers)
      .values(user)
      .returning();
    return createdUser;
  }

  async authenticateAdmin(login: LoginRequest): Promise<AdminUser | null> {
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, login.username));
    
    if (user && user.password === login.password) {
      return user;
    }
    return null;
  }

  async changeAdminPassword(username: string, request: ChangePasswordRequest): Promise<boolean> {
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username));
    
    if (!user || user.password !== request.currentPassword) {
      return false;
    }

    const result = await db
      .update(adminUsers)
      .set({ password: request.newPassword })
      .where(eq(adminUsers.username, username));
    
    return (result.rowCount ?? 0) > 0;
  }

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username));
    return user || undefined;
  }

  async initializeDatabase(): Promise<void> {
    // First, try to create tables if they don't exist using raw SQL
    try {
      const client = await pool.connect();
      
      // Create admin_users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create businesses table  
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

      // Create document_transactions table
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

      client.release();
      console.log("Database tables created successfully");
    } catch (error) {
      console.error("Error creating tables:", error);
    }

    // Create admin user if not exists  
    try {
      await this.createAdminUser({
        username: "quanadmin",
        password: "01020811"
      });
      console.log("Admin user created successfully");
    } catch (error) {
      // Admin user might already exist, that's okay
      console.log("Admin user already exists or creation failed:", error);
    }
    
    console.log("Database initialization completed");
  }
}

export const storage = new DatabaseStorage();

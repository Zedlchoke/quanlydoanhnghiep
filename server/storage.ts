import { 
  businesses, 
  businessAccounts,
  documentTransactions, 
  adminUsers,
  type Business, 
  type BusinessAccount,
  type InsertBusiness, 
  type InsertBusinessAccount,
  type UpdateBusiness, 
  type UpdateBusinessAccount,
  type SearchBusiness,
  type DocumentTransaction,
  type InsertDocumentTransaction,
  type AdminUser,
  type InsertAdminUser,
  type LoginRequest,
  type UserLoginRequest,
  type ChangePasswordRequest
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, like, sql } from "drizzle-orm";

export interface IStorage {
  // Business operations
  createBusiness(business: InsertBusiness): Promise<Business>;
  getBusinessById(id: number): Promise<Business | undefined>;
  getAllBusinesses(page?: number, limit?: number, sortBy?: string, sortOrder?: string): Promise<{ businesses: Business[], total: number }>;
  getAllBusinessesForAutocomplete(): Promise<Business[]>;
  updateBusiness(business: UpdateBusiness): Promise<Business | undefined>;
  deleteBusiness(id: number): Promise<boolean>;
  searchBusinesses(search: SearchBusiness): Promise<Business[]>;
  

  
  // Document transaction operations
  createDocumentTransaction(transaction: InsertDocumentTransaction): Promise<DocumentTransaction>;
  getDocumentTransactionsByBusinessId(businessId: number): Promise<DocumentTransaction[]>;
  getAllDocumentTransactions(): Promise<DocumentTransaction[]>;
  deleteDocumentTransaction(id: number): Promise<boolean>;
  updateDocumentTransactionSignedFile(id: number, signedFilePath: string): Promise<boolean>;
  
  // Admin operations
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  authenticateAdmin(login: LoginRequest): Promise<AdminUser | null>;
  changeAdminPassword(username: string, request: ChangePasswordRequest): Promise<boolean>;
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  
  // New authentication system
  authenticateUser(login: UserLoginRequest): Promise<{ userType: string; userData: any } | null>;
  getBusinessByTaxId(taxId: string): Promise<Business | undefined>;
  updateBusinessAccessCode(id: number, accessCode: string): Promise<boolean>;
  
  // Business Account methods
  getBusinessAccount(businessId: number): Promise<BusinessAccount | null>;
  getBusinessAccountByBusinessId(businessId: number): Promise<BusinessAccount | null>;
  createBusinessAccount(account: InsertBusinessAccount): Promise<BusinessAccount>;
  updateBusinessAccount(businessId: number, account: Partial<InsertBusinessAccount>): Promise<BusinessAccount>;
  updateDocumentPdf(id: number, pdfPath: string): Promise<boolean>;
  
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

  async getAllBusinesses(page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'asc'): Promise<{ businesses: Business[], total: number }> {
    const offset = (page - 1) * limit;
    
    // Xác định cột sắp xếp
    let orderByColumn;
    switch (sortBy) {
      case 'name':
        orderByColumn = businesses.name;
        break;
      case 'taxId':
        orderByColumn = businesses.taxId;
        break;
      case 'createdAt':
      default:
        orderByColumn = businesses.createdAt;
        break;
    }
    
    const [businessList, totalResult] = await Promise.all([
      db
        .select()
        .from(businesses)
        .orderBy(sortOrder === 'desc' ? sql`${orderByColumn} DESC` : orderByColumn)
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

  async getAllBusinessesForAutocomplete(): Promise<Business[]> {
    const businessList = await db
      .select()
      .from(businesses)
      .orderBy(businesses.name);
    
    return businessList;
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
    const [createdTransaction] = await db
      .insert(documentTransactions)
      .values(transaction)
      .returning();
    return createdTransaction;
  }

  async getDocumentTransactionsByBusinessId(businessId: number): Promise<DocumentTransaction[]> {
    return await db
      .select()
      .from(documentTransactions)
      .where(eq(documentTransactions.businessId, businessId))
      .orderBy(documentTransactions.createdAt);
  }

  async getAllDocumentTransactions(): Promise<DocumentTransaction[]> {
    return await db
      .select()
      .from(documentTransactions)
      .orderBy(documentTransactions.createdAt);
  }

  async getDocumentTransactionsByCompany(companyName: string): Promise<DocumentTransaction[]> {
    return await db
      .select()
      .from(documentTransactions)
      .where(
        sql`${documentTransactions.deliveryCompany} = ${companyName} OR ${documentTransactions.receivingCompany} = ${companyName}`
      )
      .orderBy(documentTransactions.createdAt);
  }

  async updateDocumentNumber(id: number, documentNumber: string): Promise<boolean> {
    try {
      const result = await db
        .update(documentTransactions)
        .set({ documentNumber })
        .where(eq(documentTransactions.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error updating document number:", error);
      return false;
    }
  }

  async updateSignedFilePath(id: number, signedFilePath: string): Promise<boolean> {
    try {
      const result = await db
        .update(documentTransactions)
        .set({ signedFilePath })
        .where(eq(documentTransactions.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error updating signed file path:", error);
      return false;
    }
  }



  async deleteDocumentTransaction(id: number): Promise<boolean> {
    const result = await db
      .delete(documentTransactions)
      .where(eq(documentTransactions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateDocumentTransactionSignedFile(id: number, signedFilePath: string): Promise<boolean> {
    try {
      const result = await db
        .update(documentTransactions)
        .set({ signedFilePath })
        .where(eq(documentTransactions.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error updating document transaction signed file:", error);
      return false;
    }
  }

  async updateDocumentTransactionPdf(id: number, pdfFilePath: string | null, pdfFileName: string | null): Promise<boolean> {
    try {
      console.log("Updating PDF for transaction:", { id, pdfFilePath, pdfFileName });
      const result = await db
        .update(documentTransactions)
        .set({ pdfFilePath, pdfFileName })
        .where(eq(documentTransactions.id, id))
        .returning();
      console.log("Update result:", result);
      return result.length > 0;
    } catch (error) {
      console.error("Error updating document transaction PDF:", error);
      return false;
    }
  }

  async getDocumentTransaction(id: number): Promise<DocumentTransaction | undefined> {
    const [transaction] = await db
      .select()
      .from(documentTransactions)
      .where(eq(documentTransactions.id, id));
    return transaction || undefined;
  }



  async getDocumentTransactionsByTaxId(taxId: string): Promise<DocumentTransaction[]> {
    // Lấy business có mã số thuế này
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.taxId, taxId));
    
    if (!business) {
      return [];
    }

    // Lấy tất cả giao dịch có liên quan đến công ty này (deliveryCompany hoặc receivingCompany)
    return await db
      .select()
      .from(documentTransactions)
      .where(
        sql`${documentTransactions.deliveryCompany} = ${business.name} OR ${documentTransactions.receivingCompany} = ${business.name}`
      )
      .orderBy(documentTransactions.createdAt);
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
          access_code VARCHAR(255),
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
          signed_file_path VARCHAR(500),
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

  // Business Account implementation
  async getBusinessAccountByBusinessId(businessId: number): Promise<BusinessAccount | null> {
    return this.getBusinessAccount(businessId);
  }

  async getBusinessAccount(businessId: number): Promise<BusinessAccount | null> {
    const [account] = await db
      .select()
      .from(businessAccounts)
      .where(eq(businessAccounts.businessId, businessId));
    return account || null;
  }

  async createBusinessAccount(account: InsertBusinessAccount): Promise<BusinessAccount> {
    const [createdAccount] = await db
      .insert(businessAccounts)
      .values(account)
      .returning();
    return createdAccount;
  }

  async updateBusinessAccount(businessId: number, account: Partial<InsertBusinessAccount>): Promise<BusinessAccount> {
    const [updatedAccount] = await db
      .update(businessAccounts)
      .set(account)
      .where(eq(businessAccounts.businessId, businessId))
      .returning();
    
    if (!updatedAccount) {
      // If no record exists, create one
      return this.createBusinessAccount({ ...account, businessId } as InsertBusinessAccount);
    }
    
    return updatedAccount;
  }

  async updateDocumentPdf(id: number, pdfPath: string): Promise<boolean> {
    try {
      const result = await db
        .update(documentTransactions)
        .set({ signedFilePath: pdfPath })
        .where(eq(documentTransactions.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error updating document PDF:", error);
      return false;
    }
  }

  // New authentication methods
  async authenticateUser(login: UserLoginRequest): Promise<{ userType: string; userData: any } | null> {
    const { userType, identifier, password } = login;

    switch (userType) {
      case "admin":
        const admin = await this.authenticateAdmin({ username: identifier, password });
        if (admin) {
          return { userType: "admin", userData: admin };
        }
        break;

      case "employee":
        // Employee authentication với mật khẩu cố định
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

  async getBusinessByTaxId(taxId: string): Promise<Business | undefined> {
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.taxId, taxId));
    return business || undefined;
  }

  async updateBusinessAccessCode(id: number, accessCode: string): Promise<boolean> {
    try {
      const result = await db
        .update(businesses)
        .set({ accessCode })
        .where(eq(businesses.id, id));
      return true;
    } catch (error) {
      console.error("Error updating business access code:", error);
      return false;
    }
  }




}

export const storage = new DatabaseStorage();

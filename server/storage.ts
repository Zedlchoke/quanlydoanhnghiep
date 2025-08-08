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
  updateBusiness(business: UpdateBusiness): Promise<Business | undefined>;
  deleteBusiness(id: number): Promise<boolean>;
  searchBusinesses(search: SearchBusiness): Promise<Business[]>;



  // Document transaction operations
  createDocumentTransaction(transaction: InsertDocumentTransaction): Promise<DocumentTransaction>;
  getDocumentTransactionsByBusinessId(businessId: number): Promise<DocumentTransaction[]>;
  deleteDocumentTransaction(id: number): Promise<boolean>;
  updateDocumentTransactionSignedFile(id: number, signedFilePath: string): Promise<boolean>;
  updateDocumentTransactionPdf(id: number, pdfPath: string): Promise<boolean>;

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
  createBusinessAccount(account: InsertBusinessAccount): Promise<BusinessAccount>;
  updateBusinessAccount(businessId: number, account: Partial<InsertBusinessAccount>): Promise<BusinessAccount>;

  // Database initialization
  initializeDatabase(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createBusiness(data: InsertBusiness & { accountData?: any }): Promise<Business> {
    try {
      console.log("Creating business in database with data:", data);

      // Parse customFields if it's a string
      let customFields = {};
      if (typeof data.customFields === 'string') {
        try {
          customFields = JSON.parse(data.customFields);
        } catch {
          customFields = {};
        }
      } else {
        customFields = data.customFields || {};
      }

      // Extract account data before creating business
      const { accountData, ...businessData } = data;

      const result = await db.insert(businesses).values({
        ...businessData,
        customFields: JSON.stringify(customFields),
      }).returning();

      const newBusiness = result[0];
      console.log("Business created successfully:", newBusiness);

      // Create business account if provided
      if (accountData && Object.values(accountData).some(val => val && val !== '')) {
        console.log("Creating business account for business ID:", newBusiness.id);
        try {
          await this.createBusinessAccount({
            ...accountData,
            businessId: newBusiness.id
          });
          console.log("Business account created successfully");
        } catch (error) {
          console.error("Error creating business account:", error);
          // Continue without failing business creation
        }
      }

      return newBusiness;
    } catch (error) {
      console.error("Error creating business:", error);
      throw error;
    }
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

  async getAllBusinessesForAutocomplete(): Promise<Business[]> {
    return await db.select().from(businesses).orderBy(businesses.name);
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
    try {
      // For SQLite, tables are created automatically by Drizzle
      console.log("Database tables initialized with SQLite");

      // Create admin user if not exists  
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

  // Business Account methods implementation
  async getBusinessAccount(businessId: number): Promise<BusinessAccount | null> {
    return this.getBusinessAccountByBusinessId(businessId);
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

  async updateDocumentTransactionPdf(id: number, pdfPath: string): Promise<boolean> {
    try {
      console.log(`Updating document ${id} with PDF path:`, pdfPath);

      // Ensure the path is properly formatted
      let formattedPath = pdfPath;
      if (pdfPath.startsWith('http')) {
        // Extract path from full URL
        const url = new URL(pdfPath);
        formattedPath = url.pathname;
      }

      // Ensure path starts with /documents/
      if (!formattedPath.startsWith('/documents/')) {
        formattedPath = `/documents/${formattedPath.replace(/^\/+/, '')}`;
      }

      const result = await db.update(documentTransactions)
        .set({ signedFilePath: formattedPath })
        .where(eq(documentTransactions.id, id))
        .returning();

      console.log(`PDF path updated for document ${id}:`, formattedPath);
      console.log(`Updated transaction:`, result[0]);
      return result.length > 0;
    } catch (error) {
      console.error("Error updating document transaction PDF:", error);
      return false;
    }
  }

  async getBusinessAccountByBusinessId(businessId: number): Promise<BusinessAccount | null> {
    try {
      const result = await db.select().from(businessAccounts)
        .where(eq(businessAccounts.businessId, businessId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("Error fetching business account:", error);
      return null;
    }
  }
}

export const storage = new DatabaseStorage();
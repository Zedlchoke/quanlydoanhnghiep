import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertBusinessSchema, 
  updateBusinessSchema, 
  searchBusinessSchema, 
  deleteBusinessSchema,
  deleteDocumentTransactionSchema,
  insertDocumentTransactionSchema,
  insertBusinessAccountSchema,
  updateBusinessAccountSchema,
  uploadSignedDocumentSchema,
  loginSchema,
  userLoginSchema,
  changePasswordSchema
} from "@shared/schema";
import { z } from "zod";
import { 
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

const DELETE_PASSWORD = "0102";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Render
  app.get("/api/health", async (req, res) => {
    try {
      // Simple database connection test
      const { pool } = await import("./db");
      const client = await pool.connect();
      await client.query('SELECT 1 as health_check');
      client.release();
      
      res.json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        database: "connected"
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({ 
        status: "error", 
        message: "Database connection failed",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Production debug endpoint
  app.get("/api/debug", async (req, res) => {
    try {
      // Check storage methods availability
      const storageCheck = {
        getAllBusinessesForAutocomplete: typeof storage.getAllBusinessesForAutocomplete === 'function',
        getAllDocumentTransactions: typeof storage.getAllDocumentTransactions === 'function',
        createBusiness: typeof storage.createBusiness === 'function',
        getBusinessById: typeof storage.getBusinessById === 'function'
      };
      
      // Try to get data count
      let dataCount: { businesses: number; transactions: number; error: string | null } = { businesses: 0, transactions: 0, error: null };
      try {
        if (storage.getAllBusinessesForAutocomplete) {
          const businesses = await storage.getAllBusinessesForAutocomplete();
          dataCount.businesses = businesses.length;
        }
        if (storage.getAllDocumentTransactions) {
          const transactions = await storage.getAllDocumentTransactions();
          dataCount.transactions = transactions.length;
        }
      } catch (error) {
        dataCount.error = error instanceof Error ? error.message : String(error);
      }
      
      res.json({
        status: "debug_info",
        timestamp: new Date().toISOString(),
        storage_methods: storageCheck,
        data_count: dataCount,
        node_env: process.env.NODE_ENV,
        deployment: "production"
      });
    } catch (error) {
      console.error('Debug check failed:', error);
      res.status(500).json({ 
        status: "debug_error", 
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Database initialization endpoint
  app.post("/api/initialize-db", async (req, res) => {
    try {
      console.log("Initializing database...");
      await storage.initializeDatabase();
      res.json({ message: "Database initialized successfully" });
    } catch (error) {
      console.error("Database initialization failed:", error);
      res.status(500).json({ message: "Database initialization failed", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Simple migration endpoint for production setup
  app.post("/api/migrate", async (req, res) => {
    try {
      console.log("Running production migration...");
      const { pool } = await import("./db");
      const client = await pool.connect();

      // Create tables
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

      // Create admin user
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
  // Get all businesses with pagination and sorting
  app.get("/api/businesses", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = req.query.sortBy as string || 'createdAt'; // createdAt, name, taxId
      const sortOrder = req.query.sortOrder as string || 'asc'; // asc, desc
      
      const result = await storage.getAllBusinesses(page, limit, sortBy, sortOrder);
      res.json(result);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      res.status(500).json({ message: "Lỗi khi tải danh sách doanh nghiệp" });
    }
  });

  // Get all businesses (without pagination) for autocomplete
  app.get("/api/businesses/all", async (req, res) => {
    try {
      const businesses = await storage.getAllBusinessesForAutocomplete();
      res.json(businesses);
    } catch (error) {
      console.error("Error fetching all businesses:", error);
      res.status(500).json({ message: "Lỗi khi tải danh sách doanh nghiệp" });
    }
  });

  // Get business by ID
  app.get("/api/businesses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const business = await storage.getBusinessById(id);
      if (!business) {
        return res.status(404).json({ message: "Không tìm thấy doanh nghiệp" });
      }

      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ message: "Lỗi khi tải thông tin doanh nghiệp" });
    }
  });

  // Create new business
  app.post("/api/businesses", async (req, res) => {
    try {
      const validatedData = insertBusinessSchema.parse(req.body);
      const business = await storage.createBusiness(validatedData);
      res.status(201).json(business);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ",
          errors: error.errors 
        });
      }
      
      if (error instanceof Error && error.message.includes("duplicate key")) {
        return res.status(400).json({ message: "Mã số thuế đã tồn tại" });
      }
      
      console.error("Error creating business:", error);
      res.status(500).json({ message: "Lỗi khi tạo doanh nghiệp mới" });
    }
  });

  // Update business
  app.put("/api/businesses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const validatedData = updateBusinessSchema.parse({ ...req.body, id });
      const business = await storage.updateBusiness(validatedData);
      
      if (!business) {
        return res.status(404).json({ message: "Không tìm thấy doanh nghiệp" });
      }

      res.json(business);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ",
          errors: error.errors 
        });
      }
      
      console.error("Error updating business:", error);
      res.status(500).json({ message: "Lỗi khi cập nhật doanh nghiệp" });
    }
  });

  // Search businesses
  app.post("/api/businesses/search", async (req, res) => {
    try {
      const validatedData = searchBusinessSchema.parse(req.body);
      const businesses = await storage.searchBusinesses(validatedData);
      res.json(businesses);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dữ liệu tìm kiếm không hợp lệ",
          errors: error.errors 
        });
      }
      
      console.error("Error searching businesses:", error);
      res.status(500).json({ message: "Lỗi khi tìm kiếm doanh nghiệp" });
    }
  });

  // Delete business (with password protection)
  app.delete("/api/businesses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const validatedData = deleteBusinessSchema.parse({ ...req.body, id });
      
      if (validatedData.password !== DELETE_PASSWORD) {
        return res.status(403).json({ message: "Mật khẩu không đúng" });
      }

      const success = await storage.deleteBusiness(id);
      if (!success) {
        return res.status(404).json({ message: "Không tìm thấy doanh nghiệp" });
      }

      res.json({ message: "Xóa doanh nghiệp thành công" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ",
          errors: error.errors 
        });
      }
      
      console.error("Error deleting business:", error);
      res.status(500).json({ message: "Lỗi khi xóa doanh nghiệp" });
    }
  });

  // Simple token storage for authentication - updated for new system
  const authTokens = new Map<string, { userType: string; userData: any }>();
  
  function generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // New unified authentication route
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = userLoginSchema.parse(req.body);
      const authResult = await storage.authenticateUser(validatedData);
      
      if (!authResult) {
        return res.status(401).json({ message: "Thông tin đăng nhập không đúng" });
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dữ liệu đăng nhập không hợp lệ",
          errors: error.errors 
        });
      }
      
      console.error("Error during login:", error);
      res.status(500).json({ message: "Lỗi khi đăng nhập" });
    }
  });

  // Legacy admin login for backward compatibility
  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const admin = await storage.authenticateAdmin(validatedData);
      
      if (!admin) {
        return res.status(401).json({ message: "Tài khoản hoặc mật khẩu không đúng" });
      }

      const token = generateToken();
      authTokens.set(token, { userType: "admin", userData: admin });

      res.json({ 
        success: true, 
        token,
        admin: { id: admin.id, username: admin.username } 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dữ liệu đăng nhập không hợp lệ",
          errors: error.errors 
        });
      }
      
      console.error("Error during admin login:", error);
      res.status(500).json({ message: "Lỗi khi đăng nhập admin" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      authTokens.delete(token);
    }
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
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

  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const authData = token ? authTokens.get(token) : null;
      
      if (!authData || authData.userType !== "admin") {
        return res.status(401).json({ message: "Chưa đăng nhập hoặc không có quyền" });
      }

      const validatedData = changePasswordSchema.parse(req.body);
      const success = await storage.changeAdminPassword(authData.userData.username, validatedData);
      
      if (!success) {
        return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
      }

      res.json({ success: true, message: "Đổi mật khẩu thành công" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ",
          errors: error.errors 
        });
      }
      
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Lỗi khi đổi mật khẩu" });
    }
  });

  // Route to update business access code (admin only)
  app.put("/api/businesses/:id/access-code", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const authData = token ? authTokens.get(token) : null;
      
      if (!authData || authData.userType !== "admin") {
        return res.status(401).json({ message: "Chỉ admin mới có quyền thay đổi mã truy cập" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const { accessCode } = req.body;
      if (!accessCode || typeof accessCode !== 'string') {
        return res.status(400).json({ message: "Mã truy cập không hợp lệ" });
      }

      const success = await storage.updateBusinessAccessCode(id, accessCode);
      if (!success) {
        return res.status(404).json({ message: "Không tìm thấy doanh nghiệp hoặc cập nhật thất bại" });
      }

      res.json({ success: true, message: "Cập nhật mã truy cập thành công" });
    } catch (error) {
      console.error("Error updating access code:", error);
      res.status(500).json({ message: "Lỗi khi cập nhật mã truy cập" });
    }
  });

  // Object storage routes for signed document upload
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
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

  // Update document transaction with PDF file
  app.put("/api/documents/:id/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const { pdfUrl, fileName } = req.body;
      if (!pdfUrl || !fileName) {
        return res.status(400).json({ message: "URL PDF và tên file là bắt buộc" });
      }

      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(pdfUrl);

      console.log("Calling updateDocumentTransactionPdf with:", { id, normalizedPath, fileName });
      const success = await storage.updateDocumentTransactionPdf(id, normalizedPath, fileName);
      console.log("updateDocumentTransactionPdf result:", success);
      
      if (!success) {
        return res.status(404).json({ message: "Không tìm thấy giao dịch" });
      }

      res.json({ success: true, objectPath: normalizedPath });
    } catch (error) {
      console.error("Error updating PDF:", error);
      res.status(500).json({ message: "Lỗi khi cập nhật file PDF" });
    }
  });

  // Delete PDF file from transaction
  app.delete("/api/documents/:id/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const transaction = await storage.getDocumentTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: "Không tìm thấy giao dịch" });
      }

      // Delete file from object storage if exists
      if (transaction.pdfFilePath) {
        try {
          const objectStorageService = new ObjectStorageService();
          await objectStorageService.deleteObject(transaction.pdfFilePath);
        } catch (error) {
          console.warn("Could not delete file from storage:", error);
        }
      }

      // Update database to remove file references
      const success = await storage.updateDocumentTransactionPdf(id, null, null);
      if (!success) {
        return res.status(500).json({ message: "Lỗi khi xóa thông tin file" });
      }

      res.json({ success: true, message: "Xóa file PDF thành công" });
    } catch (error) {
      console.error("Error deleting PDF:", error);
      res.status(500).json({ message: "Lỗi khi xóa file PDF" });
    }
  });

  // Download PDF file from transaction
  app.get("/api/documents/:id/pdf/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const transaction = await storage.getDocumentTransaction(id);
      if (!transaction || !transaction.pdfFilePath) {
        return res.status(404).json({ message: "Không tìm thấy file PDF" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(transaction.pdfFilePath);
      
      // Pass custom filename to downloadObject function
      const fileName = transaction.pdfFileName || `transaction_${id}.pdf`;
      
      await objectStorageService.downloadObject(objectFile, res, 3600, fileName);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Lỗi khi tải file PDF" });
      }
    }
  });

  // Business accounts routes
  app.get('/api/businesses/:id/accounts', async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "ID doanh nghiệp không hợp lệ" });
      }

      const account = await storage.getBusinessAccount(businessId);
      return res.json(account);
    } catch (error) {
      console.error("Error fetching business account:", error);
      return res.status(500).json({ message: "Lỗi khi tải thông tin tài khoản" });
    }
  });

  app.post('/api/businesses/:id/accounts', async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const data = req.body;
      const account = await storage.createBusinessAccount({ ...data, businessId });
      return res.status(201).json(account);
    } catch (error) {
      console.error("Error creating business account:", error);
      return res.status(500).json({ message: "Lỗi khi tạo tài khoản" });
    }
  });

  app.put('/api/businesses/:id/accounts', async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const data = req.body;
      const account = await storage.updateBusinessAccount(businessId, data);
      return res.json(account);
    } catch (error) {
      console.error("Error updating business account:", error);
      return res.status(500).json({ message: "Lỗi khi cập nhật tài khoản" });
    }
  });

  // Document transaction routes
  app.post("/api/businesses/:businessId/documents", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "ID doanh nghiệp không hợp lệ" });
      }

      const validatedData = insertDocumentTransactionSchema.parse({ 
        ...req.body, 
        businessId 
      });
      
      console.log(`🔍 Server received request body:`, req.body);
      console.log(`🔍 Server documentDetails:`, req.body.documentDetails);
      console.log(`🔍 Validated data documentDetails:`, validatedData.documentDetails);
      console.log(`Creating document transaction for business ID: ${businessId}`, { businessId, documentDetails: validatedData.documentDetails, deliveryCompany: validatedData.deliveryCompany });
      const transaction = await storage.createDocumentTransaction(validatedData);
      console.log(`Created transaction with ID: ${transaction.id} for business ${businessId}`);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ",
          errors: error.errors 
        });
      }
      
      console.error("Error creating document transaction:", error);
      res.status(500).json({ message: "Lỗi khi tạo giao dịch hồ sơ" });
    }
  });

  app.get("/api/businesses/:businessId/documents", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "ID doanh nghiệp không hợp lệ" });
      }

      console.log(`Fetching documents for business ID: ${businessId}`);
      const transactions = await storage.getDocumentTransactionsByBusinessId(businessId);
      console.log(`Found ${transactions.length} transactions for business ${businessId}:`, transactions.map(t => ({ id: t.id, businessId: t.businessId, documentDetails: t.documentDetails })));
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching document transactions:", error);
      res.status(500).json({ message: "Lỗi khi tải lịch sử giao nhận hồ sơ" });
    }
  });

  // API lấy tất cả document transactions
  app.get("/api/documents", async (req, res) => {
    try {
      const transactions = await storage.getAllDocumentTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching all document transactions:", error);
      res.status(500).json({ message: "Lỗi khi tải danh sách giao dịch hồ sơ" });
    }
  });

  // API lấy documents liên quan đến một công ty (giao hoặc nhận)
  app.get("/api/documents/company/:companyName", async (req, res) => {
    try {
      const companyName = decodeURIComponent(req.params.companyName);
      const transactions = await storage.getDocumentTransactionsByCompany(companyName);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching document transactions by company:", error);
      res.status(500).json({ message: "Lỗi khi tải hồ sơ theo công ty" });
    }
  });

  // API lấy documents theo mã số thuế
  app.get("/api/documents/tax-id/:taxId", async (req, res) => {
    try {
      const taxId = req.params.taxId;
      const transactions = await storage.getDocumentTransactionsByTaxId(taxId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching document transactions by tax ID:", error);
      res.status(500).json({ message: "Lỗi khi tải hồ sơ theo mã số thuế" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      // Validate password for deletion
      const validatedData = deleteDocumentTransactionSchema.parse({
        id,
        password: req.body.password
      });

      if (validatedData.password !== DELETE_PASSWORD) {
        return res.status(403).json({ message: "Mật khẩu xóa không đúng" });
      }

      const success = await storage.deleteDocumentTransaction(id);
      if (!success) {
        return res.status(404).json({ message: "Không tìm thấy giao dịch hồ sơ" });
      }

      res.json({ message: "Xóa giao dịch hồ sơ thành công" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dữ liệu xóa không hợp lệ",
          errors: error.errors 
        });
      }
      
      console.error("Error deleting document transaction:", error);
      res.status(500).json({ message: "Lỗi khi xóa giao dịch hồ sơ" });
    }
  });

  // Business accounts endpoints
  app.post("/api/businesses/:businessId/accounts", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "ID doanh nghiệp không hợp lệ" });
      }

      const validatedData = insertBusinessAccountSchema.parse({
        ...req.body,
        businessId
      });

      const account = await storage.createBusinessAccount(validatedData);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dữ liệu tài khoản không hợp lệ",
          errors: error.errors 
        });
      }
      
      console.error("Error creating business account:", error);
      res.status(500).json({ message: "Lỗi khi tạo tài khoản doanh nghiệp" });
    }
  });

  app.get("/api/businesses/:businessId/accounts", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "ID doanh nghiệp không hợp lệ" });
      }

      const account = await storage.getBusinessAccountByBusinessId(businessId);
      res.json(account || null);
    } catch (error) {
      console.error("Error fetching business account:", error);
      res.status(500).json({ message: "Lỗi khi lấy thông tin tài khoản" });
    }
  });

  app.put("/api/businesses/:businessId/accounts", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "ID doanh nghiệp không hợp lệ" });
      }

      const validatedData = updateBusinessAccountSchema.parse(req.body);
      const account = await storage.updateBusinessAccount(businessId, validatedData);
      
      if (!account) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản" });
      }

      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dữ liệu cập nhật không hợp lệ",
          errors: error.errors 
        });
      }
      
      console.error("Error updating business account:", error);
      res.status(500).json({ message: "Lỗi khi cập nhật tài khoản" });
    }
  });

  // PDF upload endpoints for document transactions
  app.post("/api/documents/pdf-upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting PDF upload URL:", error);
      res.status(500).json({ error: "Failed to get PDF upload URL" });
    }
  });

  app.get("/documents/:documentPath(*)", async (req, res) => {
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

  // Object storage routes
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
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

  // Update document number
  app.put("/api/documents/:id/number", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const authData = token ? authTokens.get(token) : null;
      
      if (!authData) {
        return res.status(401).json({ message: "Chưa đăng nhập" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const { documentNumber } = req.body;
      if (typeof documentNumber !== 'string') {
        return res.status(400).json({ message: "Số văn bản không hợp lệ" });
      }

      const success = await storage.updateDocumentNumber(id, documentNumber);
      if (!success) {
        return res.status(404).json({ message: "Không tìm thấy giao dịch hồ sơ" });
      }

      res.json({ message: "Cập nhật số văn bản thành công" });
    } catch (error) {
      console.error("Error updating document number:", error);
      res.status(500).json({ message: "Lỗi khi cập nhật số văn bản" });
    }
  });

  // Upload PDF file for document transaction
  app.put("/api/documents/:id/upload-pdf", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const authData = token ? authTokens.get(token) : null;
      
      if (!authData) {
        return res.status(401).json({ message: "Chưa đăng nhập" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const { pdfPath } = req.body;
      if (typeof pdfPath !== 'string') {
        return res.status(400).json({ message: "Đường dẫn PDF không hợp lệ" });
      }

      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(pdfPath);

      const success = await storage.updateDocumentPdf(id, normalizedPath);
      if (!success) {
        return res.status(404).json({ message: "Không tìm thấy giao dịch hồ sơ" });
      }

      res.json({ message: "Tải lên PDF thành công", pdfPath: normalizedPath });
    } catch (error) {
      console.error("Error uploading PDF:", error);
      res.status(500).json({ message: "Lỗi khi tải lên PDF" });
    }
  });

  // Get document transactions by tax ID (chỉ hiển thị giao dịch liên quan đến doanh nghiệp có mã số thuế này)
  app.get("/api/documents/tax-id/:taxId", async (req, res) => {
    try {
      const taxId = req.params.taxId;
      const transactions = await storage.getDocumentTransactionsByTaxId(taxId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching document transactions by tax ID:", error);
      res.status(500).json({ message: "Lỗi khi tải danh sách giao dịch hồ sơ theo mã số thuế" });
    }
  });

  // PDF upload endpoint for document transactions
  app.post("/api/documents/pdf-upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting PDF upload URL:", error);
      res.status(500).json({ message: "Lỗi khi tạo URL tải lên PDF" });
    }
  });

  // Delete PDF from document transaction
  app.delete("/api/documents/:id/pdf", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.updateDocumentTransactionPdf(id, null, null);
      if (!success) {
        return res.status(404).json({ message: "Không tìm thấy giao dịch hồ sơ" });
      }
      res.json({ message: "Xóa PDF thành công" });
    } catch (error) {
      console.error("Error deleting PDF:", error);
      res.status(500).json({ message: "Lỗi khi xóa PDF" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

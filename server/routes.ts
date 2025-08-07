import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertBusinessSchema, 
  updateBusinessSchema, 
  searchBusinessSchema, 
  deleteBusinessSchema,
  insertDocumentTransactionSchema,
  loginSchema,
  changePasswordSchema
} from "@shared/schema";
import { z } from "zod";

const DELETE_PASSWORD = "0102";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all businesses with pagination
  app.get("/api/businesses", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await storage.getAllBusinesses(page, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching businesses:", error);
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

  // Simple token storage for authentication
  const authTokens = new Map<string, { adminId: number; username: string }>();
  
  function generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const admin = await storage.authenticateAdmin(validatedData);
      
      if (!admin) {
        return res.status(401).json({ message: "Tài khoản hoặc mật khẩu không đúng" });
      }

      const token = generateToken();
      authTokens.set(token, { adminId: admin.id, username: admin.username });

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
      
      console.error("Error during login:", error);
      res.status(500).json({ message: "Lỗi khi đăng nhập" });
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
        admin: { id: authData.adminId, username: authData.username } 
      });
    } else {
      res.json({ isAuthenticated: false });
    }
  });

  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const authData = token ? authTokens.get(token) : null;
      
      if (!authData) {
        return res.status(401).json({ message: "Chưa đăng nhập" });
      }

      const validatedData = changePasswordSchema.parse(req.body);
      const success = await storage.changeAdminPassword(authData.username, validatedData);
      
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
      
      const transaction = await storage.createDocumentTransaction(validatedData);
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

      const transactions = await storage.getDocumentTransactionsByBusinessId(businessId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching document transactions:", error);
      res.status(500).json({ message: "Lỗi khi tải lịch sử giao nhận hồ sơ" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const authData = token ? authTokens.get(token) : null;
      
      if (!authData) {
        return res.status(401).json({ message: "Cần quyền admin để xóa" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const success = await storage.deleteDocumentTransaction(id);
      if (!success) {
        return res.status(404).json({ message: "Không tìm thấy giao dịch hồ sơ" });
      }

      res.json({ message: "Xóa giao dịch hồ sơ thành công" });
    } catch (error) {
      console.error("Error deleting document transaction:", error);
      res.status(500).json({ message: "Lỗi khi xóa giao dịch hồ sơ" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

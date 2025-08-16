# 🚀 RENDER DEPLOYMENT - ĐƠN GIẢN

## ✅ CÁCH ĐƠN GIẢN NHẤT (1 bước tạo cả web + database)

### BƯỚC 1: Chuẩn bị code
- **Commit code lên GitHub** hoặc **tạo ZIP file**

### BƯỚC 2: Tạo Web Service + Database cùng lúc
1. **Go to render.com** → Sign up
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub repo** (hoặc upload ZIP)
4. **Điền thông tin:**
   - **Name:** `royal-vietnam-app`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run dev`
   - **Environment:** Node.js

5. **Scroll down → "Add Database"**
6. **Check "Add PostgreSQL Database"**
   - **Database Name:** `royalvietnam`
   - Render sẽ tự động tạo DATABASE_URL environment variable

7. **Click "Create Web Service"**

### BƯỚC 3: Chờ deploy xong
- **Render sẽ tự động:**
  - Tạo PostgreSQL database
  - Set DATABASE_URL environment variable
  - Build và deploy code
  - Assign URL cho website

### BƯỚC 4: Sử lỗi database (quan trọng!)
1. **Sau khi deploy xong**, go to **"Services"** → **PostgreSQL database**
2. **Find "Shell" tab** hoặc **"Query" section**
3. **Chạy 2 commands:**
   ```sql
   ALTER TABLE businesses ADD COLUMN IF NOT EXISTS establishment_date TEXT;
   ALTER TABLE document_transactions ADD COLUMN IF NOT EXISTS document_number TEXT;
   ```
4. **Go back to Web Service** → **"Manual Deploy"** để restart

### BƯỚC 5: Test website
- **Open website URL** từ Render dashboard
- **Login:** admin: `quanadmin` / password: `01020811`
- **Test features** → Should work perfectly!

---

## 🎯 TẠI SAO CẦN SỬA DATABASE?

**Local database có 2 columns mà production database chưa có:**
- `establishment_date` trong businesses table
- `document_number` trong document_transactions table

**Sau khi thêm 2 columns này → Website sẽ hoạt động 100% như local!**

---

## 📋 TÓM TẮT:
1. **Create Web Service** với database cùng lúc
2. **Render tự động connect** database với web service
3. **Chạy 2 SQL commands** để sync database schema
4. **Done!** Website ready để sử dụng

**Bạn muốn tôi tạo ZIP file để upload, hay hướng dẫn commit GitHub?**
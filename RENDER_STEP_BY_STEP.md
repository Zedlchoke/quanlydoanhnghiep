# 🚀 RENDER DEPLOYMENT - HƯỚNG DẪN TỪ ĐẦU

## ✅ BƯỚC 1: CHUẨN BỊ CODE

**Bạn có thể tự commit code lên GitHub với message:**
```
Production ready Vietnamese business management system
```

**Hoặc tôi có thể tạo file ZIP để bạn upload:**

---

## 🎯 BƯỚC 2: TẠO RENDER ACCOUNT

1. **Truy cập:** https://render.com
2. **Sign up** với GitHub account (recommend)
3. **Verify email** nếu cần

---

## 📊 BƯỚC 3: TẠO DATABASE TRƯỚC

### 3.1 Tạo PostgreSQL Database
1. **Click "New +"** trong Render dashboard
2. **Chọn "PostgreSQL"**
3. **Điền thông tin:**
   - **Name:** `royal-vietnam-db` (hoặc tên khác)
   - **Database:** `royalvietnam`
   - **User:** `admin` (hoặc tên khác)
   - **Region:** Chọn gần Việt Nam nhất
   - **Plan:** Free tier (đủ cho testing)

4. **Click "Create Database"**
5. **Chờ database khởi tạo** (2-3 phút)

### 3.2 Lấy Database Connection String
1. **Click vào database** vừa tạo
2. **Scroll xuống "Connections"**
3. **Copy "External Database URL"** 
   - Format: `postgresql://user:pass@host:port/dbname`
4. **Save URL này** - sẽ cần dùng ở bước sau

---

## 🌐 BƯỚC 4: TẠO WEB SERVICE

### 4.1 Tạo Service
1. **Click "New +"** trong dashboard
2. **Chọn "Web Service"**
3. **Connect Repository:**
   - **GitHub:** Connect GitHub repo của bạn
   - **Hoặc upload ZIP** nếu chưa có repo

### 4.2 Cấu hình Service
1. **Build Command:** `npm install`
2. **Start Command:** `npm run dev`
3. **Environment Variables:** Click "Advanced" và thêm:
   ```
   NODE_ENV=production
   DATABASE_URL=<paste-database-url-từ-bước-3.2>
   ```

4. **Click "Create Web Service"**

---

## ⚡ BƯỚC 5: SỬA DATABASE (QUAN TRỌNG!)

**Sau khi web service deploy xong (có thể fail lần đầu):**

### 5.1 Vào Database Console
1. **Go back to PostgreSQL database** (từ bước 3)
2. **Tìm section "Query"** hoặc **"Console"** 
3. **Nếu không thấy, try:**
   - Click "Connect" button
   - Hoặc tìm "SQL Editor" / "Query Editor"

### 5.2 Chạy 2 Commands Này:
```sql
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS establishment_date TEXT;
ALTER TABLE document_transactions ADD COLUMN IF NOT EXISTS document_number TEXT;
```

### 5.3 Restart Web Service
1. **Go to Web Service** dashboard
2. **Click "Manual Deploy"** hoặc **"Redeploy"**

---

## 🎉 BƯỚC 6: TEST WEBSITE

1. **Click vào Web Service URL** (dạng: https://yourapp.onrender.com)
2. **Login với:** admin: `quanadmin` / password: `01020811`
3. **Test tạo business** → Should work!
4. **Test document transaction** → Should work!

---

## 🔧 TROUBLESHOOTING

**Nếu gặp lỗi "Column doesn't exist":**
- Chạy lại 2 SQL commands ở bước 5.2
- Restart web service

**Nếu không tìm thấy Database Console:**
- Dùng external tool như pgAdmin
- Connect với Database URL từ bước 3.2
- Chạy 2 SQL commands

**Nếu build fail:**
- Check logs trong Render dashboard
- Thường là missing environment variables

---

**Bạn muốn tôi tạo file ZIP để upload, hay hướng dẫn commit lên GitHub trước?**
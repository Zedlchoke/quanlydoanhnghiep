# 🔗 RAILWAY DATABASE CONNECTION

## ✅ **CÁC BƯỚC THEO HÌNH ẢNH CỦA BẠN:**

### **1. Create Environment Variable**
**Railway đang suggest:**
- **Variable name:** `DATABASE_URL` (hoặc tên khác)
- **Variable value:** `${{ long-quan-db.DATABASE_URL }}`

### **2. Add Variable to Web Service**
1. **Go to your web service** (long-quan-business...)
2. **Click "Variables" tab**
3. **Add new variable:**
   ```
   Name: DATABASE_URL
   Value: ${{ long-quan-db.DATABASE_URL }}
   ```
4. **Save changes**

### **3. Redeploy Web Service**
- **Click "Deploy"** hoặc **"Redeploy"**
- Railway sẽ tự động connect database với web service

---

## 🎯 **SAU KHI CONNECT:**

### **Bước tiếp theo:**
1. **Web service sẽ deploy lại** với database connection
2. **App có thể sẽ vẫn crash** vì database chưa có tables
3. **Run migration script** để tạo tables:

**Go to `long-quan-db` service → "Data" tab → "Query":**
```sql
-- Copy từ file migration-script.sql
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ... (rest of the script)
```

### **Hoặc app tự tạo tables:**
- Nếu app code hoạt động đúng
- `initializeDatabase()` sẽ tự động tạo tables
- Check logs để xem có tạo thành công không

---

## 🔍 **KIỂM TRA KẾT QUẢ:**

### **Check Web Service Logs:**
1. **Go to web service** → **"Logs" tab**
2. **Look for:**
   ```
   Database tables created successfully
   Admin user created successfully
   Database initialization completed
   ```

### **Test Website:**
1. **Open web service URL**
2. **Login:** admin: `quanadmin` / password: `01020811`
3. **Try creating business** → Should work!

---

## 🚨 **NẾU VẪN LỖI:**

**Most common issues:**
1. **Database connection timeout** → Increase timeout in Railway
2. **Tables không tạo được** → Run manual migration script
3. **Environment variable không load** → Restart web service

**Bạn đã follow theo steps trong hình chưa? Results như thế nào?**
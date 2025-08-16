# 🔧 RAILWAY DATABASE SETUP

## ⚠️ VẤN ĐỀ: Database trống khi deploy

**Khi deploy lên Railway:**
- Database PostgreSQL mới tạo = trống hoàn toàn
- Không có tables, không có data
- App sẽ crash khi cố gắng query tables không tồn tại

## ✅ GIẢI PHÁP: Tạo tables tự động

### **Cách 1: Database Migration Script (Recommend)**

1. **Sau khi Railway deploy xong:**
2. **Go to PostgreSQL service** → **"Data" tab** → **"Connect"**
3. **Run migration script:**

```sql
-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    business_type VARCHAR(100),
    establishment_date TEXT,
    tax_account_id VARCHAR(255),
    tax_account_password VARCHAR(255),
    hddt_lookup_id VARCHAR(255),
    hddt_lookup_password VARCHAR(255),
    web_hddt_website VARCHAR(255),
    web_hddt_id VARCHAR(255),
    web_hddt_password VARCHAR(255),
    social_insurance_code VARCHAR(255),
    social_insurance_id VARCHAR(255),
    social_insurance_main_password VARCHAR(255),
    social_insurance_sub_password VARCHAR(255),
    token_id VARCHAR(255),
    token_password VARCHAR(255),
    token_provider VARCHAR(255),
    token_registration_date VARCHAR(255),
    token_expiry_date VARCHAR(255),
    token_management_location VARCHAR(255),
    statistics_id VARCHAR(255),
    statistics_password VARCHAR(255),
    audit_software_website VARCHAR(255),
    audit_software_id VARCHAR(255),
    audit_software_password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create document_transactions table
CREATE TABLE IF NOT EXISTS document_transactions (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    document_number TEXT,
    transaction_type VARCHAR(50) NOT NULL,
    sender_business_id INTEGER REFERENCES businesses(id),
    receiver_business_id INTEGER REFERENCES businesses(id),
    document_types TEXT[] NOT NULL,
    quantities INTEGER[] NOT NULL,
    units TEXT[] NOT NULL,
    notes TEXT,
    handover_report TEXT,
    pdf_file_path VARCHAR(500),
    pdf_file_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT INTO admin_users (username, password, role) 
VALUES ('quanadmin', '01020811', 'admin') 
ON CONFLICT (username) DO NOTHING;
```

### **Cách 2: App tự động tạo tables (Đã có sẵn)**

**App đã có code tự động tạo tables trong `server/storage.ts`:**
- `initializeDatabase()` method
- Tự động chạy khi app start
- Tạo tables nếu chưa tồn tại

**Nhưng có thể fail nếu:**
- Database connection timeout
- Permission issues
- Concurrent access

### **Cách 3: Manual Query (Backup)**

**Nếu app không tự tạo được tables:**

1. **Railway dashboard** → **PostgreSQL service** 
2. **"Connect"** → Copy connection string
3. **Use external tool** (pgAdmin, DBeaver, etc.)
4. **Connect với connection string**
5. **Run SQL script** từ Cách 1

---

## 🎯 RECOMMEND WORKFLOW:

1. **Deploy app lên Railway** (sẽ fail lần đầu - OK)
2. **Check PostgreSQL service** → "Data" tab
3. **Run SQL script** từ Cách 1
4. **Restart web service** (Manual Deploy)
5. **App should work** với tables đã tạo

---

## 🔍 DEBUG TIPS:

**Check nếu tables được tạo:**
```sql
-- List all tables
\dt

-- Check specific tables
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Check app logs:**
- Railway dashboard → Web Service → "Logs"
- Look for database connection errors
- Look for "Database initialization completed"

**Bạn đã deploy lên Railway chưa? Tôi sẽ guide bạn fix database issue!**
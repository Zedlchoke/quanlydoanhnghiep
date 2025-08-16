# 🔧 TẠO TABLES THỦ CÔNG TRONG RAILWAY

## ✅ **BƯỚC 1: TÌM DATABASE CONSOLE**

### **Cách 1: Railway Dashboard**
1. **Go to `long-quan-db` service**
2. **Tìm tab "Data" hoặc "Query"**
3. **Click "Query" hoặc "Console"**

### **Cách 2: Connect Button**
1. **In `long-quan-db` service**
2. **Look for "Connect" button**
3. **Should open query interface**

---

## 🗂️ **BƯỚC 2: RUN TABLE CREATION SCRIPT**

**Copy và paste script này vào Railway console:**

```sql
-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create businesses table with ALL fields
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

-- Create document_transactions table with ALL fields
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

-- Verify tables created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

---

## 🔍 **BƯỚC 3: VERIFY RESULTS**

**Script cuối sẽ show list tables. Bạn should see:**
- `admin_users`
- `businesses` 
- `document_transactions`

**Nếu thành công, restart web service:**
1. **Go back to web service**
2. **Click "Deploy" hoặc "Redeploy"**
3. **App should start without errors**

---

## 🚨 **NẾU KHÔNG TÌM THẤY QUERY CONSOLE:**

### **External Tool Method:**
1. **Get database connection string** từ Railway
2. **Use pgAdmin hoặc DBeaver:**
   - Download pgAdmin (free)
   - Connect với Railway database URL
   - Run SQL script

### **Database URL format:**
```
postgresql://username:password@host:port/database
```

---

## ✅ **ALTERNATIVE: AUTO-SYNC CODE FIX**

**Nếu muốn app tự tạo tables, check `server/storage.ts`:**
- Method `initializeDatabase()` 
- Có thể schema không match với production
- Có thể cần update để sync với current schema

**Bạn có tìm thấy Query console trong Railway không?**
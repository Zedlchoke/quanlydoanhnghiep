# 🔧 EXACT SQL COMMANDS TO FIX RENDER DATABASE

## ⚡ 2 COMMANDS CẦN CHẠY:

```sql
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS establishment_date TEXT;
ALTER TABLE document_transactions ADD COLUMN IF NOT EXISTS document_number TEXT;
```

## 🎯 CÁCH CHẠY TRONG RENDER:

### Method 1: Render Database Dashboard (Dễ nhất)
1. **Login vào Render.com**
2. **Go to Dashboard** → **PostgreSQL database** của bạn
3. **Click "Connect"** button
4. **Chọn "Web Shell"** hoặc **"Query"** tab
5. **Copy/paste 2 commands** above vào query box
6. **Click "Execute"** hoặc **"Run"**
7. **Restart web service** trong Render dashboard

### Method 2: External Database Tool
1. **Get connection string** từ Render database dashboard
2. **Use pgAdmin, DBeaver, hoặc bất kỳ PostgreSQL client**
3. **Connect với connection string**
4. **Run 2 SQL commands** above

### Method 3: Command Line (Nếu có psql)
```bash
# Use connection string from Render
psql "postgresql://username:password@host:port/database" -c "
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS establishment_date TEXT;
ALTER TABLE document_transactions ADD COLUMN IF NOT EXISTS document_number TEXT;
"
```

## ✅ SAU KHI CHẠY COMMANDS:

**Verification queries để check:**
```sql
-- Check businesses table has new column
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'businesses' AND column_name = 'establishment_date';

-- Check document_transactions table has new column  
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'document_transactions' AND column_name = 'document_number';
```

**Nếu thấy 2 rows trả về → Fix thành công!**

## 🚨 IMPORTANT NOTES:

- **IF NOT EXISTS** = Safe command, không lỗi nếu column đã có
- **TEXT** = Data type giống với local database
- **Chỉ cần chạy 1 lần** cho production database
- **Restart web service** sau khi chạy để apply changes

---

**Sau khi fix → Website sẽ hoạt động 100% như local!**
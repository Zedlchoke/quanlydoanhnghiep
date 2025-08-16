// migrate-production.js - Manual Migration Tool for Railway
const { Pool } = require('pg');

// Use Railway environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable not found!');
  console.log('Make sure you added DATABASE_URL variable in Railway web service.');
  process.exit(1);
}

async function createTables() {
  const pool = new Pool({ connectionString });
  
  try {
    console.log('🔗 Connecting to Railway PostgreSQL...');
    
    // Create admin_users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ admin_users table created');

    // Create businesses table with PRODUCTION SCHEMA
    await pool.query(`
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
    `);
    console.log('✅ businesses table created');

    // Create document_transactions table
    await pool.query(`
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
    `);
    console.log('✅ document_transactions table created');

    // Insert default admin user
    await pool.query(`
      INSERT INTO admin_users (username, password, role) 
      VALUES ('quanadmin', '01020811', 'admin') 
      ON CONFLICT (username) DO NOTHING;
    `);
    console.log('✅ Default admin user created');

    // Verify tables
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n🎯 TABLES CREATED:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('\n🚀 DATABASE SETUP COMPLETE!');
    console.log('Now restart your Railway web service.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

createTables();
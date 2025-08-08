// Production Database Migration Script
// Run this on Render to create tables and admin user

const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    console.log('Connected to database');

    // Create admin_users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created admin_users table');

    // Create businesses table
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
    console.log('Created businesses table');

    // Create document_transactions table
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
    console.log('Created document_transactions table');

    // Create admin user
    try {
      await client.query(`
        INSERT INTO admin_users (username, password) 
        VALUES ('quanadmin', '01020811')
        ON CONFLICT (username) DO NOTHING
      `);
      console.log('Admin user created/verified');
    } catch (error) {
      console.log('Admin user already exists:', error.message);
    }

    client.release();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
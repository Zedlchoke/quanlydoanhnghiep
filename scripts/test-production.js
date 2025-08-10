// Test script for production deployment
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

console.log('🔍 Testing production database connection...');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    console.log('📡 Connecting to database...');
    const client = await pool.connect();
    
    console.log('✅ Database connection successful');
    
    // Test basic query
    console.log('🔍 Testing basic query...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Basic query successful:', result.rows[0].current_time);
    
    // Check tables
    console.log('🔍 Checking tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📊 Found tables:', tables.rows.map(r => r.table_name));
    
    // Test admin user exists
    const adminCheck = await client.query('SELECT * FROM admin_users WHERE username = $1', ['quanadmin']);
    console.log('👤 Admin user check:', adminCheck.rows.length > 0 ? '✅ Found' : '❌ Not found');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.detail) {
      console.error('Error detail:', error.detail);
    }
  } finally {
    await pool.end();
  }
}

testConnection().then(() => {
  console.log('🏁 Database test completed');
  process.exit(0);
});
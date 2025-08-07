import { pool } from '../server/db.js';
import fs from 'fs';

async function exportData() {
  try {
    const client = await pool.connect();
    
    // Export admin users
    const adminUsers = await client.query('SELECT * FROM admin_users');
    console.log('Admin users found:', adminUsers.rows.length);
    
    // Export businesses 
    const businesses = await client.query('SELECT * FROM businesses');
    console.log('Businesses found:', businesses.rows.length);
    
    // Export document transactions
    const documents = await client.query('SELECT * FROM document_transactions');
    console.log('Document transactions found:', documents.rows.length);
    
    // Create export data
    const exportData = {
      timestamp: new Date().toISOString(),
      admin_users: adminUsers.rows,
      businesses: businesses.rows,
      document_transactions: documents.rows
    };
    
    // Write to file
    fs.writeFileSync('data-export.json', JSON.stringify(exportData, null, 2));
    console.log('Data exported to data-export.json');
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

exportData();
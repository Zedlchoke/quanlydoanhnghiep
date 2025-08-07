import { Pool } from 'pg';
import fs from 'fs';

// This script sets up the production database with initial data
async function setupDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ 
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('Connected to database');

    // Create admin user if not exists
    await client.query(`
      INSERT INTO admin_users (username, password) 
      VALUES ('quanadmin', '01020811')
      ON CONFLICT (username) DO NOTHING
    `);
    console.log('Admin user created/verified');

    // If data-export.json exists, import data
    if (fs.existsSync('data-export.json')) {
      const exportData = JSON.parse(fs.readFileSync('data-export.json', 'utf8'));
      
      // Import businesses
      for (const business of exportData.businesses) {
        try {
          await client.query(`
            INSERT INTO businesses (name, tax_id, address, phone, email, website, industry, contact_person, account, password, bank_account, bank_name, custom_fields, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (tax_id) DO NOTHING
          `, [
            business.name, business.taxId, business.address, business.phone, business.email,
            business.website, business.industry, business.contactPerson, business.account,
            business.password, business.bankAccount, business.bankName, 
            business.customFields || {}, business.notes
          ]);
        } catch (err) {
          console.log(`Skipped duplicate business: ${business.name}`);
        }
      }
      console.log('Businesses imported');

      // Import document transactions
      for (const doc of exportData.document_transactions) {
        try {
          await client.query(`
            INSERT INTO document_transactions (business_id, document_type, transaction_type, handled_by, transaction_date, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [doc.businessId, doc.documentType, doc.transactionType, doc.handledBy, doc.transactionDate, doc.notes]);
        } catch (err) {
          console.log(`Error importing document transaction: ${err.message}`);
        }
      }
      console.log('Document transactions imported');
    }

    client.release();
    console.log('Database setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
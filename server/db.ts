import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Optimized connection configuration for Railway production
const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // COST-OPTIMIZED for Railway free tier
  connectionTimeoutMillis: 4000,    // Balanced timeout
  idleTimeoutMillis: 12000,         // Shorter idle for cost efficiency
  query_timeout: 4000,              // Sufficient for complex queries
  statement_timeout: 6000,          // Safe timeout
  
  // MINIMAL connection pool for cost efficiency
  max: 4,                          // Reduced connections (Railway efficient)
  min: 0,                          // Zero idle connections = cost savings
  acquireTimeoutMillis: 3000,      // Fast acquire
  createTimeoutMillis: 3000,       // Fast creation
  destroyTimeoutMillis: 1500,      // Quick cleanup
  reapIntervalMillis: 800,         // Frequent cleanup for cost control
  createRetryIntervalMillis: 150,  // Fast retry
  
  // Railway-specific optimizations
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
}

export const pool = new Pool(connectionConfig);
export const db = drizzle(pool, { schema });

// Test connection on startup
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connections...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connections...');
  await pool.end();
  process.exit(0);
});
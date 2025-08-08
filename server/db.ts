import 'dotenv/config';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

// Use SQLite for development in WebContainer
const sqlite = new Database('business_data.db');
export const db = drizzle(sqlite, { schema });

// Create a mock pool object for compatibility
export const pool = {
  connect: async () => ({
    query: async (sql: string, params?: any[]) => {
      // Convert PostgreSQL queries to SQLite format for basic operations
      return { rows: [] };
    },
    release: () => {}
  })
};
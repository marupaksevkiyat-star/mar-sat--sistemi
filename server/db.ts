import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// PRODUCTION FIX: Use standard PostgreSQL driver instead of Neon serverless
// This eliminates WebSocket connection issues completely
const poolConfig = {
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 10000,
  query_timeout: 10000,
};

console.log('🔧 Using standard PostgreSQL driver for stable connection');
export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });
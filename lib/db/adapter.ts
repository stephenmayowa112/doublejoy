/**
 * Database Adapter
 * 
 * Automatically chooses between SQLite (local dev) and Postgres (production)
 * based on environment variables
 */

// Check if Postgres connection string is available
const isPostgres = !!(process.env.POSTGRES_URL || (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')));

// Import appropriate module based on database type
let dbModule: any;

if (isPostgres) {
  console.log('Using Postgres/Neon database');
  dbModule = await import('./connection-postgres.ts');
} else {
  console.log('Using SQLite database');
  dbModule = await import('./connection.ts');
}

// Export all database functions
export const query = dbModule.query;
export const queryOne = dbModule.queryOne;
export const execute = dbModule.execute;
export const transaction = dbModule.transaction;
export const executeBatch = dbModule.executeBatch;
export const isDatabaseHealthy = dbModule.isDatabaseHealthy;
export const closeDatabase = dbModule.closeDatabase;
export const getDatabase = dbModule.getDatabase;
export const initializeDatabase = dbModule.initializeDatabase;

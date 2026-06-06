/**
 * Database Connection Module (Postgres/Neon)
 * 
 * Provides database client initialization and query execution for Postgres
 * Compatible with Vercel Postgres (Neon) in production and local development
 * 
 * Requirements: 10.2 (SQL injection prevention via parameterized queries)
 */

import { neon, neonConfig } from '@neondatabase/serverless';

// Enable fetch mode for edge runtime compatibility
neonConfig.fetchConnectionCache = true;

/**
 * Get the database client
 * Uses environment variable POSTGRES_URL for connection
 */
function getClient() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('POSTGRES_URL or DATABASE_URL environment variable is required for Postgres connection');
  }
  
  return neon(connectionString);
}

/**
 * Execute a SELECT query with parameterized values
 * Prevents SQL injection by using prepared statements
 * 
 * @param queryText SQL query string with $1, $2, etc. placeholders
 * @param params Query parameters
 * @returns Array of result rows
 */
export async function query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  try {
    const sql = getClient();
    // Use the neon client's parameterized query support
    // Build the query with placeholders
    const results = await sql(queryText, params) as any;
    return results as T[];
  } catch (error) {
    console.error('Query execution failed:', { query: queryText, error });
    throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute a SELECT query and return a single row
 * Prevents SQL injection by using prepared statements
 * 
 * @param queryText SQL query string with $1, $2, etc. placeholders
 * @param params Query parameters
 * @returns Single result row or undefined
 */
export async function queryOne<T = any>(queryText: string, params: any[] = []): Promise<T | undefined> {
  const results = await query<T>(queryText, params);
  return results[0];
}

/**
 * Execute an INSERT, UPDATE, or DELETE query
 * Prevents SQL injection by using prepared statements
 * 
 * @param queryText SQL query string with $1, $2, etc. placeholders
 * @param params Query parameters
 * @returns Query execution result with rowCount
 */
export async function execute(queryText: string, params: any[] = []): Promise<{ rowCount: number; lastInsertId?: string }> {
  try {
    const sql = getClient();
    const result = await sql(queryText, params) as any;
    
    return {
      rowCount: result.length || 0,
      lastInsertId: result[0]?.id,
    };
  } catch (error) {
    console.error('Query execution failed:', { query: queryText, error });
    throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute multiple queries in a transaction
 * Note: Neon serverless doesn't support traditional transactions
 * This is a compatibility wrapper
 * 
 * @param callback Function containing queries to execute
 * @returns Result of the callback function
 */
export async function transaction<T>(callback: () => Promise<T>): Promise<T> {
  try {
    // Execute the callback
    // Note: For true transactions, consider using Neon's transaction API
    // or upgrading to a connection pooler
    return await callback();
  } catch (error) {
    console.error('Transaction failed:', error);
    throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute a batch of queries with parameters
 * 
 * @param queryText SQL query string with $1, $2, etc. placeholders
 * @param paramsList Array of parameter arrays
 * @returns Array of execution results
 */
export async function executeBatch(queryText: string, paramsList: any[][]): Promise<any[]> {
  const results = [];
  
  for (const params of paramsList) {
    const result = await execute(queryText, params);
    results.push(result);
  }
  
  return results;
}

/**
 * Check if the database connection is healthy
 * 
 * @returns true if database is accessible, false otherwise
 */
export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Initialize database schema (create tables if they don't exist)
 */
export async function initializeSchema(): Promise<void> {
  const sql = getClient();
  
  // Create messages table
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email_encrypted TEXT,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      is_hidden BOOLEAN DEFAULT FALSE NOT NULL,
      ip_address_hash VARCHAR(64) NOT NULL
    )
  `;
  
  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_messages_is_hidden ON messages(is_hidden)`;
  
  // Create uploads table
  await sql`
    CREATE TABLE IF NOT EXISTS uploads (
      id VARCHAR(36) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      drive_file_id VARCHAR(255) NOT NULL,
      file_type VARCHAR(10) NOT NULL,
      file_size BIGINT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      ip_address_hash VARCHAR(64) NOT NULL
    )
  `;
  
  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_uploads_uploaded_at ON uploads(uploaded_at DESC)`;
  
  // Create moderation_log table
  await sql`
    CREATE TABLE IF NOT EXISTS moderation_log (
      id VARCHAR(36) PRIMARY KEY,
      message_id VARCHAR(36) NOT NULL,
      action_type VARCHAR(20) NOT NULL,
      admin_id VARCHAR(100),
      action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `;
  
  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_moderation_log_message_id ON moderation_log(message_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_moderation_log_action_timestamp ON moderation_log(action_timestamp DESC)`;
  
  console.log('Database schema initialized successfully');
}

export const closeDatabase = () => {
  // Neon serverless doesn't require explicit connection closing
  console.log('Database connections are automatically managed');
};

export const getDatabase = getClient;
export const initializeDatabase = initializeSchema;

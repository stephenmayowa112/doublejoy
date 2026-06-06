/**
 * Database Connection Module
 * 
 * Provides database client initialization, connection pooling, and query execution
 * with parameterized query support to prevent SQL injection attacks.
 * 
 * Requirements: 10.2 (SQL injection prevention via parameterized queries)
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Singleton database instance
let db: Database.Database | null = null;

/**
 * Initialize the database connection
 * Creates the database file and directory if they don't exist
 * 
 * @returns Database instance
 * @throws Error if database initialization fails
 */
export function initializeDatabase(): Database.Database {
  if (db) {
    return db;
  }

  // Evaluate database path dynamically at initialization time
  const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'wedding.db');
  const dbDir = path.dirname(dbPath);

  try {
    // Ensure the database directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Create database connection with optimized settings
    db = new Database(dbPath, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    });

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Set busy timeout to 5 seconds
    db.pragma('busy_timeout = 5000');

    console.log(`Database initialized at: ${dbPath}`);
    
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the database instance
 * Initializes the database if not already initialized
 * 
 * @returns Database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}

/**
 * Close the database connection
 * Should be called during application shutdown
 */
export function closeDatabase(): void {
  if (db) {
    try {
      db.close();
      db = null;
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}

/**
 * Convert Postgres-style $1, $2, $3 placeholders to SQLite ? placeholders
 * This allows the same SQL queries to work with both databases
 * 
 * @param query SQL query string with $1, $2, etc. placeholders
 * @returns SQL query string with ? placeholders
 */
function convertPlaceholders(query: string): string {
  // Replace $1, $2, $3, etc. with ?
  return query.replace(/\$\d+/g, '?');
}

/**
 * Convert Postgres CURRENT_TIMESTAMP to SQLite datetime('now')
 * 
 * @param query SQL query string
 * @returns SQL query string with SQLite datetime syntax
 */
function convertTimestamp(query: string): string {
  return query.replace(/CURRENT_TIMESTAMP/gi, "datetime('now')");
}

/**
 * Convert Postgres boolean values to SQLite integers
 * 
 * @param params Query parameters
 * @returns Parameters with booleans converted to 0/1
 */
function convertBooleans(params: any[]): any[] {
  return params.map(param => {
    if (typeof param === 'boolean') {
      return param ? 1 : 0;
    }
    return param;
  });
}

/**
 * Prepare query for SQLite by converting Postgres syntax
 * 
 * @param query SQL query string
 * @param params Query parameters
 * @returns Converted query and parameters
 */
function prepareForSQLite(query: string, params: any[]): { query: string; params: any[] } {
  let convertedQuery = convertPlaceholders(query);
  convertedQuery = convertTimestamp(convertedQuery);
  const convertedParams = convertBooleans(params);
  return { query: convertedQuery, params: convertedParams };
}

/**
 * Execute a SELECT query with parameterized values
 * Prevents SQL injection by using prepared statements
 * 
 * @param query SQL query string with $1, $2, etc. placeholders (Postgres style)
 * @param params Query parameters
 * @returns Array of result rows
 * @throws Error if query execution fails
 */
export function query<T = any>(query: string, params: any[] = []): T[] {
  try {
    const database = getDatabase();
    const { query: sqliteQuery, params: sqliteParams } = prepareForSQLite(query, params);
    console.log(sqliteQuery);
    const stmt = database.prepare(sqliteQuery);
    const results = stmt.all(...sqliteParams) as T[];
    return results;
  } catch (error) {
    console.error('Query execution failed:', { query, error });
    throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute a SELECT query and return a single row
 * Prevents SQL injection by using prepared statements
 * 
 * @param query SQL query string with $1, $2, etc. placeholders (Postgres style)
 * @param params Query parameters
 * @returns Single result row or undefined
 * @throws Error if query execution fails
 */
export function queryOne<T = any>(query: string, params: any[] = []): T | undefined {
  try {
    const database = getDatabase();
    const { query: sqliteQuery, params: sqliteParams } = prepareForSQLite(query, params);
    console.log(sqliteQuery);
    const stmt = database.prepare(sqliteQuery);
    const result = stmt.get(...sqliteParams) as T | undefined;
    return result;
  } catch (error) {
    console.error('Query execution failed:', { query, error });
    throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute an INSERT, UPDATE, or DELETE query
 * Prevents SQL injection by using prepared statements
 * 
 * @param query SQL query string with $1, $2, etc. placeholders (Postgres style)
 * @param params Query parameters
 * @returns Query execution info (changes, lastInsertRowid)
 * @throws Error if query execution fails
 */
export function execute(query: string, params: any[] = []): Database.RunResult {
  try {
    const database = getDatabase();
    const { query: sqliteQuery, params: sqliteParams } = prepareForSQLite(query, params);
    console.log(sqliteQuery);
    const stmt = database.prepare(sqliteQuery);
    const result = stmt.run(...sqliteParams);
    return result;
  } catch (error) {
    console.error('Query execution failed:', { query, error });
    throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute multiple queries in a transaction
 * All queries succeed or all fail (atomic operation)
 * 
 * @param callback Function containing queries to execute in transaction
 * @returns Result of the callback function
 * @throws Error if transaction fails
 */
export async function transaction<T>(callback: () => Promise<T> | T): Promise<T> {
  const database = getDatabase();
  
  try {
    // Begin transaction
    database.prepare('BEGIN').run();
    
    // Execute callback
    const result = await callback();
    
    // Commit transaction
    database.prepare('COMMIT').run();
    
    return result;
  } catch (error) {
    // Rollback on error
    try {
      database.prepare('ROLLBACK').run();
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
    
    console.error('Transaction failed:', error);
    throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute a batch of queries with parameters
 * Useful for bulk inserts or updates
 * 
 * @param query SQL query string with $1, $2, etc. placeholders (Postgres style)
 * @param paramsList Array of parameter arrays
 * @returns Array of execution results
 * @throws Error if batch execution fails
 */
export function executeBatch(query: string, paramsList: any[][]): Database.RunResult[] {
  const database = getDatabase();
  
  try {
    const { query: sqliteQuery } = prepareForSQLite(query, []);
    const stmt = database.prepare(sqliteQuery);
    const results: Database.RunResult[] = [];
    
    // Use transaction for better performance
    database.prepare('BEGIN').run();
    
    for (const params of paramsList) {
      const convertedParams = convertBooleans(params);
      results.push(stmt.run(...convertedParams));
    }
    
    database.prepare('COMMIT').run();
    
    return results;
  } catch (error) {
    // Rollback on error
    try {
      database.prepare('ROLLBACK').run();
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
    
    console.error('Batch execution failed:', { query, error });
    throw new Error(`Batch execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if the database connection is healthy
 * 
 * @returns true if database is accessible, false otherwise
 */
export function isDatabaseHealthy(): boolean {
  try {
    const database = getDatabase();
    database.prepare('SELECT 1').get();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    closeDatabase();
  });
  
  process.on('SIGINT', () => {
    closeDatabase();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    closeDatabase();
    process.exit(0);
  });
}

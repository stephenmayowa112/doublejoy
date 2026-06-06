/**
 * Database Adapter
 * 
 * Automatically chooses between SQLite (local dev) and Postgres (production)
 * based on environment variables
 */

// Check if Postgres connection string is available
const isPostgres = !!(process.env.POSTGRES_URL || (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')));

// Lazy-loaded database module
let dbModule: any = null;
let dbModulePromise: Promise<any> | null = null;

/**
 * Get the database module (lazy load on first access)
 */
async function getDbModule() {
  if (dbModule) {
    return dbModule;
  }
  
  if (!dbModulePromise) {
    if (isPostgres) {
      console.log('Using Postgres/Neon database');
      dbModulePromise = import('./connection-postgres.ts');
    } else {
      console.log('Using SQLite database');
      dbModulePromise = import('./connection.ts');
    }
  }
  
  dbModule = await dbModulePromise;
  return dbModule;
}

/**
 * Execute a SELECT query with parameterized values
 */
export async function query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  const module = await getDbModule();
  return module.query(queryText, params);
}

/**
 * Execute a SELECT query and return a single row
 */
export async function queryOne<T = any>(queryText: string, params: any[] = []): Promise<T | undefined> {
  const module = await getDbModule();
  return module.queryOne(queryText, params);
}

/**
 * Execute an INSERT, UPDATE, or DELETE query
 */
export async function execute(queryText: string, params: any[] = []): Promise<any> {
  const module = await getDbModule();
  return module.execute(queryText, params);
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(callback: () => Promise<T> | T): Promise<T> {
  const module = await getDbModule();
  return module.transaction(callback);
}

/**
 * Execute a batch of queries with parameters
 */
export async function executeBatch(queryText: string, paramsList: any[][]): Promise<any[]> {
  const module = await getDbModule();
  return module.executeBatch(queryText, paramsList);
}

/**
 * Check if the database connection is healthy
 */
export async function isDatabaseHealthy(): Promise<boolean> {
  const module = await getDbModule();
  return module.isDatabaseHealthy();
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (dbModule) {
    dbModule.closeDatabase();
  }
}

/**
 * Get the database instance
 */
export async function getDatabase(): Promise<any> {
  const module = await getDbModule();
  return module.getDatabase();
}

/**
 * Initialize the database
 */
export async function initializeDatabase(): Promise<any> {
  const module = await getDbModule();
  return module.initializeDatabase();
}

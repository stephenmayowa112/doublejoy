/**
 * Database Migration Runner
 * 
 * Applies SQL migrations from the migrations directory to the database.
 * Run with: node scripts/runMigrations.js
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'wedding.db');
const MIGRATIONS_DIR = path.join(process.cwd(), 'lib', 'db', 'migrations');

/**
 * Get list of migration files sorted by filename
 */
function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('No migrations directory found');
    return [];
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();

  return files;
}

/**
 * Check if a migration has been applied
 */
function isMigrationApplied(db, migrationName) {
  try {
    const result = db.prepare(
      'SELECT 1 FROM migrations WHERE name = ?'
    ).get(migrationName);
    return !!result;
  } catch (error) {
    // migrations table doesn't exist yet
    return false;
  }
}

/**
 * Create migrations tracking table
 */
function createMigrationsTable(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `).run();
}

/**
 * Apply a single migration
 */
function applyMigration(db, filename) {
  const migrationPath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log(`Applying migration: ${filename}`);

  try {
    // Execute the migration SQL
    db.exec(sql);

    // Record the migration
    db.prepare(
      'INSERT INTO migrations (name) VALUES (?)'
    ).run(filename);

    console.log(`✓ Migration applied: ${filename}`);
  } catch (error) {
    console.error(`✗ Failed to apply migration ${filename}:`, error);
    throw error;
  }
}

/**
 * Run all pending migrations
 */
function runMigrations() {
  // Ensure data directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(DB_PATH);

  console.log('Starting database migrations...');
  console.log(`Database: ${DB_PATH}`);

  // Create migrations tracking table
  createMigrationsTable(db);

  // Get all migration files
  const migrationFiles = getMigrationFiles();

  if (migrationFiles.length === 0) {
    console.log('No migrations found');
    db.close();
    return;
  }

  // Apply each migration that hasn't been applied yet
  let appliedCount = 0;
  for (const filename of migrationFiles) {
    if (!isMigrationApplied(db, filename)) {
      applyMigration(db, filename);
      appliedCount++;
    } else {
      console.log(`⊘ Migration already applied: ${filename}`);
    }
  }

  db.close();

  if (appliedCount === 0) {
    console.log('\nAll migrations are up to date');
  } else {
    console.log(`\nApplied ${appliedCount} migration(s)`);
  }
}

// Run migrations
try {
  runMigrations();
  console.log('\nMigrations completed successfully ✓');
  process.exit(0);
} catch (error) {
  console.error('\nMigration failed:', error);
  process.exit(1);
}

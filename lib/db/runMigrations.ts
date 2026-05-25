/**
 * Database Migration Runner
 * 
 * Applies SQL migrations from the migrations directory to the database.
 * Migrations are applied in order based on their filename prefix.
 */

import { getDatabase } from './connection.js';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.join(process.cwd(), 'lib', 'db', 'migrations');

/**
 * Get list of migration files sorted by filename
 */
function getMigrationFiles(): string[] {
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
function isMigrationApplied(db: any, migrationName: string): boolean {
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
function createMigrationsTable(db: any): void {
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
function applyMigration(db: any, filename: string): void {
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
export function runMigrations(): void {
  const db = getDatabase();

  console.log('Starting database migrations...');

  // Create migrations tracking table
  createMigrationsTable(db);

  // Get all migration files
  const migrationFiles = getMigrationFiles();

  if (migrationFiles.length === 0) {
    console.log('No migrations found');
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

  if (appliedCount === 0) {
    console.log('All migrations are up to date');
  } else {
    console.log(`\nApplied ${appliedCount} migration(s)`);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  try {
    runMigrations();
    console.log('\nMigrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\nMigration failed:', error);
    process.exit(1);
  }
}

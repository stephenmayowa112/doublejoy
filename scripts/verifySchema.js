/**
 * Schema Verification Script
 * 
 * Verifies that the database schema matches the expected structure
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'wedding.db');

function verifySchema() {
  const db = new Database(DB_PATH, { readonly: true });

  console.log('Verifying database schema...\n');

  // Check messages table
  console.log('=== MESSAGES TABLE ===');
  const messagesSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='messages'").get();
  if (messagesSchema) {
    console.log('✓ Messages table exists');
    console.log('\nTable structure:');
    console.log(messagesSchema.sql);
    
    // Check indexes
    console.log('\nIndexes:');
    const indexes = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='messages'").all();
    indexes.forEach(idx => {
      if (idx.sql) { // Skip auto-created indexes
        console.log(`  - ${idx.name}`);
      }
    });
  } else {
    console.log('✗ Messages table does not exist');
  }

  // Check uploads table
  console.log('\n\n=== UPLOADS TABLE ===');
  const uploadsSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='uploads'").get();
  if (uploadsSchema) {
    console.log('✓ Uploads table exists');
    console.log('\nTable structure:');
    console.log(uploadsSchema.sql);
    
    // Check indexes
    console.log('\nIndexes:');
    const indexes = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='uploads'").all();
    indexes.forEach(idx => {
      if (idx.sql) {
        console.log(`  - ${idx.name}`);
      }
    });
  } else {
    console.log('✗ Uploads table does not exist');
  }

  // Check moderation_log table
  console.log('\n\n=== MODERATION_LOG TABLE ===');
  const moderationSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='moderation_log'").get();
  if (moderationSchema) {
    console.log('✓ Moderation log table exists');
    console.log('\nTable structure:');
    console.log(moderationSchema.sql);
    
    // Check indexes
    console.log('\nIndexes:');
    const indexes = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='moderation_log'").all();
    indexes.forEach(idx => {
      if (idx.sql) {
        console.log(`  - ${idx.name}`);
      }
    });
  } else {
    console.log('✗ Moderation log table does not exist');
  }

  // Check migrations table
  console.log('\n\n=== MIGRATIONS TABLE ===');
  const migrationsSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='migrations'").get();
  if (migrationsSchema) {
    console.log('✓ Migrations table exists');
    const appliedMigrations = db.prepare("SELECT name, applied_at FROM migrations ORDER BY applied_at").all();
    console.log('\nApplied migrations:');
    appliedMigrations.forEach(m => {
      console.log(`  - ${m.name} (${m.applied_at})`);
    });
  }

  db.close();
  console.log('\n✓ Schema verification complete');
}

try {
  verifySchema();
} catch (error) {
  console.error('Verification failed:', error);
  process.exit(1);
}

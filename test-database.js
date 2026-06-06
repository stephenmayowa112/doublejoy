/**
 * Database Integration Test Script
 * 
 * This script tests:
 * 1. Database connection
 * 2. Schema verification (tables exist)
 * 3. Insert operations (messages and uploads)
 * 4. Query operations
 * 5. Update operations (moderation)
 */

const Database = require('better-sqlite3');
const path = require('path');
const { randomUUID } = require('crypto');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

/**
 * Test database connection
 */
function testConnection() {
  log('\n🔌 Step 1: Testing Database Connection...', colors.blue);
  
  try {
    const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'wedding.db');
    logInfo(`Database path: ${dbPath}`);
    
    const db = new Database(dbPath);
    logSuccess('Database connection established');
    
    return db;
  } catch (error) {
    logError(`Failed to connect: ${error.message}`);
    throw error;
  }
}

/**
 * Verify database schema
 */
function verifySchema(db) {
  log('\n📋 Step 2: Verifying Database Schema...', colors.blue);
  
  const requiredTables = ['messages', 'uploads', 'moderation_log'];
  
  try {
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
    
    const tableNames = tables.map(t => t.name);
    logInfo(`Found tables: ${tableNames.join(', ')}`);
    
    for (const tableName of requiredTables) {
      if (tableNames.includes(tableName)) {
        logSuccess(`Table '${tableName}' exists`);
      } else {
        logError(`Table '${tableName}' is missing`);
        throw new Error(`Missing table: ${tableName}`);
      }
    }
    
    logSuccess('All required tables exist\n');
    return true;
  } catch (error) {
    logError(`Schema verification failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test message insertion
 */
function testMessageInsertion(db) {
  log('\n💬 Step 3: Testing Message Insertion...', colors.blue);
  
  try {
    const testMessage = {
      id: randomUUID(),
      name: 'Test Guest',
      email_encrypted: null,
      message: 'This is a test message from the database integration test.',
      ip_address_hash: 'test_hash_' + Date.now(),
      is_hidden: 0, // SQLite uses 0/1 for boolean
    };
    
    const stmt = db.prepare(`
      INSERT INTO messages (id, name, email_encrypted, message, ip_address_hash, is_hidden)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      testMessage.id,
      testMessage.name,
      testMessage.email_encrypted,
      testMessage.message,
      testMessage.ip_address_hash,
      testMessage.is_hidden
    );
    
    logSuccess(`Message inserted with ID: ${testMessage.id}`);
    logInfo(`Rows affected: ${result.changes}`);
    
    return testMessage.id;
  } catch (error) {
    logError(`Message insertion failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test upload metadata insertion
 */
function testUploadInsertion(db) {
  log('\n📤 Step 4: Testing Upload Metadata Insertion...', colors.blue);
  
  try {
    const testUpload = {
      id: randomUUID(),
      filename: 'test_photo.jpg',
      drive_file_id: 'test_drive_id_' + Date.now(),
      file_type: 'image',
      file_size: 1024000,
      mime_type: 'image/jpeg',
      ip_address_hash: 'test_hash_' + Date.now(),
    };
    
    const stmt = db.prepare(`
      INSERT INTO uploads (id, filename, drive_file_id, file_type, file_size, mime_type, ip_address_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      testUpload.id,
      testUpload.filename,
      testUpload.drive_file_id,
      testUpload.file_type,
      testUpload.file_size,
      testUpload.mime_type,
      testUpload.ip_address_hash
    );
    
    logSuccess(`Upload metadata inserted with ID: ${testUpload.id}`);
    logInfo(`Rows affected: ${result.changes}`);
    
    return testUpload.id;
  } catch (error) {
    logError(`Upload insertion failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test querying messages
 */
function testMessageQuery(db, messageId) {
  log('\n🔍 Step 5: Testing Message Query...', colors.blue);
  
  try {
    const stmt = db.prepare('SELECT * FROM messages WHERE id = ?');
    const message = stmt.get(messageId);
    
    if (message) {
      logSuccess('Message retrieved successfully');
      logInfo(`Name: ${message.name}`);
      logInfo(`Message: ${message.message}`);
      logInfo(`Created: ${message.created_at}`);
    } else {
      logError('Message not found');
      throw new Error('Message query failed');
    }
    
    return message;
  } catch (error) {
    logError(`Message query failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test querying uploads
 */
function testUploadQuery(db, uploadId) {
  log('\n🔍 Step 6: Testing Upload Query...', colors.blue);
  
  try {
    const stmt = db.prepare('SELECT * FROM uploads WHERE id = ?');
    const upload = stmt.get(uploadId);
    
    if (upload) {
      logSuccess('Upload metadata retrieved successfully');
      logInfo(`Filename: ${upload.filename}`);
      logInfo(`Drive File ID: ${upload.drive_file_id}`);
      logInfo(`File Type: ${upload.file_type}`);
      logInfo(`File Size: ${upload.file_size} bytes`);
    } else {
      logError('Upload not found');
      throw new Error('Upload query failed');
    }
    
    return upload;
  } catch (error) {
    logError(`Upload query failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test message moderation (update)
 */
function testModeration(db, messageId) {
  log('\n🛡️  Step 7: Testing Message Moderation...', colors.blue);
  
  try {
    // Hide the message
    const stmt = db.prepare('UPDATE messages SET is_hidden = ? WHERE id = ?');
    const result = stmt.run(1, messageId); // SQLite uses 1 for true
    
    logSuccess('Message hidden successfully');
    logInfo(`Rows affected: ${result.changes}`);
    
    // Verify the update
    const verifyStmt = db.prepare('SELECT is_hidden FROM messages WHERE id = ?');
    const message = verifyStmt.get(messageId);
    
    if (message && message.is_hidden === 1) {
      logSuccess('Moderation verified: message is hidden');
    } else {
      logError('Moderation verification failed');
      throw new Error('Moderation update not applied');
    }
    
    return true;
  } catch (error) {
    logError(`Moderation test failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test statistics query
 */
function testStatistics(db) {
  log('\n📊 Step 8: Testing Statistics Query...', colors.blue);
  
  try {
    // Count messages
    const messageCount = db.prepare('SELECT COUNT(*) as count FROM messages').get();
    logInfo(`Total messages: ${messageCount.count}`);
    
    // Count uploads
    const uploadCount = db.prepare('SELECT COUNT(*) as count FROM uploads').get();
    logInfo(`Total uploads: ${uploadCount.count}`);
    
    // Count visible messages
    const visibleCount = db.prepare('SELECT COUNT(*) as count FROM messages WHERE is_hidden = 0').get();
    logInfo(`Visible messages: ${visibleCount.count}`);
    
    logSuccess('Statistics retrieved successfully');
    
    return {
      messages: messageCount.count,
      uploads: uploadCount.count,
      visible: visibleCount.count,
    };
  } catch (error) {
    logError(`Statistics query failed: ${error.message}`);
    throw error;
  }
}

/**
 * Cleanup test data
 */
function cleanup(db, messageId, uploadId) {
  log('\n🧹 Step 9: Cleaning Up Test Data...', colors.blue);
  
  try {
    // Delete test message
    db.prepare('DELETE FROM messages WHERE id = ?').run(messageId);
    logSuccess('Test message deleted');
    
    // Delete test upload
    db.prepare('DELETE FROM uploads WHERE id = ?').run(uploadId);
    logSuccess('Test upload deleted');
    
    logSuccess('Cleanup completed\n');
  } catch (error) {
    logError(`Cleanup failed: ${error.message}`);
    // Don't throw - cleanup failure shouldn't fail the test
  }
}

/**
 * Main test function
 */
function runTest() {
  log('\n🚀 Starting Database Integration Test...', colors.blue);
  log('='.repeat(60), colors.blue);
  
  let db;
  let messageId;
  let uploadId;
  
  try {
    // Step 1: Connect to database
    db = testConnection();
    
    // Step 2: Verify schema
    verifySchema(db);
    
    // Step 3: Test message insertion
    messageId = testMessageInsertion(db);
    
    // Step 4: Test upload insertion
    uploadId = testUploadInsertion(db);
    
    // Step 5: Test message query
    testMessageQuery(db, messageId);
    
    // Step 6: Test upload query
    testUploadQuery(db, uploadId);
    
    // Step 7: Test moderation
    testModeration(db, messageId);
    
    // Step 8: Test statistics
    const stats = testStatistics(db);
    
    // Step 9: Cleanup
    cleanup(db, messageId, uploadId);
    
    // Success summary
    log('='.repeat(60), colors.green);
    logSuccess('🎉 All database tests passed!');
    log('='.repeat(60), colors.green);
    log('\n✨ Your database integration is working perfectly!\n', colors.cyan);
    
    // Close database
    db.close();
    
  } catch (error) {
    log('\n' + '='.repeat(60), colors.red);
    logError('❌ Database test failed. Please fix the issues above.');
    log('='.repeat(60), colors.red);
    console.error('\nError details:', error);
    
    // Cleanup on failure
    if (db && messageId && uploadId) {
      try {
        cleanup(db, messageId, uploadId);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
    
    if (db) {
      db.close();
    }
    
    process.exit(1);
  }
}

// Run the test
runTest();

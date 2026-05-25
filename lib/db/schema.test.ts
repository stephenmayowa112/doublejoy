/**
 * Database Schema Tests
 * 
 * Verifies that the database schema meets the requirements specified in
 * the design document for the guest interactions feature.
 * 
 * Requirements: 1.4, 8.3, 8.4
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { getDatabase } from './connection';

describe('Messages Table Schema', () => {
  let db: any;

  beforeAll(() => {
    db = getDatabase();
  });

  it('should have messages table', () => {
    const result = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='messages'"
    ).get();
    
    expect(result).toBeDefined();
    expect(result.name).toBe('messages');
  });

  it('should have all required columns', () => {
    const columns = db.prepare("PRAGMA table_info(messages)").all();
    const columnNames = columns.map((col: any) => col.name);

    // Verify all required columns exist
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('email_encrypted');
    expect(columnNames).toContain('message');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('is_hidden');
    expect(columnNames).toContain('ip_address_hash');
  });

  it('should have correct column types and constraints', () => {
    const columns = db.prepare("PRAGMA table_info(messages)").all();
    
    // Create a map for easy lookup
    const columnMap = new Map(columns.map((col: any) => [col.name, col]));

    // Verify id column
    const idCol = columnMap.get('id');
    expect(idCol.type).toBe('VARCHAR(36)');
    expect(idCol.pk).toBe(1); // Primary key
    // Note: PRIMARY KEY columns are implicitly NOT NULL in SQLite

    // Verify name column
    const nameCol = columnMap.get('name');
    expect(nameCol.type).toBe('VARCHAR(100)');
    expect(nameCol.notnull).toBe(1); // NOT NULL

    // Verify email_encrypted column
    const emailCol = columnMap.get('email_encrypted');
    expect(emailCol.type).toBe('TEXT');
    expect(emailCol.notnull).toBe(0); // Nullable (optional)

    // Verify message column
    const messageCol = columnMap.get('message');
    expect(messageCol.type).toBe('TEXT');
    expect(messageCol.notnull).toBe(1); // NOT NULL

    // Verify created_at column
    const createdAtCol = columnMap.get('created_at');
    expect(createdAtCol.type).toBe('TIMESTAMP');
    expect(createdAtCol.notnull).toBe(1); // NOT NULL
    expect(createdAtCol.dflt_value).toContain('CURRENT_TIMESTAMP');

    // Verify is_hidden column
    const isHiddenCol = columnMap.get('is_hidden');
    expect(isHiddenCol.type).toBe('BOOLEAN');
    expect(isHiddenCol.notnull).toBe(1); // NOT NULL
    expect(isHiddenCol.dflt_value).toBe('FALSE');

    // Verify ip_address_hash column
    const ipHashCol = columnMap.get('ip_address_hash');
    expect(ipHashCol.type).toBe('VARCHAR(64)');
    expect(ipHashCol.notnull).toBe(1); // NOT NULL
  });

  it('should have index on created_at column', () => {
    const indexes = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='messages' AND name='idx_messages_created_at'"
    ).get();
    
    expect(indexes).toBeDefined();
  });

  it('should have index on is_hidden column', () => {
    const indexes = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='messages' AND name='idx_messages_is_hidden'"
    ).get();
    
    expect(indexes).toBeDefined();
  });

  it('should have composite index for visible messages sorted by date', () => {
    const indexes = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='messages' AND name='idx_messages_visible_recent'"
    ).get();
    
    expect(indexes).toBeDefined();
  });

  it('should support UUID format for id field (36 characters)', () => {
    // Test that we can insert a UUID
    const testId = '123e4567-e89b-12d3-a456-426614174000';
    
    // Clean up any existing test data
    db.prepare('DELETE FROM messages WHERE id = ?').run(testId);
    
    // Insert test message
    const result = db.prepare(`
      INSERT INTO messages (id, name, message, ip_address_hash)
      VALUES (?, ?, ?, ?)
    `).run(testId, 'Test User', 'Test message', 'test_hash');
    
    expect(result.changes).toBe(1);
    
    // Verify it was inserted
    const inserted = db.prepare('SELECT id FROM messages WHERE id = ?').get(testId);
    expect(inserted.id).toBe(testId);
    
    // Clean up
    db.prepare('DELETE FROM messages WHERE id = ?').run(testId);
  });

  it('should enforce NOT NULL constraint on required fields', () => {
    // Try to insert without name (should fail)
    expect(() => {
      db.prepare(`
        INSERT INTO messages (id, message, ip_address_hash)
        VALUES (?, ?, ?)
      `).run('test-id-1', 'Test message', 'test_hash');
    }).toThrow();

    // Try to insert without message (should fail)
    expect(() => {
      db.prepare(`
        INSERT INTO messages (id, name, ip_address_hash)
        VALUES (?, ?, ?)
      `).run('test-id-2', 'Test User', 'test_hash');
    }).toThrow();

    // Try to insert without ip_address_hash (should fail)
    expect(() => {
      db.prepare(`
        INSERT INTO messages (id, name, message)
        VALUES (?, ?, ?)
      `).run('test-id-3', 'Test User', 'Test message');
    }).toThrow();
  });

  it('should allow NULL for optional email_encrypted field', () => {
    const testId = '123e4567-e89b-12d3-a456-426614174001';
    
    // Clean up any existing test data
    db.prepare('DELETE FROM messages WHERE id = ?').run(testId);
    
    // Insert without email (should succeed)
    const result = db.prepare(`
      INSERT INTO messages (id, name, message, ip_address_hash)
      VALUES (?, ?, ?, ?)
    `).run(testId, 'Test User', 'Test message', 'test_hash');
    
    expect(result.changes).toBe(1);
    
    // Verify email is NULL
    const inserted = db.prepare('SELECT email_encrypted FROM messages WHERE id = ?').get(testId);
    expect(inserted.email_encrypted).toBeNull();
    
    // Clean up
    db.prepare('DELETE FROM messages WHERE id = ?').run(testId);
  });

  it('should set default value for is_hidden to FALSE', () => {
    const testId = '123e4567-e89b-12d3-a456-426614174002';
    
    // Clean up any existing test data
    db.prepare('DELETE FROM messages WHERE id = ?').run(testId);
    
    // Insert without specifying is_hidden
    db.prepare(`
      INSERT INTO messages (id, name, message, ip_address_hash)
      VALUES (?, ?, ?, ?)
    `).run(testId, 'Test User', 'Test message', 'test_hash');
    
    // Verify is_hidden defaults to FALSE (0 in SQLite)
    const inserted = db.prepare('SELECT is_hidden FROM messages WHERE id = ?').get(testId);
    expect(inserted.is_hidden).toBe(0); // SQLite stores FALSE as 0
    
    // Clean up
    db.prepare('DELETE FROM messages WHERE id = ?').run(testId);
  });

  it('should set default value for created_at to current timestamp', () => {
    const testId = '123e4567-e89b-12d3-a456-426614174003';
    
    // Clean up any existing test data
    db.prepare('DELETE FROM messages WHERE id = ?').run(testId);
    
    // Insert without specifying created_at
    db.prepare(`
      INSERT INTO messages (id, name, message, ip_address_hash)
      VALUES (?, ?, ?, ?)
    `).run(testId, 'Test User', 'Test message', 'test_hash');
    
    // Verify created_at was set automatically
    const inserted = db.prepare('SELECT created_at FROM messages WHERE id = ?').get(testId);
    expect(inserted.created_at).toBeDefined();
    expect(typeof inserted.created_at).toBe('string');
    
    // Verify it's a valid timestamp format
    const createdAt = new Date(inserted.created_at);
    expect(createdAt.toString()).not.toBe('Invalid Date');
    
    // Clean up
    db.prepare('DELETE FROM messages WHERE id = ?').run(testId);
  });
});

describe('Schema Requirements Validation', () => {
  let db: any;

  beforeAll(() => {
    db = getDatabase();
  });

  it('should satisfy Requirement 1.4: Store messages with timestamps', () => {
    // Requirement 1.4: WHEN a guest submits a message with valid data, 
    // THE Backend_API SHALL store the message in the Database with a timestamp
    
    const columns = db.prepare("PRAGMA table_info(messages)").all();
    const columnNames = columns.map((col: any) => col.name);
    
    // Verify we have all fields needed to store a message
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('message');
    expect(columnNames).toContain('created_at');
    
    // Verify created_at has a default timestamp
    const createdAtCol = columns.find((col: any) => col.name === 'created_at');
    expect(createdAtCol.dflt_value).toContain('CURRENT_TIMESTAMP');
  });

  it('should satisfy Requirement 8.3: Support hiding messages without deletion', () => {
    // Requirement 8.3: WHERE an admin is authenticated, THE Backend_API SHALL 
    // allow flagging messages as hidden without permanent deletion
    
    const columns = db.prepare("PRAGMA table_info(messages)").all();
    const isHiddenCol = columns.find((col: any) => col.name === 'is_hidden');
    
    expect(isHiddenCol).toBeDefined();
    expect(isHiddenCol.type).toBe('BOOLEAN');
    expect(isHiddenCol.dflt_value).toBe('FALSE');
  });

  it('should satisfy Requirement 8.4: Exclude hidden messages from public display', () => {
    // Requirement 8.4: WHEN a message is flagged as hidden, THE UI_Component 
    // SHALL exclude it from the public message display
    
    // Verify we have is_hidden column
    const columns = db.prepare("PRAGMA table_info(messages)").all();
    const isHiddenCol = columns.find((col: any) => col.name === 'is_hidden');
    expect(isHiddenCol).toBeDefined();
    
    // Verify we have an index on is_hidden for efficient filtering
    const indexes = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='messages' AND name='idx_messages_is_hidden'"
    ).get();
    expect(indexes).toBeDefined();
  });
});

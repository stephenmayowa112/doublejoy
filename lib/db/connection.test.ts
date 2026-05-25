/**
 * Unit tests for database connection module
 * Tests basic functionality, parameterized queries, and error handling
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  query,
  queryOne,
  execute,
  transaction,
  executeBatch,
  isDatabaseHealthy,
} from './connection';
import fs from 'fs';
import path from 'path';

// Use a test database
const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test.db');

describe('Database Connection Module', () => {
  beforeAll(() => {
    // Set test database path
    process.env.DATABASE_URL = TEST_DB_PATH;
    
    // Clean up any existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    
    // Initialize database
    initializeDatabase();
    
    // Create a test table
    execute(`
      CREATE TABLE IF NOT EXISTS test_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  beforeEach(() => {
    // Clean up test data before each test
    execute('DELETE FROM test_users');
  });

  afterAll(() => {
    // Close database connection
    closeDatabase();
    
    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('Database Initialization', () => {
    it('should initialize database successfully', () => {
      const db = getDatabase();
      expect(db).toBeDefined();
    });

    it('should return the same instance on multiple calls', () => {
      const db1 = getDatabase();
      const db2 = getDatabase();
      expect(db1).toBe(db2);
    });

    it('should pass health check', () => {
      expect(isDatabaseHealthy()).toBe(true);
    });
  });

  describe('Parameterized Queries (SQL Injection Prevention)', () => {
    beforeEach(() => {
      // Insert test data for each test
      execute('INSERT INTO test_users (name, email) VALUES (?, ?)', ['Alice', 'alice@example.com']);
      execute('INSERT INTO test_users (name, email) VALUES (?, ?)', ['Bob', 'bob@example.com']);
    });

    it('should execute SELECT query with parameters', () => {
      const results = query<{ name: string; email: string }>(
        'SELECT name, email FROM test_users WHERE name = ?',
        ['Alice']
      );
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alice');
      expect(results[0].email).toBe('alice@example.com');
    });

    it('should handle SQL injection attempts safely', () => {
      // Attempt SQL injection - should be treated as literal string
      const maliciousInput = "'; DROP TABLE test_users; --";
      const results = query(
        'SELECT * FROM test_users WHERE name = ?',
        [maliciousInput]
      );
      
      // Should return no results (no user with that name)
      expect(results).toHaveLength(0);
      
      // Table should still exist
      const tableCheck = query("SELECT name FROM sqlite_master WHERE type='table' AND name='test_users'");
      expect(tableCheck).toHaveLength(1);
    });

    it('should execute queryOne and return single result', () => {
      const result = queryOne<{ name: string }>(
        'SELECT name FROM test_users WHERE email = ?',
        ['bob@example.com']
      );
      
      expect(result).toBeDefined();
      expect(result?.name).toBe('Bob');
    });

    it('should return undefined when queryOne finds no results', () => {
      const result = queryOne(
        'SELECT * FROM test_users WHERE name = ?',
        ['NonExistent']
      );
      
      expect(result).toBeUndefined();
    });
  });

  describe('Insert, Update, Delete Operations', () => {
    it('should execute INSERT and return lastInsertRowid', () => {
      const result = execute(
        'INSERT INTO test_users (name, email) VALUES (?, ?)',
        ['Charlie', 'charlie@example.com']
      );
      
      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid).toBeGreaterThan(0);
    });

    it('should execute UPDATE and return changes count', () => {
      // Insert a record first
      execute(
        'INSERT INTO test_users (name, email) VALUES (?, ?)',
        ['Charlie', 'charlie@example.com']
      );
      
      const result = execute(
        'UPDATE test_users SET email = ? WHERE name = ?',
        ['charlie.new@example.com', 'Charlie']
      );
      
      expect(result.changes).toBe(1);
    });

    it('should execute DELETE and return changes count', () => {
      // Insert a record first
      execute(
        'INSERT INTO test_users (name, email) VALUES (?, ?)',
        ['Charlie', 'charlie@example.com']
      );
      
      const result = execute(
        'DELETE FROM test_users WHERE name = ?',
        ['Charlie']
      );
      
      expect(result.changes).toBe(1);
    });
  });

  describe('Transactions', () => {
    it('should commit transaction on success', () => {
      const result = transaction(() => {
        execute('INSERT INTO test_users (name, email) VALUES (?, ?)', ['David', 'david@example.com']);
        execute('INSERT INTO test_users (name, email) VALUES (?, ?)', ['Eve', 'eve@example.com']);
        return 'success';
      });
      
      expect(result).toBe('success');
      
      // Verify both inserts succeeded
      const users = query('SELECT name FROM test_users WHERE name IN (?, ?)', ['David', 'Eve']);
      expect(users).toHaveLength(2);
    });

    it('should rollback transaction on error', () => {
      expect(() => {
        transaction(() => {
          execute('INSERT INTO test_users (name, email) VALUES (?, ?)', ['Frank', 'frank@example.com']);
          // This will fail due to NOT NULL constraint
          execute('INSERT INTO test_users (name, email) VALUES (?, ?)', [null, 'invalid@example.com']);
        });
      }).toThrow();
      
      // Verify Frank was not inserted (transaction rolled back)
      const users = query('SELECT name FROM test_users WHERE name = ?', ['Frank']);
      expect(users).toHaveLength(0);
    });
  });

  describe('Batch Operations', () => {
    it('should execute batch inserts', () => {
      const paramsList = [
        ['User1', 'user1@example.com'],
        ['User2', 'user2@example.com'],
        ['User3', 'user3@example.com'],
      ];
      
      const results = executeBatch(
        'INSERT INTO test_users (name, email) VALUES (?, ?)',
        paramsList
      );
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.changes === 1)).toBe(true);
      
      // Verify all users were inserted
      const users = query('SELECT name FROM test_users WHERE name LIKE ?', ['User%']);
      expect(users.length).toBeGreaterThanOrEqual(3);
    });

    it('should rollback batch on error', () => {
      const paramsList = [
        ['BatchUser1', 'batch1@example.com'],
        [null, 'invalid@example.com'], // This will fail
        ['BatchUser2', 'batch2@example.com'],
      ];
      
      expect(() => {
        executeBatch(
          'INSERT INTO test_users (name, email) VALUES (?, ?)',
          paramsList
        );
      }).toThrow();
      
      // Verify no batch users were inserted (all rolled back)
      const users = query('SELECT name FROM test_users WHERE name LIKE ?', ['BatchUser%']);
      expect(users).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid SQL', () => {
      expect(() => {
        query('INVALID SQL STATEMENT');
      }).toThrow();
    });

    it('should throw error for invalid table name', () => {
      expect(() => {
        query('SELECT * FROM nonexistent_table');
      }).toThrow();
    });

    it('should handle empty parameter arrays', () => {
      const results = query('SELECT * FROM test_users');
      expect(Array.isArray(results)).toBe(true);
    });
  });
});

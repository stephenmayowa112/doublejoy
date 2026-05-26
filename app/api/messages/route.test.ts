import fs from 'fs';
import path from 'path';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test-messages-route.db');
process.env.DATABASE_URL = TEST_DB_PATH;

// Mock the uuid package
jest.mock('uuid', () => ({
  v4: () => {
    const hex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
  },
  validate: (id: string) => true,
}));

// Mock the sanitization service to avoid dynamic jsdom import in Jest node environment
jest.mock('@/lib/services/sanitization', () => ({
  sanitizeMessage: jest.fn((msg: string) => {
    if (typeof msg !== 'string') return '';
    return msg.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
              .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
              .replace(/on\w+\s*=\s*[^>\s]+/gi, '')
              .replace(/javascript:/gi, '')
              .trim();
  }),
  sanitizeName: jest.fn((name: string) => {
    if (typeof name !== 'string') return '';
    return name.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
               .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
               .replace(/on\w+\s*=\s*[^>\s]+/gi, '')
               .trim();
  }),
  sanitizeEmail: jest.fn((email: string) => email ? email.trim() : ''),
  containsXSSPatterns: jest.fn(() => false),
}));

import { POST, GET } from './route';
import { NextRequest } from 'next/server';
import { execute, query, getDatabase, closeDatabase } from '@/lib/db/connection';
import { runMigrations } from '@/lib/db/runMigrations';
import { clearAllRateLimits } from '@/lib/services/rateLimit';
import { decrypt } from '@/lib/services/encryption';

// Mock environment variable for encryption
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing-purposes-only-32-bytes-long';

describe('Messages API Endpoints', () => {
  beforeAll(() => {
    // Reset the cached database singleton from other test suites
    closeDatabase();

    // Set test database path before initializing database
    process.env.DATABASE_URL = TEST_DB_PATH;
    
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch (e) {}
    }
    
    // Now we run the migrations on our isolated database
    runMigrations();
  });

  afterAll(() => {
    // Close database connection
    closeDatabase();
    
    // Clean up test database file
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch (e) {}
    }
  });

  describe('POST /api/messages', () => {
  beforeEach(() => {
    // Clear rate limits before each test
    clearAllRateLimits();

    // Clear messages table
    const db = getDatabase();
    db.prepare('DELETE FROM messages').run();
  });

  afterAll(() => {
    // Clean up
    const db = getDatabase();
    db.prepare('DELETE FROM messages').run();
  });

  /**
   * Helper function to create a mock NextRequest
   */
  function createMockRequest(body: any, headers: Record<string, string> = {}): NextRequest {
    const url = 'http://localhost:3000/api/messages';
    const request = new NextRequest(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.1',
        ...headers,
      },
      body: JSON.stringify(body),
    });
    return request;
  }

  describe('Successful message submission', () => {
    it('should create a message with valid data', async () => {
      const requestBody = {
        name: 'John Doe',
        message: 'Congratulations on your wedding!',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();
      expect(data.message.id).toBeDefined();
      expect(data.message.name).toBe('John Doe');
      expect(data.message.message).toBe('Congratulations on your wedding!');
      expect(data.message.createdAt).toBeDefined();
    });

    it('should create a message with email', async () => {
      const requestBody = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        message: 'Wishing you both a lifetime of happiness!',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();
      expect(data.message.name).toBe('Jane Smith');
      expect(data.message.message).toBe('Wishing you both a lifetime of happiness!');

      // Verify email is encrypted in database
      const messages = query('SELECT * FROM messages WHERE id = ?', [data.message.id]);
      expect(messages.length).toBe(1);
      expect(messages[0].email_encrypted).toBeDefined();
      expect(messages[0].email_encrypted).not.toBe('jane@example.com');

      // Verify email can be decrypted
      const decryptedEmail = decrypt(messages[0].email_encrypted);
      expect(decryptedEmail).toBe('jane@example.com');
    });

    it('should store message with timestamp', async () => {
      const requestBody = {
        name: 'Bob Johnson',
        message: 'May your love grow stronger every day!',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);

      // Verify timestamp in database
      const messages = query('SELECT * FROM messages WHERE id = ?', [data.message.id]);
      expect(messages.length).toBe(1);
      expect(messages[0].created_at).toBeDefined();
    });

    it('should hash IP address in database', async () => {
      const requestBody = {
        name: 'Alice Brown',
        message: 'Congratulations to the happy couple!',
      };

      const request = createMockRequest(requestBody, { 'x-forwarded-for': '10.0.0.1' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);

      // Verify IP is hashed in database
      const messages = query('SELECT * FROM messages WHERE id = ?', [data.message.id]);
      expect(messages.length).toBe(1);
      expect(messages[0].ip_address_hash).toBeDefined();
      expect(messages[0].ip_address_hash).not.toBe('10.0.0.1');
      expect(messages[0].ip_address_hash.length).toBe(64); // SHA-256 hex length
    });
  });

  describe('Validation errors', () => {
    it('should reject message with name too short', async () => {
      const requestBody = {
        name: 'A',
        message: 'This is a valid message with enough characters.',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.errors.name).toBeDefined();
    });

    it('should reject message with name too long', async () => {
      const requestBody = {
        name: 'A'.repeat(101),
        message: 'This is a valid message with enough characters.',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.errors.name).toBeDefined();
    });

    it('should reject message with message too short', async () => {
      const requestBody = {
        name: 'John Doe',
        message: 'Short',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.errors.message).toBeDefined();
    });

    it('should reject message with message too long', async () => {
      const requestBody = {
        name: 'John Doe',
        message: 'A'.repeat(1001),
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.errors.message).toBeDefined();
    });

    it('should reject message with invalid email', async () => {
      const requestBody = {
        name: 'John Doe',
        email: 'invalid-email',
        message: 'This is a valid message with enough characters.',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.errors.email).toBeDefined();
    });

    it('should reject message with missing name', async () => {
      const requestBody = {
        message: 'This is a valid message with enough characters.',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.errors.name).toBeDefined();
    });

    it('should reject message with missing message', async () => {
      const requestBody = {
        name: 'John Doe',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.errors.message).toBeDefined();
    });
  });

  describe('XSS sanitization', () => {
    it('should sanitize script tags in message', async () => {
      const requestBody = {
        name: 'John Doe',
        message: '<script>alert("xss")</script>Congratulations on your wedding!',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message.message).not.toContain('<script>');
      expect(data.message.message).not.toContain('alert');
    });

    it('should sanitize event handlers in message', async () => {
      const requestBody = {
        name: 'John Doe',
        message: '<img src=x onerror="alert(1)">Congratulations!',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message.message).not.toContain('onerror');
      expect(data.message.message).not.toContain('alert');
    });

    it('should sanitize javascript: protocol in message', async () => {
      const requestBody = {
        name: 'John Doe',
        message: '<a href="javascript:alert(1)">Click me</a> Congratulations!',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message.message).not.toContain('javascript:');
    });

    it('should sanitize script tags in name', async () => {
      const requestBody = {
        name: 'John<script>alert("xss")</script>Doe',
        message: 'Congratulations on your wedding!',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message.name).not.toContain('<script>');
      expect(data.message.name).not.toContain('alert');
    });
  });

  describe('Rate limiting', () => {
    it('should allow 3 messages from same IP', async () => {
      const requestBody = {
        name: 'John Doe',
        message: 'Congratulations on your wedding!',
      };

      // First message
      const request1 = createMockRequest(requestBody, { 'x-forwarded-for': '192.168.1.100' });
      const response1 = await POST(request1);
      expect(response1.status).toBe(201);

      // Second message
      const request2 = createMockRequest(requestBody, { 'x-forwarded-for': '192.168.1.100' });
      const response2 = await POST(request2);
      expect(response2.status).toBe(201);

      // Third message
      const request3 = createMockRequest(requestBody, { 'x-forwarded-for': '192.168.1.100' });
      const response3 = await POST(request3);
      expect(response3.status).toBe(201);
    });

    it('should reject 4th message from same IP', async () => {
      const requestBody = {
        name: 'John Doe',
        message: 'Congratulations on your wedding!',
      };

      // Submit 3 messages
      for (let i = 0; i < 3; i++) {
        const request = createMockRequest(requestBody, { 'x-forwarded-for': '192.168.1.101' });
        const response = await POST(request);
        expect(response.status).toBe(201);
      }

      // Fourth message should be rate limited
      const request4 = createMockRequest(requestBody, { 'x-forwarded-for': '192.168.1.101' });
      const response4 = await POST(request4);
      const data4 = await response4.json();

      expect(response4.status).toBe(429);
      expect(data4.success).toBe(false);
      expect(data4.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(data4.error.retryAfter).toBeDefined();
    });

    it('should allow messages from different IPs', async () => {
      const requestBody = {
        name: 'John Doe',
        message: 'Congratulations on your wedding!',
      };

      // Message from IP 1
      const request1 = createMockRequest(requestBody, { 'x-forwarded-for': '192.168.1.102' });
      const response1 = await POST(request1);
      expect(response1.status).toBe(201);

      // Message from IP 2
      const request2 = createMockRequest(requestBody, { 'x-forwarded-for': '192.168.1.103' });
      const response2 = await POST(request2);
      expect(response2.status).toBe(201);

      // Message from IP 3
      const request3 = createMockRequest(requestBody, { 'x-forwarded-for': '192.168.1.104' });
      const response3 = await POST(request3);
      expect(response3.status).toBe(201);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid JSON', async () => {
      const url = 'http://localhost:3000/api/messages';
      const request = new NextRequest(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_JSON');
    });
  });

  describe('SQL injection prevention', () => {
    it('should handle SQL injection in name', async () => {
      const requestBody = {
        name: "'; DROP TABLE messages; --",
        message: 'This is a valid message with enough characters.',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Should succeed because parameterized queries prevent SQL injection
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);

      // Verify the table still exists and the message was stored
      const messages = query('SELECT * FROM messages WHERE id = ?', [data.message.id]);
      expect(messages.length).toBe(1);
      expect(messages[0].name).toContain("DROP TABLE");
    });

    it('should handle SQL injection in message', async () => {
      const requestBody = {
        name: 'John Doe',
        message: "' OR '1'='1'; DROP TABLE messages; --",
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Should succeed because parameterized queries prevent SQL injection
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);

      // Verify the table still exists and the message was stored
      const messages = query('SELECT * FROM messages WHERE id = ?', [data.message.id]);
      expect(messages.length).toBe(1);
      expect(messages[0].message).toContain("DROP TABLE");
    });
  });
});

/**
 * Tests for GET /api/messages endpoint
 * 
 * Validates: Requirements 2.1, 2.3, 9.6
 */

describe('GET /api/messages', () => {
  beforeEach(() => {
    // Clear messages table
    const db = getDatabase();
    db.prepare('DELETE FROM messages').run();
  });

  /**
   * Helper function to create a mock GET NextRequest
   */
  function createMockGetRequest(queryParams: Record<string, string> = {}): NextRequest {
    const params = new URLSearchParams(queryParams);
    const url = `http://localhost:3000/api/messages?${params.toString()}`;
    const request = new NextRequest(url, {
      method: 'GET',
    });
    return request;
  }

  /**
   * Helper function to insert test messages
   */
  function insertTestMessages(count: number): void {
    const db = getDatabase();
    const stmt = db.prepare(
      `INSERT INTO messages (id, name, message, created_at, is_hidden, ip_address_hash)
       VALUES (?, ?, ?, datetime('now', ?), ?, ?)`
    );

    for (let i = 0; i < count; i++) {
      stmt.run(
        `test-id-${i}`,
        `Test User ${i}`,
        `Test message ${i} with enough characters to pass validation`,
        `${i} seconds`, // Offset to create different timestamps
        0,
        'test-hash'
      );
    }
  }

  /**
   * Helper function to insert hidden messages
   */
  function insertHiddenMessage(): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO messages (id, name, message, created_at, is_hidden, ip_address_hash)
       VALUES (?, ?, ?, datetime('now'), ?, ?)`
    ).run(
      'hidden-message-id',
      'Hidden User',
      'This message should not appear in public display',
      1,
      'test-hash'
    );
  }

  describe('Successful message retrieval', () => {
    it('should retrieve messages with default pagination', async () => {
      // Insert 25 test messages
      insertTestMessages(25);

      const request = createMockGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messages).toBeDefined();
      expect(data.messages.length).toBe(20); // Default limit
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(20);
      expect(data.pagination.total).toBe(25);
      expect(data.pagination.hasMore).toBe(true);
    });

    it('should retrieve messages with custom page and limit', async () => {
      // Insert 30 test messages
      insertTestMessages(30);

      const request = createMockGetRequest({ page: '2', limit: '10' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messages.length).toBe(10);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.total).toBe(30);
      expect(data.pagination.hasMore).toBe(true);
    });

    it('should enforce maximum limit of 50', async () => {
      // Insert 100 test messages
      insertTestMessages(100);

      const request = createMockGetRequest({ limit: '100' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messages.length).toBe(50); // Max limit enforced
      expect(data.pagination.limit).toBe(50);
    });

    it('should return hasMore=false on last page', async () => {
      // Insert 25 test messages
      insertTestMessages(25);

      const request = createMockGetRequest({ page: '2', limit: '20' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messages.length).toBe(5); // Remaining messages
      expect(data.pagination.hasMore).toBe(false);
    });

    it('should return empty array when no messages exist', async () => {
      const request = createMockGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messages).toEqual([]);
      expect(data.pagination.total).toBe(0);
      expect(data.pagination.hasMore).toBe(false);
    });

    it('should return messages in reverse chronological order', async () => {
      // Insert messages with different timestamps
      const db = getDatabase();
      
      // Insert older message
      db.prepare(
        `INSERT INTO messages (id, name, message, created_at, is_hidden, ip_address_hash)
         VALUES (?, ?, ?, datetime('now', '-2 hours'), ?, ?)`
      ).run('old-message', 'Old User', 'This is an older message with enough characters', 0, 'test-hash');

      // Insert newer message
      db.prepare(
        `INSERT INTO messages (id, name, message, created_at, is_hidden, ip_address_hash)
         VALUES (?, ?, ?, datetime('now', '-1 hour'), ?, ?)`
      ).run('new-message', 'New User', 'This is a newer message with enough characters', 0, 'test-hash');

      const request = createMockGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messages.length).toBe(2);
      
      // Newer message should come first
      expect(data.messages[0].id).toBe('new-message');
      expect(data.messages[1].id).toBe('old-message');
    });

    it('should exclude hidden messages from public display', async () => {
      // Insert visible messages
      insertTestMessages(5);
      
      // Insert hidden message
      insertHiddenMessage();

      const request = createMockGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messages.length).toBe(5); // Only visible messages
      expect(data.pagination.total).toBe(5); // Hidden message not counted
      
      // Verify hidden message is not in results
      const hiddenMessageInResults = data.messages.some((msg: any) => msg.id === 'hidden-message-id');
      expect(hiddenMessageInResults).toBe(false);
    });

    it('should include all required fields in message response', async () => {
      insertTestMessages(1);

      const request = createMockGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messages.length).toBe(1);
      
      const message = data.messages[0];
      expect(message.id).toBeDefined();
      expect(message.name).toBeDefined();
      expect(message.message).toBeDefined();
      expect(message.createdAt).toBeDefined();
      
      // Should not include sensitive fields
      expect(message.email_encrypted).toBeUndefined();
      expect(message.ip_address_hash).toBeUndefined();
      expect(message.is_hidden).toBeUndefined();
    });
  });

  describe('Validation errors', () => {
    it('should reject invalid page parameter', async () => {
      const request = createMockGetRequest({ page: 'invalid' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_PARAMETERS');
      expect(data.error.message).toContain('Page');
    });

    it('should reject negative page parameter', async () => {
      const request = createMockGetRequest({ page: '-1' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_PARAMETERS');
    });

    it('should reject zero page parameter', async () => {
      const request = createMockGetRequest({ page: '0' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_PARAMETERS');
    });

    it('should reject invalid limit parameter', async () => {
      const request = createMockGetRequest({ limit: 'invalid' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_PARAMETERS');
      expect(data.error.message).toContain('Limit');
    });

    it('should reject negative limit parameter', async () => {
      const request = createMockGetRequest({ limit: '-1' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_PARAMETERS');
    });

    it('should reject zero limit parameter', async () => {
      const request = createMockGetRequest({ limit: '0' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_PARAMETERS');
    });
  });

  describe('Caching behavior', () => {
    it('should cache message list for 60 seconds', async () => {
      // Insert initial messages
      insertTestMessages(5);

      // First request
      const request1 = createMockGetRequest();
      const response1 = await GET(request1);
      const data1 = await response1.json();

      expect(response1.status).toBe(200);
      expect(data1.messages.length).toBe(5);

      // Insert more messages
      insertTestMessages(5);

      // Second request (should return cached data)
      const request2 = createMockGetRequest();
      const response2 = await GET(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.messages.length).toBe(5); // Still cached, not 10
      expect(data2.pagination.total).toBe(5); // Still cached
    });

    it('should cache different pages separately', async () => {
      // Insert 30 messages
      insertTestMessages(30);

      // Request page 1
      const request1 = createMockGetRequest({ page: '1', limit: '10' });
      const response1 = await GET(request1);
      const data1 = await response1.json();

      expect(response1.status).toBe(200);
      expect(data1.messages.length).toBe(10);
      expect(data1.pagination.page).toBe(1);

      // Request page 2
      const request2 = createMockGetRequest({ page: '2', limit: '10' });
      const response2 = await GET(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.messages.length).toBe(10);
      expect(data2.pagination.page).toBe(2);

      // Verify different messages
      expect(data1.messages[0].id).not.toBe(data2.messages[0].id);
    });
  });
});
});

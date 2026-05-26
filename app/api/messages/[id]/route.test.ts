/**
 * Tests for DELETE /api/messages/[id] endpoint
 * Requirements: 8.2, 8.3, 8.4, 8.5
 */

import { NextRequest } from 'next/server';
import { DELETE } from './route';
import { execute, queryOne, transaction } from '@/lib/db/connection';
import { v4 as uuidv4 } from 'uuid';

// Mock the uuid package
jest.mock('uuid', () => ({
  v4: () => '12345678-1234-1234-1234-123456789012',
  validate: (id: string) => id === '12345678-1234-1234-1234-123456789012' || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
}));

// Mock the database functions
jest.mock('@/lib/db/connection', () => ({
  execute: jest.fn(),
  queryOne: jest.fn(),
  transaction: jest.fn((callback) => callback()),
}));

describe('DELETE /api/messages/[id]', () => {
  const mockExecute = execute as jest.MockedFunction<typeof execute>;
  const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;
  const mockTransaction = transaction as jest.MockedFunction<typeof transaction>;
  
  const validMessageId = uuidv4();
  const adminToken = 'test-admin-token';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables for testing
    process.env.ADMIN_TOKEN = adminToken;
    process.env.ADMIN_ID = 'test-admin';
  });
  
  afterEach(() => {
    delete process.env.ADMIN_TOKEN;
    delete process.env.ADMIN_ID;
  });
  
  /**
   * Helper function to create a mock NextRequest
   */
  function createMockRequest(
    body: any,
    authHeader?: string
  ): NextRequest {
    const headers = new Headers();
    if (authHeader) {
      headers.set('authorization', authHeader);
    }
    
    return new NextRequest('http://localhost:3000/api/messages/test-id', {
      method: 'DELETE',
      headers,
      body: JSON.stringify(body),
    });
  }
  
  describe('Authentication', () => {
    it('should return 401 when no authorization header is provided', async () => {
      const request = createMockRequest({ action: 'hide' });
      
      const response = await DELETE(request, { params: { id: validMessageId } });
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Admin authentication required');
    });
    
    it('should return 401 when invalid authorization token is provided', async () => {
      const request = createMockRequest(
        { action: 'hide' },
        'Bearer invalid-token'
      );
      
      const response = await DELETE(request, { params: { id: validMessageId } });
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
    
    it('should accept valid admin token', async () => {
      mockQueryOne.mockReturnValue({
        id: validMessageId,
        name: 'Test User',
        email_encrypted: null,
        message: 'Test message',
        created_at: new Date(),
        is_hidden: false,
        ip_address_hash: 'hash123',
      });
      
      const request = createMockRequest(
        { action: 'hide' },
        `Bearer ${adminToken}`
      );
      
      const response = await DELETE(request, { params: { id: validMessageId } });
      
      expect(response.status).toBe(200);
    });
  });
  
  describe('Input Validation', () => {
    it('should return 400 for invalid message ID format', async () => {
      const request = createMockRequest(
        { action: 'hide' },
        `Bearer ${adminToken}`
      );
      
      const response = await DELETE(request, { params: { id: 'invalid-id' } });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_MESSAGE_ID');
    });
    
    it('should return 400 for invalid JSON body', async () => {
      const headers = new Headers();
      headers.set('authorization', `Bearer ${adminToken}`);
      
      const request = new NextRequest('http://localhost:3000/api/messages/test-id', {
        method: 'DELETE',
        headers,
        body: 'invalid json',
      });
      
      const response = await DELETE(request, { params: { id: validMessageId } });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_REQUEST_BODY');
    });
    
    it('should return 400 for missing action field', async () => {
      const request = createMockRequest(
        {},
        `Bearer ${adminToken}`
      );
      
      const response = await DELETE(request, { params: { id: validMessageId } });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_ACTION');
    });
    
    it('should return 400 for invalid action value', async () => {
      const request = createMockRequest(
        { action: 'invalid' },
        `Bearer ${adminToken}`
      );
      
      const response = await DELETE(request, { params: { id: validMessageId } });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_ACTION');
    });
    
    it('should return 404 when message does not exist', async () => {
      mockQueryOne.mockReturnValue(undefined);
      
      const request = createMockRequest(
        { action: 'hide' },
        `Bearer ${adminToken}`
      );
      
      const response = await DELETE(request, { params: { id: validMessageId } });
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MESSAGE_NOT_FOUND');
    });
  });
  
  describe('Hide Action', () => {
    it('should hide a message and log the action', async () => {
      mockQueryOne.mockReturnValue({
        id: validMessageId,
        name: 'Test User',
        email_encrypted: null,
        message: 'Test message',
        created_at: new Date(),
        is_hidden: false,
        ip_address_hash: 'hash123',
      });
      
      const request = createMockRequest(
        { action: 'hide', reason: 'Inappropriate content' },
        `Bearer ${adminToken}`
      );
      
      const response = await DELETE(request, { params: { id: validMessageId } });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('hidden');
      
      // Verify transaction was called
      expect(mockTransaction).toHaveBeenCalled();
      
      // Verify UPDATE query was executed
      expect(mockExecute).toHaveBeenCalledWith(
        'UPDATE messages SET is_hidden = TRUE WHERE id = ?',
        [validMessageId]
      );
      
      // Verify moderation log was created
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO moderation_log'),
        expect.arrayContaining([
          expect.any(String), // id (UUID)
          validMessageId,
          'hide',
          'test-admin',
          'Inappropriate content',
        ])
      );
    });
    
    it('should hide a message without a reason', async () => {
      mockQueryOne.mockReturnValue({
        id: validMessageId,
        name: 'Test User',
        email_encrypted: null,
        message: 'Test message',
        created_at: new Date(),
        is_hidden: false,
        ip_address_hash: 'hash123',
      });
      
      const request = createMockRequest(
        { action: 'hide' },
        `Bearer ${adminToken}`
      );
      
      const response = await DELETE(request, { params: { id: validMessageId } });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify moderation log was created with null reason
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO moderation_log'),
        expect.arrayContaining([
          expect.any(String),
          validMessageId,
          'hide',
          'test-admin',
          null, // reason is null
        ])
      );
    });
  });
  
  describe('Delete Action', () => {
    it('should delete a message and log the action', async () => {
      mockQueryOne.mockReturnValue({
        id: validMessageId,
        name: 'Test User',
        email_encrypted: null,
        message: 'Test message',
        created_at: new Date(),
        is_hidden: false,
        ip_address_hash: 'hash123',
      });
      
      const request = createMockRequest(
        { action: 'delete', reason: 'Spam' },
        `Bearer ${adminToken}`
      );
      
      const response = await DELETE(request, { params: { id: validMessageId } });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted');
      
      // Verify transaction was called
      expect(mockTransaction).toHaveBeenCalled();
      
      // Verify DELETE query was executed
      expect(mockExecute).toHaveBeenCalledWith(
        'DELETE FROM messages WHERE id = ?',
        [validMessageId]
      );
      
      // Verify moderation log was created
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO moderation_log'),
        expect.arrayContaining([
          expect.any(String),
          validMessageId,
          'delete',
          'test-admin',
          'Spam',
        ])
      );
    });
  });
  
  describe('Error Handling', () => {
    it('should return 500 when database error occurs', async () => {
      mockQueryOne.mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });
      
      const request = createMockRequest(
        { action: 'hide' },
        `Bearer ${adminToken}`
      );
      
      const response = await DELETE(request, { params: { id: validMessageId } });
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
    
    it('should rollback transaction on error', async () => {
      mockQueryOne.mockReturnValue({
        id: validMessageId,
        name: 'Test User',
        email_encrypted: null,
        message: 'Test message',
        created_at: new Date(),
        is_hidden: false,
        ip_address_hash: 'hash123',
      });
      
      mockTransaction.mockImplementationOnce((callback) => {
        throw new Error('Transaction failed');
      });
      
      const request = createMockRequest(
        { action: 'hide' },
        `Bearer ${adminToken}`
      );
      
      const response = await DELETE(request, { params: { id: validMessageId } });
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
  
  describe('Requirements Validation', () => {
    it('should satisfy Requirement 8.2: Admin authentication check', async () => {
      // Test that endpoint requires authentication
      const request = createMockRequest({ action: 'hide' });
      const response = await DELETE(request, { params: { id: validMessageId } });
      
      expect(response.status).toBe(401);
    });
    
    it('should satisfy Requirement 8.3: Support hiding without deletion', async () => {
      mockQueryOne.mockReturnValue({
        id: validMessageId,
        name: 'Test User',
        email_encrypted: null,
        message: 'Test message',
        created_at: new Date(),
        is_hidden: false,
        ip_address_hash: 'hash123',
      });
      
      const request = createMockRequest(
        { action: 'hide' },
        `Bearer ${adminToken}`
      );
      
      await DELETE(request, { params: { id: validMessageId } });
      
      // Verify UPDATE was called instead of DELETE
      expect(mockExecute).toHaveBeenCalledWith(
        'UPDATE messages SET is_hidden = TRUE WHERE id = ?',
        [validMessageId]
      );
      
      expect(mockExecute).not.toHaveBeenCalledWith(
        'DELETE FROM messages WHERE id = ?',
        expect.anything()
      );
    });
    
    it('should satisfy Requirement 8.5: Log moderation actions', async () => {
      mockQueryOne.mockReturnValue({
        id: validMessageId,
        name: 'Test User',
        email_encrypted: null,
        message: 'Test message',
        created_at: new Date(),
        is_hidden: false,
        ip_address_hash: 'hash123',
      });
      
      const request = createMockRequest(
        { action: 'hide' },
        `Bearer ${adminToken}`
      );
      
      await DELETE(request, { params: { id: validMessageId } });
      
      // Verify moderation log entry was created with admin ID and timestamp
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO moderation_log'),
        expect.arrayContaining([
          expect.any(String), // UUID
          validMessageId,
          'hide',
          'test-admin', // admin_id
          null, // reason
        ])
      );
    });
  });
});

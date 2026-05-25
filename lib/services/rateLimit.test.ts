/**
 * Unit tests for Rate Limiting Service
 */

import {
  checkRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  clearAllRateLimits,
  RATE_LIMIT_CONFIGS,
} from './rateLimit';

describe('Rate Limiting Service', () => {
  beforeEach(() => {
    // Clear all rate limits before each test
    clearAllRateLimits();
  });

  describe('checkRateLimit', () => {
    it('should allow first request within limit', () => {
      const result = checkRateLimit('messages', '192.168.1.1');
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2); // 3 max - 1 used = 2 remaining
      expect(result.resetAt).toBeInstanceOf(Date);
      expect(result.error).toBeUndefined();
    });

    it('should allow multiple requests up to the limit', () => {
      const ipAddress = '192.168.1.2';
      
      // First request
      const result1 = checkRateLimit('messages', ipAddress);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(2);
      
      // Second request
      const result2 = checkRateLimit('messages', ipAddress);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1);
      
      // Third request
      const result3 = checkRateLimit('messages', ipAddress);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it('should block request when limit is exceeded', () => {
      const ipAddress = '192.168.1.3';
      
      // Use up all 3 allowed requests
      checkRateLimit('messages', ipAddress);
      checkRateLimit('messages', ipAddress);
      checkRateLimit('messages', ipAddress);
      
      // Fourth request should be blocked
      const result = checkRateLimit('messages', ipAddress);
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.error?.message).toBe('Too many requests. Please try again later.');
      expect(result.error?.retryAfter).toBeGreaterThan(0);
    });

    it('should enforce different limits for different endpoints', () => {
      const ipAddress = '192.168.1.4';
      
      // Messages endpoint: 3 requests allowed
      checkRateLimit('messages', ipAddress);
      checkRateLimit('messages', ipAddress);
      checkRateLimit('messages', ipAddress);
      const messagesResult = checkRateLimit('messages', ipAddress);
      expect(messagesResult.allowed).toBe(false);
      
      // Upload endpoint: 5 requests allowed (independent of messages)
      const uploadResult1 = checkRateLimit('upload', ipAddress);
      expect(uploadResult1.allowed).toBe(true);
      expect(uploadResult1.remaining).toBe(4);
    });

    it('should track rate limits independently per IP address', () => {
      const ip1 = '192.168.1.5';
      const ip2 = '192.168.1.6';
      
      // Use up all requests for ip1
      checkRateLimit('messages', ip1);
      checkRateLimit('messages', ip1);
      checkRateLimit('messages', ip1);
      const result1 = checkRateLimit('messages', ip1);
      expect(result1.allowed).toBe(false);
      
      // ip2 should still have full quota
      const result2 = checkRateLimit('messages', ip2);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(2);
    });

    it('should throw error for invalid endpoint', () => {
      expect(() => {
        checkRateLimit('', '192.168.1.1');
      }).toThrow('Invalid endpoint: must be a non-empty string');
      
      expect(() => {
        checkRateLimit('invalid-endpoint', '192.168.1.1');
      }).toThrow('No rate limit configuration found for endpoint: invalid-endpoint');
    });

    it('should throw error for invalid IP address', () => {
      expect(() => {
        checkRateLimit('messages', '');
      }).toThrow('Invalid IP address: must be a non-empty string');
    });

    it('should calculate retryAfter correctly', () => {
      const ipAddress = '192.168.1.7';
      
      // Use up all requests
      checkRateLimit('messages', ipAddress);
      checkRateLimit('messages', ipAddress);
      checkRateLimit('messages', ipAddress);
      
      // Check blocked request
      const result = checkRateLimit('messages', ipAddress);
      
      expect(result.error?.retryAfter).toBeDefined();
      expect(result.error?.retryAfter).toBeGreaterThan(0);
      expect(result.error?.retryAfter).toBeLessThanOrEqual(3600); // Should be within 1 hour
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for specific IP and endpoint', () => {
      const ipAddress = '192.168.1.8';
      
      // Use up all requests
      checkRateLimit('messages', ipAddress);
      checkRateLimit('messages', ipAddress);
      checkRateLimit('messages', ipAddress);
      
      // Verify limit is exceeded
      const blockedResult = checkRateLimit('messages', ipAddress);
      expect(blockedResult.allowed).toBe(false);
      
      // Reset rate limit
      resetRateLimit('messages', ipAddress);
      
      // Should be able to make requests again
      const allowedResult = checkRateLimit('messages', ipAddress);
      expect(allowedResult.allowed).toBe(true);
      expect(allowedResult.remaining).toBe(2);
    });

    it('should only reset specific endpoint for IP', () => {
      const ipAddress = '192.168.1.9';
      
      // Use up messages quota
      checkRateLimit('messages', ipAddress);
      checkRateLimit('messages', ipAddress);
      checkRateLimit('messages', ipAddress);
      
      // Use one upload quota
      checkRateLimit('upload', ipAddress);
      
      // Reset messages only
      resetRateLimit('messages', ipAddress);
      
      // Messages should be reset
      const messagesResult = checkRateLimit('messages', ipAddress);
      expect(messagesResult.allowed).toBe(true);
      expect(messagesResult.remaining).toBe(2);
      
      // Upload should still have used quota
      const uploadResult = checkRateLimit('upload', ipAddress);
      expect(uploadResult.allowed).toBe(true);
      expect(uploadResult.remaining).toBe(3); // 5 max - 1 used - 1 new = 3 remaining
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return status without incrementing counter', () => {
      const ipAddress = '192.168.1.10';
      
      // Check status without using quota
      const status1 = getRateLimitStatus('messages', ipAddress);
      expect(status1.allowed).toBe(true);
      expect(status1.remaining).toBe(3);
      
      // Check again - should still show full quota
      const status2 = getRateLimitStatus('messages', ipAddress);
      expect(status2.allowed).toBe(true);
      expect(status2.remaining).toBe(3);
      
      // Now actually use one request
      checkRateLimit('messages', ipAddress);
      
      // Status should reflect used quota
      const status3 = getRateLimitStatus('messages', ipAddress);
      expect(status3.allowed).toBe(true);
      expect(status3.remaining).toBe(2);
    });

    it('should return blocked status when limit exceeded', () => {
      const ipAddress = '192.168.1.11';
      
      // Use up all requests
      checkRateLimit('messages', ipAddress);
      checkRateLimit('messages', ipAddress);
      checkRateLimit('messages', ipAddress);
      
      // Check status
      const status = getRateLimitStatus('messages', ipAddress);
      expect(status.allowed).toBe(false);
      expect(status.remaining).toBe(0);
      expect(status.error).toBeDefined();
      expect(status.error?.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should throw error for invalid endpoint', () => {
      expect(() => {
        getRateLimitStatus('', '192.168.1.1');
      }).toThrow('Invalid endpoint: must be a non-empty string');
    });

    it('should throw error for invalid IP address', () => {
      expect(() => {
        getRateLimitStatus('messages', '');
      }).toThrow('Invalid IP address: must be a non-empty string');
    });
  });

  describe('clearAllRateLimits', () => {
    it('should clear all rate limit entries', () => {
      const ip1 = '192.168.1.12';
      const ip2 = '192.168.1.13';
      
      // Use some quota for multiple IPs and endpoints
      checkRateLimit('messages', ip1);
      checkRateLimit('messages', ip1);
      checkRateLimit('upload', ip2);
      
      // Clear all
      clearAllRateLimits();
      
      // All should have full quota again
      const result1 = checkRateLimit('messages', ip1);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(2);
      
      const result2 = checkRateLimit('upload', ip2);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(4);
    });
  });

  describe('RATE_LIMIT_CONFIGS', () => {
    it('should have correct configuration for messages endpoint', () => {
      expect(RATE_LIMIT_CONFIGS.messages).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.messages.maxRequests).toBe(3);
      expect(RATE_LIMIT_CONFIGS.messages.windowMs).toBe(60 * 60 * 1000); // 1 hour
    });

    it('should have correct configuration for upload endpoint', () => {
      expect(RATE_LIMIT_CONFIGS.upload).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.upload.maxRequests).toBe(5);
      expect(RATE_LIMIT_CONFIGS.upload.windowMs).toBe(60 * 60 * 1000); // 1 hour
    });
  });

  describe('Edge cases', () => {
    it('should handle IPv6 addresses', () => {
      const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      
      const result = checkRateLimit('messages', ipv6);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should handle localhost addresses', () => {
      const localhost = '127.0.0.1';
      
      const result = checkRateLimit('messages', localhost);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should handle rapid successive requests', () => {
      const ipAddress = '192.168.1.14';
      
      // Make 3 rapid requests
      const results = [
        checkRateLimit('messages', ipAddress),
        checkRateLimit('messages', ipAddress),
        checkRateLimit('messages', ipAddress),
      ];
      
      expect(results[0].allowed).toBe(true);
      expect(results[1].allowed).toBe(true);
      expect(results[2].allowed).toBe(true);
      
      // Fourth should be blocked
      const blockedResult = checkRateLimit('messages', ipAddress);
      expect(blockedResult.allowed).toBe(false);
    });
  });
});

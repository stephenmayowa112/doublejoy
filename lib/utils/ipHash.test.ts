import { hashIpAddress, sanitizeIpForLogging, createRateLimitKey } from './ipHash';

describe('IP Hash Utility', () => {
  describe('hashIpAddress', () => {
    it('should hash an IPv4 address consistently', () => {
      const ip = '192.168.1.1';
      const hash1 = hashIpAddress(ip);
      const hash2 = hashIpAddress(ip);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should hash an IPv6 address consistently', () => {
      const ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const hash1 = hashIpAddress(ip);
      const hash2 = hashIpAddress(ip);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce different hashes for different IP addresses', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';
      
      const hash1 = hashIpAddress(ip1);
      const hash2 = hashIpAddress(ip2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should trim whitespace from IP addresses', () => {
      const ip = '  192.168.1.1  ';
      const hash1 = hashIpAddress(ip);
      const hash2 = hashIpAddress('192.168.1.1');
      
      expect(hash1).toBe(hash2);
    });

    it('should throw error for empty string', () => {
      expect(() => hashIpAddress('')).toThrow('Invalid IP address: must be a non-empty string');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => hashIpAddress('   ')).toThrow('Invalid IP address: must be a non-empty string');
    });

    it('should throw error for null input', () => {
      expect(() => hashIpAddress(null as any)).toThrow('Invalid IP address: must be a non-empty string');
    });

    it('should throw error for undefined input', () => {
      expect(() => hashIpAddress(undefined as any)).toThrow('Invalid IP address: must be a non-empty string');
    });

    it('should throw error for non-string input', () => {
      expect(() => hashIpAddress(123 as any)).toThrow('Invalid IP address: must be a non-empty string');
    });

    it('should produce irreversible hash (one-way function)', () => {
      const ip = '192.168.1.1';
      const hash = hashIpAddress(ip);
      
      // Hash should not contain the original IP
      expect(hash).not.toContain('192');
      expect(hash).not.toContain('168');
      expect(hash).not.toContain('.');
    });
  });

  describe('sanitizeIpForLogging', () => {
    it('should mask last two octets of IPv4 address', () => {
      const ip = '192.168.1.1';
      const sanitized = sanitizeIpForLogging(ip);
      
      expect(sanitized).toBe('192.168.x.x');
    });

    it('should mask IPv4 address with different values', () => {
      const ip = '10.0.0.1';
      const sanitized = sanitizeIpForLogging(ip);
      
      expect(sanitized).toBe('10.0.x.x');
    });

    it('should mask IPv6 address keeping first two groups', () => {
      const ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const sanitized = sanitizeIpForLogging(ip);
      
      expect(sanitized).toBe('2001:0db8:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx');
    });

    it('should mask shortened IPv6 address', () => {
      const ip = '2001:db8::1';
      const sanitized = sanitizeIpForLogging(ip);
      
      expect(sanitized).toBe('2001:db8:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx');
    });

    it('should handle IPv4 with whitespace', () => {
      const ip = '  192.168.1.1  ';
      const sanitized = sanitizeIpForLogging(ip);
      
      expect(sanitized).toBe('192.168.x.x');
    });

    it('should return [invalid-ip] for empty string', () => {
      const sanitized = sanitizeIpForLogging('');
      
      expect(sanitized).toBe('[invalid-ip]');
    });

    it('should return [invalid-ip] for whitespace-only string', () => {
      const sanitized = sanitizeIpForLogging('   ');
      
      expect(sanitized).toBe('[invalid-ip]');
    });

    it('should return [invalid-ip] for null input', () => {
      const sanitized = sanitizeIpForLogging(null as any);
      
      expect(sanitized).toBe('[invalid-ip]');
    });

    it('should return [invalid-ip] for undefined input', () => {
      const sanitized = sanitizeIpForLogging(undefined as any);
      
      expect(sanitized).toBe('[invalid-ip]');
    });

    it('should return [masked-ip] for unrecognized format', () => {
      const sanitized = sanitizeIpForLogging('not-an-ip');
      
      expect(sanitized).toBe('[masked-ip]');
    });

    it('should not expose full IP address in output', () => {
      const ip = '192.168.123.45';
      const sanitized = sanitizeIpForLogging(ip);
      
      // Should not contain the last two octets
      expect(sanitized).not.toContain('123');
      expect(sanitized).not.toContain('45');
    });

    it('should handle malformed IPv4 (too few parts)', () => {
      const ip = '192.168.1';
      const sanitized = sanitizeIpForLogging(ip);
      
      expect(sanitized).toBe('[masked-ip]');
    });

    it('should handle malformed IPv4 (too many parts)', () => {
      const ip = '192.168.1.1.1';
      const sanitized = sanitizeIpForLogging(ip);
      
      expect(sanitized).toBe('[masked-ip]');
    });
  });

  describe('createRateLimitKey', () => {
    it('should create rate limit key with endpoint and hashed IP', () => {
      const endpoint = 'messages';
      const ip = '192.168.1.1';
      
      const key = createRateLimitKey(endpoint, ip);
      
      expect(key).toMatch(/^ratelimit:messages:[a-f0-9]{64}$/);
    });

    it('should create different keys for different endpoints', () => {
      const ip = '192.168.1.1';
      
      const key1 = createRateLimitKey('messages', ip);
      const key2 = createRateLimitKey('upload', ip);
      
      expect(key1).not.toBe(key2);
      expect(key1).toContain('messages');
      expect(key2).toContain('upload');
    });

    it('should create different keys for different IPs', () => {
      const endpoint = 'messages';
      
      const key1 = createRateLimitKey(endpoint, '192.168.1.1');
      const key2 = createRateLimitKey(endpoint, '192.168.1.2');
      
      expect(key1).not.toBe(key2);
    });

    it('should create consistent keys for same endpoint and IP', () => {
      const endpoint = 'messages';
      const ip = '192.168.1.1';
      
      const key1 = createRateLimitKey(endpoint, ip);
      const key2 = createRateLimitKey(endpoint, ip);
      
      expect(key1).toBe(key2);
    });

    it('should trim whitespace from endpoint', () => {
      const endpoint = '  messages  ';
      const ip = '192.168.1.1';
      
      const key1 = createRateLimitKey(endpoint, ip);
      const key2 = createRateLimitKey('messages', ip);
      
      expect(key1).toBe(key2);
    });

    it('should throw error for empty endpoint', () => {
      expect(() => createRateLimitKey('', '192.168.1.1')).toThrow('Invalid endpoint: must be a non-empty string');
    });

    it('should throw error for whitespace-only endpoint', () => {
      expect(() => createRateLimitKey('   ', '192.168.1.1')).toThrow('Invalid endpoint: must be a non-empty string');
    });

    it('should throw error for null endpoint', () => {
      expect(() => createRateLimitKey(null as any, '192.168.1.1')).toThrow('Invalid endpoint: must be a non-empty string');
    });

    it('should throw error for undefined endpoint', () => {
      expect(() => createRateLimitKey(undefined as any, '192.168.1.1')).toThrow('Invalid endpoint: must be a non-empty string');
    });

    it('should throw error for invalid IP address', () => {
      expect(() => createRateLimitKey('messages', '')).toThrow('Invalid IP address: must be a non-empty string');
    });

    it('should not expose IP address in plaintext in key', () => {
      const endpoint = 'messages';
      const ip = '192.168.1.1';
      
      const key = createRateLimitKey(endpoint, ip);
      
      // Key should not contain the original IP
      expect(key).not.toContain('192.168.1.1');
      expect(key).not.toContain('192');
      expect(key).not.toContain('168');
    });

    it('should work with IPv6 addresses', () => {
      const endpoint = 'upload';
      const ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      
      const key = createRateLimitKey(endpoint, ip);
      
      expect(key).toMatch(/^ratelimit:upload:[a-f0-9]{64}$/);
      expect(key).not.toContain('2001');
      expect(key).not.toContain('0db8');
    });
  });

  describe('Requirement 10.6: Sensitive data not logged in plaintext', () => {
    it('should ensure IP addresses are hashed before storage', () => {
      const ip = '203.0.113.42';
      const hash = hashIpAddress(ip);
      
      // Hash should be irreversible and not contain original IP
      expect(hash).not.toContain('203');
      expect(hash).not.toContain('113');
      expect(hash).not.toContain('42');
      expect(hash).toHaveLength(64);
    });

    it('should ensure IP addresses are masked for logging', () => {
      const ip = '203.0.113.42';
      const masked = sanitizeIpForLogging(ip);
      
      // Masked version should not expose last two octets
      expect(masked).toBe('203.0.x.x');
      expect(masked).not.toContain('113');
      expect(masked).not.toContain('42');
    });

    it('should ensure rate limit keys do not expose IP addresses', () => {
      const ip = '203.0.113.42';
      const key = createRateLimitKey('messages', ip);
      
      // Key should not contain original IP
      expect(key).not.toContain('203.0.113.42');
      expect(key).not.toContain('203');
      expect(key).not.toContain('113');
      expect(key).not.toContain('42');
    });
  });
});

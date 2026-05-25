import { encrypt, decrypt, generateEncryptionKey } from './encryption';

describe('Encryption Service', () => {
  const originalEnv = process.env.ENCRYPTION_KEY;

  beforeAll(() => {
    // Set a test encryption key
    process.env.ENCRYPTION_KEY = '14ff4b3469e7df6a1292eb83345511e710604df5edb2ac9d0480a03a9a07fdf0';
  });

  afterAll(() => {
    // Restore original environment
    process.env.ENCRYPTION_KEY = originalEnv;
  });

  describe('encrypt', () => {
    it('should encrypt a string value', () => {
      const plaintext = 'test@example.com';
      const encrypted = encrypt(plaintext);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:encryptedData
    });

    it('should produce different ciphertext for the same plaintext (due to random IV)', () => {
      const plaintext = 'test@example.com';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error when encrypting empty string', () => {
      expect(() => encrypt('')).toThrow('Cannot encrypt empty string');
    });

    it('should encrypt email addresses correctly', () => {
      const email = 'guest@wedding.com';
      const encrypted = encrypt(email);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toContain(email);
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted string back to original', () => {
      const plaintext = 'test@example.com';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt email addresses correctly', () => {
      const email = 'guest@wedding.com';
      const encrypted = encrypt(email);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(email);
    });

    it('should throw error when decrypting empty string', () => {
      expect(() => decrypt('')).toThrow('Cannot decrypt empty string');
    });

    it('should throw error when decrypting invalid format', () => {
      expect(() => decrypt('invalid')).toThrow('Invalid encrypted data format');
    });

    it('should throw error when decrypting data with invalid IV length', () => {
      const invalidData = 'YWJj:dGVzdA==:ZW5jcnlwdGVk'; // 'abc' is too short for IV
      expect(() => decrypt(invalidData)).toThrow('Invalid IV length');
    });

    it('should throw error when decrypting data with invalid auth tag length', () => {
      const validIV = Buffer.from('a'.repeat(16)).toString('base64');
      const invalidAuthTag = 'YWJj'; // too short
      const invalidData = `${validIV}:${invalidAuthTag}:ZW5jcnlwdGVk`;
      expect(() => decrypt(invalidData)).toThrow('Invalid auth tag length');
    });

    it('should throw error when decrypting tampered data', () => {
      const plaintext = 'test@example.com';
      const encrypted = encrypt(plaintext);
      
      // Tamper with the auth tag (second part)
      const parts = encrypted.split(':');
      const authTagBuffer = Buffer.from(parts[1], 'base64');
      authTagBuffer[0] = authTagBuffer[0] ^ 0xFF; // Flip bits in first byte
      parts[1] = authTagBuffer.toString('base64');
      const tampered = parts.join(':');
      
      expect(() => decrypt(tampered)).toThrow();
    });
  });

  describe('encrypt/decrypt round-trip', () => {
    it('should handle various email formats', () => {
      const emails = [
        'simple@example.com',
        'user+tag@example.com',
        'user.name@example.co.uk',
        'user_name@sub.example.com',
        'a@b.c',
      ];

      emails.forEach(email => {
        const encrypted = encrypt(email);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(email);
      });
    });

    it('should handle special characters', () => {
      const texts = [
        'test@example.com',
        'user+filter@domain.com',
        'name.surname@company.org',
        'test_user123@test.co.uk',
      ];

      texts.forEach(text => {
        const encrypted = encrypt(text);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(text);
      });
    });

    it('should handle long strings', () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      const encrypted = encrypt(longEmail);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(longEmail);
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a 64-character hex string', () => {
      const key = generateEncryptionKey();
      
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(key)).toBe(true);
    });

    it('should generate different keys each time', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('environment variable handling', () => {
    it('should throw error when ENCRYPTION_KEY is not set', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;
      
      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY environment variable is not set');
      
      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should accept 64-character hex string as key', () => {
      const hexKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.ENCRYPTION_KEY = hexKey;
      
      const plaintext = 'test@example.com';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should hash non-hex keys to create consistent key', () => {
      process.env.ENCRYPTION_KEY = 'my-secret-password';
      
      const plaintext = 'test@example.com';
      const encrypted1 = encrypt(plaintext);
      
      // Encrypt again with same key
      const encrypted2 = encrypt(plaintext);
      
      // Both should decrypt correctly
      expect(decrypt(encrypted1)).toBe(plaintext);
      expect(decrypt(encrypted2)).toBe(plaintext);
    });
  });

  describe('security properties', () => {
    it('should not expose plaintext in encrypted output', () => {
      const plaintext = 'secret@example.com';
      const encrypted = encrypt(plaintext);
      
      expect(encrypted).not.toContain('secret');
      expect(encrypted).not.toContain('example');
      expect(encrypted).not.toContain('@');
    });

    it('should use authenticated encryption (GCM mode)', () => {
      const plaintext = 'test@example.com';
      const encrypted = encrypt(plaintext);
      
      // GCM mode includes auth tag, which should be in the format
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      
      // Auth tag should be present and valid base64
      const authTag = parts[1];
      expect(authTag).toBeDefined();
      expect(Buffer.from(authTag, 'base64').length).toBe(16); // 128-bit auth tag
    });

    it('should use unique IV for each encryption', () => {
      const plaintext = 'test@example.com';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      
      const iv1 = encrypted1.split(':')[0];
      const iv2 = encrypted2.split(':')[0];
      
      expect(iv1).not.toBe(iv2);
    });
  });
});

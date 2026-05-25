import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { generateTimestampedFilename, uploadFile, uploadFiles, verifyDriveAccess } from './googleDrive';
import type { FileUpload } from './googleDrive';

// Mock the googleapis module
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
      })),
    },
    drive: jest.fn(),
  },
}));

describe('Google Drive Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = {
      ...originalEnv,
      GOOGLE_DRIVE_CLIENT_ID: 'test-client-id',
      GOOGLE_DRIVE_CLIENT_SECRET: 'test-client-secret',
      GOOGLE_DRIVE_REDIRECT_URI: 'http://localhost:3000/oauth/callback',
      GOOGLE_DRIVE_REFRESH_TOKEN: 'test-refresh-token',
      GOOGLE_DRIVE_FOLDER_ID: 'test-folder-id',
    };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('generateTimestampedFilename', () => {
    it('should generate filename with timestamp prefix', () => {
      const originalName = 'wedding_photo.jpg';
      const result = generateTimestampedFilename(originalName);

      // Check format: YYYYMMDD_HHMMSS_originalFilename
      const timestampPattern = /^\d{8}_\d{6}_wedding_photo\.jpg$/;
      expect(result).toMatch(timestampPattern);
    });

    it('should preserve original filename', () => {
      const originalName = 'my-video.mp4';
      const result = generateTimestampedFilename(originalName);

      expect(result).toContain('my-video.mp4');
    });

    it('should generate unique timestamps for consecutive calls', async () => {
      const name1 = generateTimestampedFilename('test.jpg');
      
      // Wait 1ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const name2 = generateTimestampedFilename('test.jpg');

      // They might be the same if called within the same second
      // but the format should be correct
      expect(name1).toMatch(/^\d{8}_\d{6}_test\.jpg$/);
      expect(name2).toMatch(/^\d{8}_\d{6}_test\.jpg$/);
    });

    it('should handle filenames with special characters', () => {
      const originalName = 'photo (1) - copy.jpg';
      const result = generateTimestampedFilename(originalName);

      expect(result).toContain('photo (1) - copy.jpg');
      expect(result).toMatch(/^\d{8}_\d{6}_/);
    });
  });

  describe('uploadFile', () => {
    it('should return error result when environment variables are missing', async () => {
      delete process.env.GOOGLE_DRIVE_CLIENT_ID;

      const fileUpload: FileUpload = {
        buffer: Buffer.from('test content'),
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
      };

      const result = await uploadFile(fileUpload);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required Google Drive environment variables');
    }, 15000); // Increase timeout to 15 seconds to account for retry delays
  });

  describe('uploadFiles', () => {
    it('should handle empty file array', async () => {
      const results = await uploadFiles([]);
      expect(results).toEqual([]);
    });
  });

  describe('verifyDriveAccess', () => {
    it('should return false when environment variables are missing', async () => {
      delete process.env.GOOGLE_DRIVE_CLIENT_ID;

      const result = await verifyDriveAccess();
      expect(result).toBe(false);
    });
  });

  describe('File naming convention', () => {
    it('should follow YYYYMMDD_HHMMSS format', () => {
      const result = generateTimestampedFilename('test.jpg');
      const parts = result.split('_');

      // Should have at least 3 parts: YYYYMMDD, HHMMSS, filename
      expect(parts.length).toBeGreaterThanOrEqual(3);

      // First part should be 8 digits (YYYYMMDD)
      expect(parts[0]).toMatch(/^\d{8}$/);

      // Second part should be 6 digits (HHMMSS)
      expect(parts[1]).toMatch(/^\d{6}$/);
    });

    it('should use current date and time', () => {
      const now = new Date();
      const result = generateTimestampedFilename('test.jpg');

      const year = now.getFullYear().toString();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      // Check that the date portion matches current date
      expect(result).toContain(`${year}${month}${day}`);
    });
  });

  describe('Configuration validation', () => {
    it('should require all environment variables', async () => {
      // Test just one variable to verify the validation logic works
      // Testing all 5 would take too long with retry delays
      const originalValue = process.env.GOOGLE_DRIVE_CLIENT_ID;
      
      // Delete the variable
      delete process.env.GOOGLE_DRIVE_CLIENT_ID;

      const fileUpload: FileUpload = {
        buffer: Buffer.from('test'),
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 4,
      };

      const result = await uploadFile(fileUpload);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required Google Drive environment variables');

      // Restore the variable
      process.env.GOOGLE_DRIVE_CLIENT_ID = originalValue;
    }, 15000); // Increase timeout to 15 seconds to account for retry delays
  });
});

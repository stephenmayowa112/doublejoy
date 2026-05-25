/**
 * Unit tests for Message Validation Service
 * Tests requirements 1.2, 1.3, 1.6
 */

import {
  validateName,
  validateEmail,
  validateMessage,
  validateMessageSubmission,
  ValidationResult,
  MessageValidationResult
} from './messageValidation';

describe('Message Validation Service', () => {
  describe('validateName', () => {
    describe('valid names', () => {
      it('should accept name with exactly 2 characters', () => {
        const result = validateName('Jo');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept name with exactly 100 characters', () => {
        const name = 'a'.repeat(100);
        const result = validateName(name);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept name with middle length (50 characters)', () => {
        const name = 'a'.repeat(50);
        const result = validateName(name);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept name with spaces', () => {
        const result = validateName('John Doe');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should trim whitespace and validate trimmed length', () => {
        const result = validateName('  Jo  ');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe('invalid names', () => {
      it('should reject undefined name', () => {
        const result = validateName(undefined);
        expect(result.isValid).toBe(false);
        expect(result.error?.field).toBe('name');
        expect(result.error?.message).toBe('Name is required');
      });

      it('should reject null name', () => {
        const result = validateName(null);
        expect(result.isValid).toBe(false);
        expect(result.error?.field).toBe('name');
        expect(result.error?.message).toBe('Name is required');
      });

      it('should reject empty string', () => {
        const result = validateName('');
        expect(result.isValid).toBe(false);
        expect(result.error?.field).toBe('name');
        expect(result.error?.message).toBe('Name is required');
      });

      it('should reject name with 1 character', () => {
        const result = validateName('J');
        expect(result.isValid).toBe(false);
        expect(result.error?.field).toBe('name');
        expect(result.error?.message).toBe('Name must be at least 2 characters');
      });

      it('should reject name with 101 characters', () => {
        const name = 'a'.repeat(101);
        const result = validateName(name);
        expect(result.isValid).toBe(false);
        expect(result.error?.field).toBe('name');
        expect(result.error?.message).toBe('Name must not exceed 100 characters');
      });

      it('should reject name with only whitespace that trims to less than 2 chars', () => {
        const result = validateName('   ');
        expect(result.isValid).toBe(false);
        expect(result.error?.field).toBe('name');
        expect(result.error?.message).toBe('Name must be at least 2 characters');
      });
    });
  });

  describe('validateEmail', () => {
    describe('valid emails', () => {
      it('should accept undefined email (optional field)', () => {
        const result = validateEmail(undefined);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept null email (optional field)', () => {
        const result = validateEmail(null);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept empty string (optional field)', () => {
        const result = validateEmail('');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept valid email format', () => {
        const result = validateEmail('test@example.com');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept email with subdomain', () => {
        const result = validateEmail('user@mail.example.com');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept email with plus sign', () => {
        const result = validateEmail('user+tag@example.com');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept email with numbers', () => {
        const result = validateEmail('user123@example456.com');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe('invalid emails', () => {
      it('should reject email without @ symbol', () => {
        const result = validateEmail('testexample.com');
        expect(result.isValid).toBe(false);
        expect(result.error?.field).toBe('email');
        expect(result.error?.message).toBe('Email must be a valid email address');
      });

      it('should reject email without domain', () => {
        const result = validateEmail('test@');
        expect(result.isValid).toBe(false);
        expect(result.error?.field).toBe('email');
        expect(result.error?.message).toBe('Email must be a valid email address');
      });

      it('should reject email without local part', () => {
        const result = validateEmail('@example.com');
        expect(result.isValid).toBe(false);
        expect(result.error?.field).toBe('email');
        expect(result.error?.message).toBe('Email must be a valid email address');
      });

      it('should reject email without TLD', () => {
        const result = validateEmail('test@example');
        expect(result.isValid).toBe(false);
        expect(result.error?.field).toBe('email');
        expect(result.error?.message).toBe('Email must be a valid email address');
      });

      it('should reject email with spaces', () => {
        const result = validateEmail('test @example.com');
        expect(result.isValid).toBe(false);
        expect(result.error?.field).toBe('email');
        expect(result.error?.message).toBe('Email must be a valid email address');
      });
    });
  });

  describe('validateMessage', () => {
    describe('valid messages', () => {
      it('should accept message with exactly 10 characters', () => {
        const message = 'a'.repeat(10);
        const result = validateMessage(message);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept message with exactly 1000 characters', () => {
        const message = 'a'.repeat(1000);
        const result = validateMessage(message);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept message with middle length (500 characters)', () => {
        const message = 'a'.repeat(500);
        const result = validateMessage(message);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept message with spaces and punctuation', () => {
        const result = validateMessage('Congratulations on your wedding! Best wishes.');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should trim whitespace and validate trimmed length', () => {
        const result = validateMessage('  Hello world  ');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe('invalid messages', () => {
      it('should reject undefined message', () => {
        const result = validateMessage(undefined);
        expect(result.isValid).toBe(false);
        expect(result.error?.field).toBe('message');
        expect(result.error?.message).toBe('Message is required');
      });

      it('should reject null message', () => {
        const result = validateMessage(null);
        expect(result.isValid).toBe(false);
        expect(result.error?.field).toBe('message');
        expect(result.error?.message).toBe('Message is required');
      });

      it('should reject empty string', () => {
        const result = validateMessage('');
        expect(result.isValid).toBe(false);
        expect(result.error?.field).toBe('message');
        expect(result.error?.message).toBe('Message is required');
      });

      it('should reject message with 9 characters', () => {
        const message = 'a'.repeat(9);
        const result = validateMessage(message);
        expect(result.isValid).toBe(false);
        expect(result.error?.field).toBe('message');
        expect(result.error?.message).toBe('Message must be at least 10 characters');
      });

      it('should reject message with 1001 characters', () => {
        const message = 'a'.repeat(1001);
        const result = validateMessage(message);
        expect(result.isValid).toBe(false);
        expect(result.error?.field).toBe('message');
        expect(result.error?.message).toBe('Message must not exceed 1000 characters');
      });

      it('should reject message with only whitespace that trims to less than 10 chars', () => {
        const result = validateMessage('         ');
        expect(result.isValid).toBe(false);
        expect(result.error?.field).toBe('message');
        expect(result.error?.message).toBe('Message must be at least 10 characters');
      });
    });
  });

  describe('validateMessageSubmission', () => {
    describe('valid submissions', () => {
      it('should accept valid submission with all fields', () => {
        const result = validateMessageSubmission({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Congratulations on your wedding!'
        });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('should accept valid submission without email', () => {
        const result = validateMessageSubmission({
          name: 'John Doe',
          email: null,
          message: 'Congratulations on your wedding!'
        });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('should accept valid submission with empty email', () => {
        const result = validateMessageSubmission({
          name: 'John Doe',
          email: '',
          message: 'Congratulations on your wedding!'
        });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });
    });

    describe('invalid submissions - single field errors', () => {
      it('should return name error for invalid name', () => {
        const result = validateMessageSubmission({
          name: 'J',
          email: 'john@example.com',
          message: 'Congratulations on your wedding!'
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.name).toBe('Name must be at least 2 characters');
        expect(result.errors.email).toBeUndefined();
        expect(result.errors.message).toBeUndefined();
      });

      it('should return email error for invalid email', () => {
        const result = validateMessageSubmission({
          name: 'John Doe',
          email: 'invalid-email',
          message: 'Congratulations on your wedding!'
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.name).toBeUndefined();
        expect(result.errors.email).toBe('Email must be a valid email address');
        expect(result.errors.message).toBeUndefined();
      });

      it('should return message error for invalid message', () => {
        const result = validateMessageSubmission({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Short'
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.name).toBeUndefined();
        expect(result.errors.email).toBeUndefined();
        expect(result.errors.message).toBe('Message must be at least 10 characters');
      });
    });

    describe('invalid submissions - multiple field errors', () => {
      it('should return errors for all invalid fields', () => {
        const result = validateMessageSubmission({
          name: 'J',
          email: 'invalid-email',
          message: 'Short'
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.name).toBe('Name must be at least 2 characters');
        expect(result.errors.email).toBe('Email must be a valid email address');
        expect(result.errors.message).toBe('Message must be at least 10 characters');
      });

      it('should return errors for name and message when both invalid', () => {
        const result = validateMessageSubmission({
          name: '',
          email: 'john@example.com',
          message: null
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.name).toBe('Name is required');
        expect(result.errors.email).toBeUndefined();
        expect(result.errors.message).toBe('Message is required');
      });
    });

    describe('edge cases', () => {
      it('should handle all undefined fields', () => {
        const result = validateMessageSubmission({
          name: undefined,
          email: undefined,
          message: undefined
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.name).toBe('Name is required');
        expect(result.errors.email).toBeUndefined(); // email is optional
        expect(result.errors.message).toBe('Message is required');
      });

      it('should handle all null fields', () => {
        const result = validateMessageSubmission({
          name: null,
          email: null,
          message: null
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.name).toBe('Name is required');
        expect(result.errors.email).toBeUndefined(); // email is optional
        expect(result.errors.message).toBe('Message is required');
      });

      it('should handle boundary values correctly', () => {
        const result = validateMessageSubmission({
          name: 'Jo', // exactly 2 chars
          email: 'a@b.c', // minimal valid email
          message: 'a'.repeat(10) // exactly 10 chars
        });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });
    });
  });
});

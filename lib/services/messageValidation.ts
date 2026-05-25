/**
 * Message Validation Service
 * 
 * Provides validation functions for guest message submissions.
 * Validates name, email, and message content according to requirements 1.2, 1.3, 1.6.
 */

export interface ValidationResult {
  isValid: boolean;
  error?: {
    field: string;
    message: string;
  };
}

export interface MessageValidationResult {
  isValid: boolean;
  errors: {
    name?: string;
    email?: string;
    message?: string;
  };
}

/**
 * Validates guest name
 * Requirements: 1.2 - Name must be between 2 and 100 characters
 * 
 * @param name - The guest name to validate
 * @returns ValidationResult with isValid flag and optional error
 */
export function validateName(name: string | undefined | null): ValidationResult {
  if (name === undefined || name === null || name === '') {
    return {
      isValid: false,
      error: {
        field: 'name',
        message: 'Name is required'
      }
    };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      error: {
        field: 'name',
        message: 'Name must be at least 2 characters'
      }
    };
  }

  if (trimmedName.length > 100) {
    return {
      isValid: false,
      error: {
        field: 'name',
        message: 'Name must not exceed 100 characters'
      }
    };
  }

  return { isValid: true };
}

/**
 * Validates email address (optional field)
 * Requirements: 1.1 - Email is optional but must be valid format if provided
 * 
 * @param email - The email address to validate (optional)
 * @returns ValidationResult with isValid flag and optional error
 */
export function validateEmail(email: string | undefined | null): ValidationResult {
  // Email is optional, so empty/null/undefined is valid
  if (email === undefined || email === null || email === '') {
    return { isValid: true };
  }

  const trimmedEmail = email.trim();
  
  // If email is provided, validate format
  // Basic email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      error: {
        field: 'email',
        message: 'Email must be a valid email address'
      }
    };
  }

  return { isValid: true };
}

/**
 * Validates message content
 * Requirements: 1.3 - Message must be between 10 and 1000 characters
 * 
 * @param message - The message content to validate
 * @returns ValidationResult with isValid flag and optional error
 */
export function validateMessage(message: string | undefined | null): ValidationResult {
  if (message === undefined || message === null || message === '') {
    return {
      isValid: false,
      error: {
        field: 'message',
        message: 'Message is required'
      }
    };
  }

  const trimmedMessage = message.trim();
  
  if (trimmedMessage.length < 10) {
    return {
      isValid: false,
      error: {
        field: 'message',
        message: 'Message must be at least 10 characters'
      }
    };
  }

  if (trimmedMessage.length > 1000) {
    return {
      isValid: false,
      error: {
        field: 'message',
        message: 'Message must not exceed 1000 characters'
      }
    };
  }

  return { isValid: true };
}

/**
 * Validates complete message submission
 * Requirements: 1.2, 1.3, 1.6 - Validates all fields and returns field-specific errors
 * 
 * @param data - The message data to validate
 * @returns MessageValidationResult with isValid flag and field-specific errors
 */
export function validateMessageSubmission(data: {
  name?: string | null;
  email?: string | null;
  message?: string | null;
}): MessageValidationResult {
  const errors: { name?: string; email?: string; message?: string } = {};

  const nameResult = validateName(data.name);
  if (!nameResult.isValid && nameResult.error) {
    errors.name = nameResult.error.message;
  }

  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid && emailResult.error) {
    errors.email = emailResult.error.message;
  }

  const messageResult = validateMessage(data.message);
  if (!messageResult.isValid && messageResult.error) {
    errors.message = messageResult.error.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

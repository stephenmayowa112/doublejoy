/**
 * Input Sanitization Service
 * 
 * Provides XSS protection by sanitizing user input using DOMPurify.
 * Removes script tags, event handlers, javascript: protocols, and other
 * potentially malicious content from user-submitted messages.
 * 
 * Requirements: 1.7, 10.3
 */

import DOMPurify from 'dompurify';

// Lazy-loaded DOMPurify instance
let purify: any = null;

// Create a DOMPurify instance on first use
// In Node.js environment (server-side), we need to provide a window object via jsdom
// In browser/jsdom test environment, we can use the global window
function getPurify(): any {
  if (purify) {
    return purify;
  }

  // Check if window is available (browser or jsdom test environment)
  if (typeof window !== 'undefined' && window.document) {
    // Browser or jsdom test environment: use global window
    purify = DOMPurify(window);
    return purify;
  }
  
  // Check if global has window (some test environments)
  if (typeof global !== 'undefined' && (global as any).window) {
    purify = DOMPurify((global as any).window);
    return purify;
  }

  // Server-side: dynamically import jsdom
  try {
    const { JSDOM } = require('jsdom');
    const window = new JSDOM('').window;
    purify = DOMPurify(window as any);
    return purify;
  } catch (error) {
    console.error('getPurify error details:', error);
    throw new Error(`jsdom is required for server-side sanitization. Please install it: npm install jsdom. Actual error: ${error}`);
  }
}

/**
 * Configuration for DOMPurify sanitization
 * 
 * - ALLOWED_TAGS: Only allow basic text formatting tags
 * - ALLOWED_ATTR: Only allow safe attributes
 * - ALLOW_DATA_ATTR: Disallow data-* attributes
 * - ALLOW_UNKNOWN_PROTOCOLS: Disallow unknown protocols
 * - SAFE_FOR_TEMPLATES: Enable safe template mode
 */
const SANITIZE_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_TEMPLATES: true,
  KEEP_CONTENT: true, // Keep text content even when removing tags
};

/**
 * Sanitizes message content to prevent XSS attacks
 * 
 * Removes or neutralizes:
 * - Script tags (<script>...</script>)
 * - Event handlers (onclick, onerror, onload, etc.)
 * - JavaScript protocols (javascript:, data:, vbscript:)
 * - Potentially dangerous HTML tags (iframe, object, embed, etc.)
 * - Dangerous attributes (style with expressions, etc.)
 * 
 * @param input - The raw user input to sanitize
 * @returns The sanitized string safe for storage and display
 * 
 * @example
 * ```typescript
 * const userInput = '<script>alert("xss")</script>Hello';
 * const safe = sanitizeMessage(userInput);
 * // Returns: 'Hello'
 * ```
 * 
 * @example
 * ```typescript
 * const userInput = '<img src=x onerror="alert(1)">';
 * const safe = sanitizeMessage(userInput);
 * // Returns: ''
 * ```
 */
export function sanitizeMessage(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Sanitize using DOMPurify with strict configuration
  const sanitized = getPurify().sanitize(input, SANITIZE_CONFIG);

  // Additional cleanup: remove any remaining javascript: or data: protocols
  // that might have been encoded or obfuscated
  const protocolCleaned = sanitized
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '');

  // Trim whitespace
  return protocolCleaned.trim();
}

/**
 * Sanitizes a guest name to prevent XSS attacks
 * 
 * Names should only contain alphanumeric characters, spaces, and common punctuation.
 * This function is more restrictive than sanitizeMessage since names don't need
 * any HTML formatting.
 * 
 * @param input - The raw name input to sanitize
 * @returns The sanitized name safe for storage and display
 * 
 * @example
 * ```typescript
 * const userInput = 'John<script>alert("xss")</script>Doe';
 * const safe = sanitizeName(userInput);
 * // Returns: 'JohnDoe'
 * ```
 */
export function sanitizeName(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // For names, strip ALL HTML tags and only keep text content
  const sanitized = getPurify().sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  // Remove any remaining special characters that could be dangerous
  const cleaned = sanitized
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '');

  return cleaned.trim();
}

/**
 * Sanitizes an email address
 * 
 * Email addresses should only contain valid email characters.
 * This function removes any HTML or script content.
 * 
 * @param input - The raw email input to sanitize
 * @returns The sanitized email safe for storage
 * 
 * @example
 * ```typescript
 * const userInput = 'test@example.com<script>alert("xss")</script>';
 * const safe = sanitizeEmail(userInput);
 * // Returns: 'test@example.com'
 * ```
 */
export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Strip all HTML tags from email
  const sanitized = getPurify().sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  // Remove any protocol attempts
  const cleaned = sanitized
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '');

  return cleaned.trim();
}

/**
 * Checks if a string contains potential XSS attack vectors
 * 
 * This is a detection function that can be used for logging or monitoring
 * purposes. It does NOT sanitize the input.
 * 
 * @param input - The string to check for XSS patterns
 * @returns true if potential XSS patterns are detected, false otherwise
 * 
 * @example
 * ```typescript
 * containsXSSPatterns('<script>alert("xss")</script>'); // true
 * containsXSSPatterns('Hello world'); // false
 * ```
 */
export function containsXSSPatterns(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=, onerror=
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

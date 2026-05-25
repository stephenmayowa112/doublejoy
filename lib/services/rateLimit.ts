/**
 * Rate Limiting Service
 * 
 * Provides rate limiting functionality to prevent abuse of the messaging and upload systems.
 * Uses in-memory storage for development (Map-based).
 * For production, consider using Redis for distributed rate limiting.
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

import { createRateLimitKey } from '../utils/ipHash';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  error?: {
    code: string;
    message: string;
    retryAfter: number; // seconds until rate limit resets
  };
}

interface RateLimitEntry {
  count: number;
  resetAt: Date;
}

/**
 * In-memory rate limit store
 * Key format: 'ratelimit:{endpoint}:{ipHash}'
 * Value: { count: number, resetAt: Date }
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  messages: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  upload: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};

/**
 * Cleans up expired rate limit entries from the store
 * This prevents memory leaks in the in-memory store
 */
function cleanupExpiredEntries(): void {
  const now = new Date();
  const keysToDelete: string[] = [];

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      keysToDelete.push(key);
    }
  }

  for (const key of keysToDelete) {
    rateLimitStore.delete(key);
  }
}

/**
 * Checks if a request is allowed under the rate limit
 * Requirements: 9.1 - Limit message submissions to 3 per IP per hour
 * Requirements: 9.2 - Limit media uploads to 5 per IP per hour
 * Requirements: 9.3 - Return error when rate limit exceeded
 * 
 * @param endpoint - The endpoint identifier ('messages' or 'upload')
 * @param ipAddress - The client IP address
 * @returns RateLimitResult indicating if request is allowed and remaining quota
 */
export function checkRateLimit(
  endpoint: string,
  ipAddress: string
): RateLimitResult {
  // Validate inputs
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error('Invalid endpoint: must be a non-empty string');
  }

  if (!ipAddress || typeof ipAddress !== 'string') {
    throw new Error('Invalid IP address: must be a non-empty string');
  }

  // Get rate limit configuration for this endpoint
  const config = RATE_LIMIT_CONFIGS[endpoint];
  if (!config) {
    throw new Error(`No rate limit configuration found for endpoint: ${endpoint}`);
  }

  // Clean up expired entries periodically (every 100 checks)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  // Create rate limit key
  const key = createRateLimitKey(endpoint, ipAddress);
  const now = new Date();

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  // If no entry exists or entry has expired, create a new one
  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 0,
      resetAt: new Date(now.getTime() + config.windowMs),
    };
    rateLimitStore.set(key, entry);
  }

  // Check if request is allowed
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt.getTime() - now.getTime()) / 1000);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter,
      },
    };
  }

  // Increment count and allow request
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Resets the rate limit for a specific endpoint and IP address
 * Useful for testing or administrative purposes
 * 
 * @param endpoint - The endpoint identifier ('messages' or 'upload')
 * @param ipAddress - The client IP address
 */
export function resetRateLimit(endpoint: string, ipAddress: string): void {
  const key = createRateLimitKey(endpoint, ipAddress);
  rateLimitStore.delete(key);
}

/**
 * Gets the current rate limit status without incrementing the counter
 * Useful for checking rate limit status without consuming a request
 * 
 * @param endpoint - The endpoint identifier ('messages' or 'upload')
 * @param ipAddress - The client IP address
 * @returns RateLimitResult indicating current status
 */
export function getRateLimitStatus(
  endpoint: string,
  ipAddress: string
): RateLimitResult {
  // Validate inputs
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error('Invalid endpoint: must be a non-empty string');
  }

  if (!ipAddress || typeof ipAddress !== 'string') {
    throw new Error('Invalid IP address: must be a non-empty string');
  }

  // Get rate limit configuration for this endpoint
  const config = RATE_LIMIT_CONFIGS[endpoint];
  if (!config) {
    throw new Error(`No rate limit configuration found for endpoint: ${endpoint}`);
  }

  // Create rate limit key
  const key = createRateLimitKey(endpoint, ipAddress);
  const now = new Date();

  // Get rate limit entry
  const entry = rateLimitStore.get(key);

  // If no entry exists or entry has expired, return full quota
  if (!entry || entry.resetAt <= now) {
    const resetAt = new Date(now.getTime() + config.windowMs);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt,
    };
  }

  // Check if limit is exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt.getTime() - now.getTime()) / 1000);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter,
      },
    };
  }

  // Return current status
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Clears all rate limit entries from the store
 * Useful for testing purposes
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

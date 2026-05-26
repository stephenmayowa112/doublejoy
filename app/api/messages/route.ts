/**
 * Messages API Route Handler
 * 
 * Handles guest message submissions and retrieval.
 * 
 * POST /api/messages - Submit a new guest message
 * GET /api/messages - Retrieve paginated list of guest messages
 * Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.3, 9.1, 9.6, 10.2, 10.3, 10.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { validateMessageSubmission } from '@/lib/services/messageValidation';
import { sanitizeMessage, sanitizeName, sanitizeEmail } from '@/lib/services/sanitization';
import { checkRateLimit } from '@/lib/services/rateLimit';
import { encrypt } from '@/lib/services/encryption';
import { hashIpAddress } from '@/lib/utils/ipHash';
import { execute, query } from '@/lib/db/connection';
import type { Message, MessageRecord } from '@/lib/db/types';

/**
 * Get client IP address from request headers
 * Checks various headers in order of preference
 */
function getClientIp(request: NextRequest): string {
  // Check X-Forwarded-For header (most common for proxied requests)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Check X-Real-IP header (used by some proxies)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fallback to a default IP for development
  // In production, this should be properly configured with the hosting provider
  return '127.0.0.1';
}

/**
 * POST /api/messages
 * 
 * Submit a new guest message
 * 
 * Request body:
 * {
 *   name: string (2-100 characters)
 *   email?: string (optional, valid email format)
 *   message: string (10-1000 characters)
 * }
 * 
 * Response:
 * 201 - Message created successfully
 * {
 *   success: true,
 *   message: {
 *     id: string,
 *     name: string,
 *     message: string,
 *     createdAt: Date
 *   }
 * }
 * 
 * 400 - Validation error
 * {
 *   success: false,
 *   error: {
 *     code: 'VALIDATION_ERROR',
 *     message: string,
 *     errors: { [field]: string }
 *   }
 * }
 * 
 * 429 - Rate limit exceeded
 * {
 *   success: false,
 *   error: {
 *     code: 'RATE_LIMIT_EXCEEDED',
 *     message: string,
 *     retryAfter: number
 *   }
 * }
 * 
 * 500 - Server error
 * {
 *   success: false,
 *   error: {
 *     code: 'INTERNAL_ERROR',
 *     message: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP address for rate limiting
    const ipAddress = getClientIp(request);

    // Check rate limit (Requirement 9.1: 3 messages per IP per hour)
    const rateLimitResult = checkRateLimit('messages', ipAddress);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: rateLimitResult.error?.code || 'RATE_LIMIT_EXCEEDED',
            message: rateLimitResult.error?.message || 'Too many requests. Please try again later.',
            retryAfter: rateLimitResult.error?.retryAfter || 3600,
          },
        },
        { status: 429 }
      );
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body',
          },
        },
        { status: 400 }
      );
    }

    // Validate request body (Requirements 1.2, 1.3, 1.6)
    const validationResult = validateMessageSubmission({
      name: body.name,
      email: body.email,
      message: body.message,
    });

    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            errors: validationResult.errors,
          },
        },
        { status: 400 }
      );
    }

    // Sanitize input (Requirements 1.7, 10.3)
    const sanitizedName = sanitizeName(body.name);
    const sanitizedMessage = sanitizeMessage(body.message);
    const sanitizedEmail = body.email ? sanitizeEmail(body.email) : null;

    // Encrypt email if provided (Requirement 10.5)
    let encryptedEmail: string | null = null;
    if (sanitizedEmail) {
      try {
        encryptedEmail = encrypt(sanitizedEmail);
      } catch (error) {
        console.error('Email encryption failed:', error);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ENCRYPTION_ERROR',
              message: 'Failed to process email address',
            },
          },
          { status: 500 }
        );
      }
    }

    // Hash IP address (Requirement 10.6)
    const ipAddressHash = hashIpAddress(ipAddress);

    // Generate UUID for message
    const messageId = uuidv4();

    // Store message in database (Requirement 1.4, 10.2)
    try {
      execute(
        `INSERT INTO messages (id, name, email_encrypted, message, created_at, is_hidden, ip_address_hash)
         VALUES (?, ?, ?, ?, datetime('now'), ?, ?)`,
        [messageId, sanitizedName, encryptedEmail, sanitizedMessage, 0, ipAddressHash]
      );
    } catch (error) {
      console.error('Database insert failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to store message',
          },
        },
        { status: 500 }
      );
    }

    // Prepare response message (Requirement 1.5)
    const responseMessage: Message = {
      id: messageId,
      name: sanitizedName,
      message: sanitizedMessage,
      createdAt: new Date(),
    };

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: responseMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again later.',
        },
      },
      { status: 500 }
    );
  }
}

// Cache for message list (Requirement 9.6: 60-second caching)
interface CacheEntry {
  data: any;
  timestamp: number;
}

const messageCache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 60 * 1000; // 60 seconds

/**
 * Clear the message cache (primarily for unit testing)
 */
export function clearMessageCache(): void {
  messageCache.clear();
}

/**
 * Get cached data if available and not expired
 */
function getCachedData(key: string): any | null {
  const entry = messageCache.get(key);
  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (now - entry.timestamp > CACHE_DURATION_MS) {
    // Cache expired, remove it
    messageCache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Store data in cache
 */
function setCachedData(key: string, data: any): void {
  messageCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * GET /api/messages
 * 
 * Retrieve paginated list of guest messages
 * 
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 50)
 * 
 * Response:
 * 200 - Messages retrieved successfully
 * {
 *   success: true,
 *   messages: Message[],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     hasMore: boolean
 *   }
 * }
 * 
 * 400 - Invalid query parameters
 * {
 *   success: false,
 *   error: {
 *     code: 'INVALID_PARAMETERS',
 *     message: string
 *   }
 * }
 * 
 * 500 - Server error
 * {
 *   success: false,
 *   error: {
 *     code: 'INTERNAL_ERROR',
 *     message: string
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    // Validate and parse page parameter (default: 1)
    let page = 1;
    if (pageParam) {
      const parsedPage = parseInt(pageParam, 10);
      if (isNaN(parsedPage) || parsedPage < 1) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_PARAMETERS',
              message: 'Page must be a positive integer',
            },
          },
          { status: 400 }
        );
      }
      page = parsedPage;
    }

    // Validate and parse limit parameter (default: 20, max: 50)
    let limit = 20;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_PARAMETERS',
              message: 'Limit must be a positive integer',
            },
          },
          { status: 400 }
        );
      }
      // Enforce maximum limit of 50
      limit = Math.min(parsedLimit, 50);
    }

    // Create cache key based on query parameters
    const cacheKey = `messages:page=${page}:limit=${limit}`;

    // Check cache first (Requirement 9.6)
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, { status: 200 });
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Query database for messages (Requirement 2.1: ordered by created_at DESC)
    // Only fetch non-hidden messages (Requirement 8.4)
    let messages: MessageRecord[];
    let totalCount: number;

    try {
      // Fetch messages with pagination
      messages = query<MessageRecord>(
        `SELECT id, name, message, created_at, is_hidden
         FROM messages
         WHERE is_hidden = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [0, limit, offset]
      );

      // Get total count of non-hidden messages
      const countResult = query<{ count: number }>(
        `SELECT COUNT(*) as count FROM messages WHERE is_hidden = ?`,
        [0]
      );
      totalCount = countResult[0]?.count || 0;
    } catch (error) {
      console.error('Database query failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to retrieve messages',
          },
        },
        { status: 500 }
      );
    }

    // Transform database records to API response format
    const responseMessages: Message[] = messages.map((record) => ({
      id: record.id,
      name: record.name,
      message: record.message,
      createdAt: new Date(record.created_at),
    }));

    // Calculate hasMore flag (Requirement 2.3)
    const hasMore = offset + messages.length < totalCount;

    // Prepare response
    const responseData = {
      success: true,
      messages: responseMessages,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore,
      },
    };

    // Store in cache (Requirement 9.6)
    setCachedData(cacheKey, responseData);

    // Return response
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again later.',
        },
      },
      { status: 500 }
    );
  }
}

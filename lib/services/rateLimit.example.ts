/**
 * Example usage of Rate Limiting Service in API routes
 * 
 * This file demonstrates how to integrate the rate limiting service
 * into Next.js API route handlers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from './rateLimit';

/**
 * Example: Using rate limiting in a message submission endpoint
 */
export async function POST_messages_example(request: NextRequest) {
  try {
    // Extract IP address from request
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1';

    // Check rate limit
    const rateLimitResult = checkRateLimit('messages', ipAddress);

    // If rate limit exceeded, return 429 error
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: rateLimitResult.error?.code,
            message: rateLimitResult.error?.message,
            retryAfter: rateLimitResult.error?.retryAfter,
          },
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.error?.retryAfter || 3600),
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          },
        }
      );
    }

    // Process the message submission
    // ... validation, sanitization, database storage ...

    // Return success response with rate limit headers
    return NextResponse.json(
      {
        success: true,
        message: { /* message data */ },
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
        },
      }
    );
  } catch (error) {
    console.error('Error in message submission:', error);
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

/**
 * Example: Using rate limiting in a file upload endpoint
 */
export async function POST_upload_example(request: NextRequest) {
  try {
    // Extract IP address from request
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1';

    // Check rate limit for upload endpoint (5 uploads per hour)
    const rateLimitResult = checkRateLimit('upload', ipAddress);

    // If rate limit exceeded, return 429 error
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: rateLimitResult.error?.code,
            message: rateLimitResult.error?.message,
            retryAfter: rateLimitResult.error?.retryAfter,
          },
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.error?.retryAfter || 3600),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          },
        }
      );
    }

    // Process the file upload
    // ... file validation, Google Drive upload, database storage ...

    // Return success response with rate limit headers
    return NextResponse.json(
      {
        success: true,
        uploads: [ /* upload results */ ],
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
        },
      }
    );
  } catch (error) {
    console.error('Error in file upload:', error);
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

/**
 * Helper function to extract IP address from Next.js request
 * Handles various proxy configurations
 */
export function getClientIpAddress(request: NextRequest): string {
  // Try x-forwarded-for header (most common for proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Try x-real-ip header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fallback to localhost (for development)
  return '127.0.0.1';
}

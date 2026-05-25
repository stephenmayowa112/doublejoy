# Utility Functions

This directory contains utility functions used throughout the application.

## IP Hash Utility (`ipHash.ts`)

The IP hash utility provides functions for securely handling IP addresses in compliance with **Requirement 10.6: Sensitive data not logged in plaintext**.

### Functions

#### `hashIpAddress(ipAddress: string): string`

Hashes an IP address using SHA-256 for secure storage and rate limiting. This prevents storing IP addresses in plaintext while still allowing consistent identification for rate limiting purposes.

**Usage:**
```typescript
import { hashIpAddress } from '@/lib/utils/ipHash';

// Hash an IP address before storing in database
const ipHash = hashIpAddress('192.168.1.1');
// Returns: 'c71e7e0e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e'

// Store the hash in the database
await db.execute(
  'INSERT INTO messages (id, name, message, ip_address_hash) VALUES (?, ?, ?, ?)',
  [id, name, message, ipHash]
);
```

**Features:**
- Produces consistent 64-character hexadecimal hash (SHA-256)
- Same IP always produces the same hash (deterministic)
- Different IPs produce different hashes
- One-way function - cannot reverse hash to get original IP
- Automatically trims whitespace from input

#### `sanitizeIpForLogging(ipAddress: string): string`

Sanitizes an IP address for logging by masking sensitive parts. This ensures IP addresses are not logged in plaintext.

**Usage:**
```typescript
import { sanitizeIpForLogging } from '@/lib/utils/ipHash';

// Mask an IP address before logging
const maskedIp = sanitizeIpForLogging('192.168.1.1');
// Returns: '192.168.x.x'

console.log(`Request from ${maskedIp}`); // Safe to log

// IPv6 addresses are also supported
const maskedIpv6 = sanitizeIpForLogging('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
// Returns: '2001:0db8:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx'
```

**Features:**
- IPv4: Keeps first two octets, masks last two (e.g., `192.168.x.x`)
- IPv6: Keeps first two groups, masks the rest (e.g., `2001:0db8:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx`)
- Returns `[invalid-ip]` for invalid input
- Returns `[masked-ip]` for unrecognized formats

#### `createRateLimitKey(endpoint: string, ipAddress: string): string`

Creates a rate limit key by combining an endpoint identifier with a hashed IP address. This is used for rate limiting to track requests per IP per endpoint.

**Usage:**
```typescript
import { createRateLimitKey } from '@/lib/utils/ipHash';

// Create a rate limit key for message submissions
const key = createRateLimitKey('messages', '192.168.1.1');
// Returns: 'ratelimit:messages:c71e7e0e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e'

// Use the key for rate limiting
const rateLimitEntry = rateLimitStore.get(key);
if (rateLimitEntry && rateLimitEntry.count >= 3) {
  return new Response(JSON.stringify({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.'
    }
  }), { status: 429 });
}
```

**Features:**
- Combines endpoint and hashed IP into a single key
- Format: `ratelimit:{endpoint}:{ipHash}`
- IP address is hashed, not stored in plaintext
- Consistent keys for same endpoint and IP combination

### Security Considerations

1. **Never log IP addresses in plaintext** - Always use `sanitizeIpForLogging()` before logging
2. **Never store IP addresses in plaintext** - Always use `hashIpAddress()` before storing in database
3. **Use rate limit keys** - Use `createRateLimitKey()` for rate limiting to avoid exposing IPs

### Example: Complete Rate Limiting Flow

```typescript
import { createRateLimitKey, sanitizeIpForLogging } from '@/lib/utils/ipHash';

export async function POST(request: Request) {
  // Get IP address from request
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // Create rate limit key (IP is hashed internally)
  const rateLimitKey = createRateLimitKey('messages', ip);
  
  // Check rate limit
  const rateLimitEntry = rateLimitStore.get(rateLimitKey);
  if (rateLimitEntry && rateLimitEntry.count >= 3) {
    // Log with masked IP (safe for logs)
    console.warn(`Rate limit exceeded for ${sanitizeIpForLogging(ip)}`);
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.'
      }
    }), { status: 429 });
  }
  
  // Process request...
}
```

### Testing

Comprehensive unit tests are available in `ipHash.test.ts` covering:
- Hash consistency and uniqueness
- IP masking for IPv4 and IPv6
- Rate limit key generation
- Error handling for invalid inputs
- Compliance with Requirement 10.6

Run tests with:
```bash
npm test -- ipHash.test.ts
```

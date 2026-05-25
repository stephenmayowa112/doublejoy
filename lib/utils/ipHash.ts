import { createHash } from 'crypto';

/**
 * Hashes an IP address using SHA-256 for secure storage and rate limiting.
 * This prevents storing IP addresses in plaintext while still allowing
 * consistent identification for rate limiting purposes.
 * 
 * @param ipAddress - The IP address to hash (IPv4 or IPv6)
 * @returns A SHA-256 hash of the IP address as a hexadecimal string
 * 
 * @example
 * ```typescript
 * const hash = hashIpAddress('192.168.1.1');
 * // Returns: 'c71e7e0e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e'
 * ```
 */
export function hashIpAddress(ipAddress: string): string {
  if (!ipAddress || typeof ipAddress !== 'string') {
    throw new Error('Invalid IP address: must be a non-empty string');
  }

  // Normalize the IP address (trim whitespace)
  const normalizedIp = ipAddress.trim();

  if (normalizedIp.length === 0) {
    throw new Error('Invalid IP address: must be a non-empty string');
  }

  // Create SHA-256 hash of the IP address
  const hash = createHash('sha256');
  hash.update(normalizedIp);
  return hash.digest('hex');
}

/**
 * Sanitizes an IP address for logging by replacing it with a masked version.
 * This ensures sensitive IP addresses are not logged in plaintext.
 * 
 * @param ipAddress - The IP address to sanitize
 * @returns A masked version of the IP address suitable for logging
 * 
 * @example
 * ```typescript
 * const masked = sanitizeIpForLogging('192.168.1.1');
 * // Returns: '192.168.x.x'
 * 
 * const maskedV6 = sanitizeIpForLogging('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
 * // Returns: '2001:0db8:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx'
 * ```
 */
export function sanitizeIpForLogging(ipAddress: string): string {
  if (!ipAddress || typeof ipAddress !== 'string') {
    return '[invalid-ip]';
  }

  const normalizedIp = ipAddress.trim();

  if (normalizedIp.length === 0) {
    return '[invalid-ip]';
  }

  // Check if it's an IPv4 address
  if (normalizedIp.includes('.')) {
    const parts = normalizedIp.split('.');
    if (parts.length === 4) {
      // Keep first two octets, mask the rest
      return `${parts[0]}.${parts[1]}.x.x`;
    }
  }

  // Check if it's an IPv6 address
  if (normalizedIp.includes(':')) {
    const parts = normalizedIp.split(':');
    if (parts.length >= 3) {
      // Keep first two groups, mask the rest
      return `${parts[0]}:${parts[1]}:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx`;
    }
  }

  // If we can't determine the format, return a generic mask
  return '[masked-ip]';
}

/**
 * Creates a rate limit key by combining an endpoint identifier with a hashed IP address.
 * This is used for rate limiting to track requests per IP per endpoint.
 * 
 * @param endpoint - The endpoint identifier (e.g., 'messages', 'upload')
 * @param ipAddress - The IP address to hash
 * @returns A rate limit key in the format 'ratelimit:{endpoint}:{ipHash}'
 * 
 * @example
 * ```typescript
 * const key = createRateLimitKey('messages', '192.168.1.1');
 * // Returns: 'ratelimit:messages:c71e7e0e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e3c3e'
 * ```
 */
export function createRateLimitKey(endpoint: string, ipAddress: string): string {
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error('Invalid endpoint: must be a non-empty string');
  }

  const normalizedEndpoint = endpoint.trim();

  if (normalizedEndpoint.length === 0) {
    throw new Error('Invalid endpoint: must be a non-empty string');
  }

  const ipHash = hashIpAddress(ipAddress);
  return `ratelimit:${normalizedEndpoint}:${ipHash}`;
}

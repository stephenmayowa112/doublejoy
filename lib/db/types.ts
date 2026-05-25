/**
 * Database Type Definitions
 * 
 * TypeScript interfaces that match the database schema for type safety
 * across the application.
 */

/**
 * Message record from the messages table
 * Requirements: 1.4, 8.3, 8.4
 */
export interface MessageRecord {
  /** Unique identifier (UUID format) */
  id: string
  
  /** Guest's display name (2-100 characters) */
  name: string
  
  /** Encrypted email address (optional) */
  email_encrypted: string | null
  
  /** Sanitized message content (10-1000 characters) */
  message: string
  
  /** Timestamp when message was submitted */
  created_at: Date
  
  /** Moderation flag - true if message is hidden from public display */
  is_hidden: boolean
  
  /** Hashed IP address for rate limiting */
  ip_address_hash: string
}

/**
 * Message data for API responses (excludes sensitive fields)
 */
export interface Message {
  /** Unique identifier */
  id: string
  
  /** Guest's display name */
  name: string
  
  /** Decrypted email address (optional, only for admin views) */
  email?: string
  
  /** Message content */
  message: string
  
  /** Timestamp when message was submitted */
  createdAt: Date
}

/**
 * Upload metadata record from the uploads table
 * Requirements: 5.3
 */
export interface UploadRecord {
  /** Unique identifier (UUID format) */
  id: string
  
  /** Original filename from guest's device */
  filename: string
  
  /** Google Drive file ID */
  drive_file_id: string
  
  /** File category: 'image' or 'video' */
  file_type: 'image' | 'video'
  
  /** File size in bytes */
  file_size: number
  
  /** Full MIME type (e.g., 'image/jpeg', 'video/mp4') */
  mime_type: string
  
  /** Timestamp when file was uploaded */
  uploaded_at: Date
  
  /** Hashed IP address for rate limiting */
  ip_address_hash: string
}

/**
 * Upload metadata for API responses
 */
export interface UploadMetadata {
  /** Unique identifier */
  id: string
  
  /** Original filename */
  filename: string
  
  /** Google Drive file ID */
  driveFileId: string
  
  /** File category */
  fileType: 'image' | 'video'
  
  /** File size in bytes */
  fileSize: number
  
  /** MIME type */
  mimeType: string
  
  /** Upload timestamp */
  uploadedAt: Date
}

/**
 * Moderation log record from the moderation_log table
 * Requirements: 8.5
 */
export interface ModerationLogRecord {
  /** Unique identifier (UUID format) */
  id: string
  
  /** Reference to the moderated message */
  message_id: string
  
  /** Type of moderation action */
  action_type: 'delete' | 'hide' | 'unhide'
  
  /** Admin identifier (format depends on auth system) */
  admin_id: string | null
  
  /** Timestamp when action was performed */
  action_timestamp: Date
  
  /** Optional reason for moderation */
  reason: string | null
}

/**
 * Moderation log entry for API responses
 */
export interface ModerationLogEntry {
  /** Unique identifier */
  id: string
  
  /** Reference to the moderated message */
  messageId: string
  
  /** Type of moderation action */
  actionType: 'delete' | 'hide' | 'unhide'
  
  /** Admin identifier */
  adminId?: string
  
  /** Timestamp when action was performed */
  actionTimestamp: Date
  
  /** Optional reason for moderation */
  reason?: string
}

/**
 * Input data for creating a new message
 */
export interface CreateMessageInput {
  /** Guest's display name (2-100 characters) */
  name: string
  
  /** Optional email address (will be encrypted before storage) */
  email?: string
  
  /** Message content (10-1000 characters, will be sanitized) */
  message: string
  
  /** IP address (will be hashed before storage) */
  ipAddress: string
}

/**
 * Input data for creating an upload record
 */
export interface CreateUploadInput {
  /** Original filename */
  filename: string
  
  /** Google Drive file ID */
  driveFileId: string
  
  /** File category */
  fileType: 'image' | 'video'
  
  /** File size in bytes */
  fileSize: number
  
  /** MIME type */
  mimeType: string
  
  /** IP address (will be hashed before storage) */
  ipAddress: string
}

/**
 * Input data for creating a moderation log entry
 */
export interface CreateModerationLogInput {
  /** Reference to the moderated message */
  messageId: string
  
  /** Type of moderation action */
  actionType: 'delete' | 'hide' | 'unhide'
  
  /** Admin identifier */
  adminId?: string
  
  /** Optional reason for moderation */
  reason?: string
}

/**
 * Query parameters for fetching messages
 */
export interface GetMessagesQuery {
  /** Page number (1-indexed) */
  page?: number
  
  /** Number of messages per page (max 50) */
  limit?: number
  
  /** Include hidden messages (admin only) */
  includeHidden?: boolean
}

/**
 * Paginated response for messages
 */
export interface PaginatedMessages {
  /** Array of messages */
  messages: Message[]
  
  /** Pagination metadata */
  pagination: {
    /** Current page number */
    page: number
    
    /** Messages per page */
    limit: number
    
    /** Total number of messages */
    total: number
    
    /** Whether more messages exist */
    hasMore: boolean
  }
}

/**
 * Rate limit entry for in-memory storage
 */
export interface RateLimitEntry {
  /** Request count within current window */
  count: number
  
  /** Timestamp when the rate limit window resets */
  resetAt: Date
}

/**
 * Database query result (generic)
 */
export interface QueryResult<T> {
  /** Query result rows */
  rows: T[]
  
  /** Number of rows affected (for INSERT/UPDATE/DELETE) */
  rowCount?: number
}

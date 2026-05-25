-- Migration: Create messages table
-- Requirements: 1.4, 8.3, 8.4
-- Description: Creates the messages table for storing guest messages with validation,
--              encryption support, and moderation capabilities

CREATE TABLE IF NOT EXISTS messages (
  -- Primary identifier (UUID format)
  id VARCHAR(36) PRIMARY KEY,
  
  -- Guest information
  -- name: Guest's display name (2-100 characters, validated in application)
  name VARCHAR(100) NOT NULL,
  
  -- email_encrypted: Optional email address stored in encrypted format
  -- Uses AES encryption with key from ENCRYPTION_KEY environment variable
  email_encrypted TEXT,
  
  -- message: Guest's message content (10-1000 characters, validated and sanitized)
  -- Content is sanitized using DOMPurify to prevent XSS attacks
  message TEXT NOT NULL,
  
  -- created_at: Timestamp when the message was submitted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- is_hidden: Moderation flag to hide messages without deleting them
  -- Default FALSE means message is visible to public
  is_hidden BOOLEAN DEFAULT FALSE NOT NULL,
  
  -- ip_address_hash: Hashed IP address for rate limiting and abuse prevention
  -- Stored as SHA-256 hash to protect user privacy
  ip_address_hash VARCHAR(64) NOT NULL
);

-- Create index on created_at for efficient sorting (newest first)
-- Used by GET /api/messages endpoint for reverse chronological ordering
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Create index on is_hidden for efficient filtering of visible messages
-- Used by GET /api/messages endpoint to exclude hidden messages
CREATE INDEX IF NOT EXISTS idx_messages_is_hidden ON messages(is_hidden);

-- Composite index for common query pattern (visible messages sorted by date)
-- Optimizes the main query: WHERE is_hidden = FALSE ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_messages_visible_recent ON messages(is_hidden, created_at DESC);

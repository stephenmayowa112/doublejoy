-- Guest Interactions Feature Database Schema
-- This schema defines the tables for storing guest messages and upload metadata

-- ============================================================================
-- Messages Table
-- ============================================================================
-- Stores guest messages with validation, encryption, and moderation support
-- Requirements: 1.4, 8.3, 8.4

CREATE TABLE IF NOT EXISTS messages (
  -- Primary identifier (UUID format)
  id VARCHAR(36) PRIMARY KEY,
  
  -- Guest information
  name VARCHAR(100) NOT NULL,
  email_encrypted TEXT,  -- Encrypted email address (optional)
  
  -- Message content (sanitized)
  message TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- Moderation flags
  is_hidden BOOLEAN DEFAULT FALSE NOT NULL,
  
  -- Security and rate limiting
  ip_address_hash VARCHAR(64) NOT NULL,
  
  -- Indexes for performance
  INDEX idx_created_at (created_at DESC),
  INDEX idx_is_hidden (is_hidden)
);

-- ============================================================================
-- Uploads Table
-- ============================================================================
-- Stores metadata for files uploaded to Google Drive
-- Requirements: 5.3

CREATE TABLE IF NOT EXISTS uploads (
  -- Primary identifier (UUID format)
  id VARCHAR(36) PRIMARY KEY,
  
  -- File information
  filename VARCHAR(255) NOT NULL,
  drive_file_id VARCHAR(255) NOT NULL,
  file_type VARCHAR(10) NOT NULL,  -- 'image' or 'video'
  file_size BIGINT NOT NULL,       -- Size in bytes
  mime_type VARCHAR(100) NOT NULL,
  
  -- Timestamps
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- Security and rate limiting
  ip_address_hash VARCHAR(64) NOT NULL,
  
  -- Indexes for performance
  INDEX idx_uploaded_at (uploaded_at DESC)
);

-- ============================================================================
-- Moderation Log Table (Optional - for admin actions)
-- ============================================================================
-- Logs all moderation actions for audit trail
-- Requirements: 8.5

CREATE TABLE IF NOT EXISTS moderation_log (
  -- Primary identifier
  id VARCHAR(36) PRIMARY KEY,
  
  -- Action details
  message_id VARCHAR(36) NOT NULL,
  action_type VARCHAR(20) NOT NULL,  -- 'delete' or 'hide'
  admin_id VARCHAR(100),              -- Admin identifier (TBD based on auth system)
  
  -- Timestamps
  action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- Foreign key constraint (optional, depends on database support)
  -- FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  
  -- Index for querying logs
  INDEX idx_message_id (message_id),
  INDEX idx_action_timestamp (action_timestamp DESC)
);

-- ============================================================================
-- Notes:
-- ============================================================================
-- 1. This schema is compatible with PostgreSQL, MySQL, and SQLite with minor adjustments
-- 2. For SQLite, replace TIMESTAMP with TEXT and handle timestamps in application code
-- 3. For PostgreSQL, consider using UUID type instead of VARCHAR(36) for id fields
-- 4. The ip_address_hash field stores hashed IP addresses for privacy compliance
-- 5. The email_encrypted field stores encrypted email addresses using AES encryption
-- 6. Indexes are created on frequently queried columns (created_at, is_hidden, uploaded_at)
-- 7. The moderation_log table is optional but recommended for audit compliance

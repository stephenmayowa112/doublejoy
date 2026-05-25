-- Migration: Create uploads table
-- Requirements: 5.3
-- Description: Creates the uploads table for storing metadata about files
--              uploaded to Google Drive

CREATE TABLE IF NOT EXISTS uploads (
  -- Primary identifier (UUID format)
  id VARCHAR(36) PRIMARY KEY,
  
  -- filename: Original filename from the guest's device
  -- Stored for reference and display purposes
  filename VARCHAR(255) NOT NULL,
  
  -- drive_file_id: Google Drive file ID returned after successful upload
  -- Used to reference the file in Google Drive API
  drive_file_id VARCHAR(255) NOT NULL,
  
  -- file_type: Category of file ('image' or 'video')
  -- Determined from MIME type during validation
  file_type VARCHAR(10) NOT NULL,
  
  -- file_size: Size of the file in bytes
  -- Used for validation (25MB for images, 100MB for videos)
  file_size BIGINT NOT NULL,
  
  -- mime_type: Full MIME type of the uploaded file
  -- Examples: 'image/jpeg', 'video/mp4', 'image/png'
  mime_type VARCHAR(100) NOT NULL,
  
  -- uploaded_at: Timestamp when the file was successfully uploaded
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- ip_address_hash: Hashed IP address for rate limiting and abuse prevention
  -- Stored as SHA-256 hash to protect user privacy
  ip_address_hash VARCHAR(64) NOT NULL
);

-- Create index on uploaded_at for efficient sorting and querying
-- Used for analytics and potential admin interface
CREATE INDEX IF NOT EXISTS idx_uploads_uploaded_at ON uploads(uploaded_at DESC);

-- Create index on drive_file_id for quick lookups
-- Useful for verifying uploads and potential file management features
CREATE INDEX IF NOT EXISTS idx_uploads_drive_file_id ON uploads(drive_file_id);

-- Create index on ip_address_hash for rate limiting queries
-- Used to count uploads per IP address within time windows
CREATE INDEX IF NOT EXISTS idx_uploads_ip_hash ON uploads(ip_address_hash);

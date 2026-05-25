-- Migration: Create moderation_log table
-- Requirements: 8.5
-- Description: Creates the moderation_log table for audit trail of admin actions
--              on guest messages (delete/hide operations)

CREATE TABLE IF NOT EXISTS moderation_log (
  -- Primary identifier (UUID format)
  id VARCHAR(36) PRIMARY KEY,
  
  -- message_id: Reference to the message that was moderated
  -- Links to messages.id
  message_id VARCHAR(36) NOT NULL,
  
  -- action_type: Type of moderation action performed
  -- Valid values: 'delete', 'hide', 'unhide'
  action_type VARCHAR(20) NOT NULL,
  
  -- admin_id: Identifier of the admin who performed the action
  -- Format depends on authentication system (email, username, or user ID)
  admin_id VARCHAR(100),
  
  -- action_timestamp: When the moderation action was performed
  action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- reason: Optional reason for the moderation action
  reason TEXT
);

-- Create index on message_id for querying moderation history of specific messages
CREATE INDEX IF NOT EXISTS idx_moderation_log_message_id ON moderation_log(message_id);

-- Create index on action_timestamp for chronological queries and reporting
CREATE INDEX IF NOT EXISTS idx_moderation_log_timestamp ON moderation_log(action_timestamp DESC);

-- Create index on admin_id for tracking actions by specific admins
CREATE INDEX IF NOT EXISTS idx_moderation_log_admin_id ON moderation_log(admin_id);

-- Note: Foreign key constraint is commented out for flexibility
-- Uncomment if your database supports foreign keys and you want referential integrity
-- ALTER TABLE moderation_log 
--   ADD CONSTRAINT fk_moderation_log_message 
--   FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;

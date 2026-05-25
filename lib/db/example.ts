/**
 * Example usage of the database connection module
 * This file demonstrates how to use the database connection functions
 * in a real application context.
 */

import {
  query,
  queryOne,
  execute,
  transaction,
  executeBatch,
  isDatabaseHealthy,
} from './connection';

// Example 1: Creating a table
export function createMessagesTable() {
  execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email_encrypted TEXT,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_hidden INTEGER DEFAULT 0,
      ip_address_hash TEXT NOT NULL
    )
  `);
  
  // Create indexes for performance
  execute('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)');
  execute('CREATE INDEX IF NOT EXISTS idx_messages_is_hidden ON messages(is_hidden)');
}

// Example 2: Inserting a message (with SQL injection prevention)
export function insertMessage(
  id: string,
  name: string,
  message: string,
  emailEncrypted: string | null,
  ipAddressHash: string
) {
  const result = execute(
    `INSERT INTO messages (id, name, email_encrypted, message, ip_address_hash)
     VALUES (?, ?, ?, ?, ?)`,
    [id, name, emailEncrypted, message, ipAddressHash]
  );
  
  return {
    success: result.changes === 1,
    messageId: id,
  };
}

// Example 3: Fetching messages with pagination
export function getMessages(page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  
  const messages = query<{
    id: string;
    name: string;
    message: string;
    created_at: string;
  }>(
    `SELECT id, name, message, created_at
     FROM messages
     WHERE is_hidden = 0
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  
  // Get total count for pagination
  const countResult = queryOne<{ total: number }>(
    'SELECT COUNT(*) as total FROM messages WHERE is_hidden = 0'
  );
  
  const total = countResult?.total || 0;
  
  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      hasMore: offset + messages.length < total,
    },
  };
}

// Example 4: Getting a single message by ID
export function getMessageById(id: string) {
  return queryOne<{
    id: string;
    name: string;
    message: string;
    created_at: string;
  }>(
    `SELECT id, name, message, created_at
     FROM messages
     WHERE id = ? AND is_hidden = 0`,
    [id]
  );
}

// Example 5: Updating a message (moderation)
export function hideMessage(id: string) {
  const result = execute(
    'UPDATE messages SET is_hidden = 1 WHERE id = ?',
    [id]
  );
  
  return result.changes > 0;
}

// Example 6: Deleting a message
export function deleteMessage(id: string) {
  const result = execute(
    'DELETE FROM messages WHERE id = ?',
    [id]
  );
  
  return result.changes > 0;
}

// Example 7: Using transactions for atomic operations
export function transferMessageOwnership(
  messageId: string,
  oldName: string,
  newName: string
) {
  return transaction(() => {
    // Verify the message exists and belongs to oldName
    const message = queryOne<{ name: string }>(
      'SELECT name FROM messages WHERE id = ?',
      [messageId]
    );
    
    if (!message || message.name !== oldName) {
      throw new Error('Message not found or ownership mismatch');
    }
    
    // Update the message owner
    const result = execute(
      'UPDATE messages SET name = ? WHERE id = ?',
      [newName, messageId]
    );
    
    if (result.changes === 0) {
      throw new Error('Failed to update message');
    }
    
    return { success: true };
  });
}

// Example 8: Batch insert for multiple messages
export function insertMultipleMessages(
  messages: Array<{
    id: string;
    name: string;
    message: string;
    emailEncrypted: string | null;
    ipAddressHash: string;
  }>
) {
  const paramsList = messages.map(msg => [
    msg.id,
    msg.name,
    msg.emailEncrypted,
    msg.message,
    msg.ipAddressHash,
  ]);
  
  const results = executeBatch(
    `INSERT INTO messages (id, name, email_encrypted, message, ip_address_hash)
     VALUES (?, ?, ?, ?, ?)`,
    paramsList
  );
  
  return {
    success: results.every(r => r.changes === 1),
    insertedCount: results.filter(r => r.changes === 1).length,
  };
}

// Example 9: Health check before operations
export function performDatabaseOperation() {
  if (!isDatabaseHealthy()) {
    throw new Error('Database is not available');
  }
  
  // Proceed with database operations
  return getMessages();
}

// Example 10: Demonstrating SQL injection prevention
export function searchMessagesSafely(searchTerm: string) {
  // Even if searchTerm contains malicious SQL, it's treated as a literal string
  // Example: searchTerm = "'; DROP TABLE messages; --"
  // This is SAFE because we use parameterized queries
  
  return query<{
    id: string;
    name: string;
    message: string;
  }>(
    `SELECT id, name, message
     FROM messages
     WHERE message LIKE ? AND is_hidden = 0
     ORDER BY created_at DESC`,
    [`%${searchTerm}%`]
  );
}

// Example 11: Complex query with multiple conditions
export function getMessagesByDateRange(
  startDate: string,
  endDate: string,
  nameFilter?: string
) {
  let sql = `
    SELECT id, name, message, created_at
    FROM messages
    WHERE is_hidden = 0
      AND created_at >= ?
      AND created_at <= ?
  `;
  
  const params: any[] = [startDate, endDate];
  
  if (nameFilter) {
    sql += ' AND name LIKE ?';
    params.push(`%${nameFilter}%`);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  return query<{
    id: string;
    name: string;
    message: string;
    created_at: string;
  }>(sql, params);
}

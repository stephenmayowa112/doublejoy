# Database Connection Module

This module provides a secure database connection layer with parameterized query support to prevent SQL injection attacks.

## Features

- **SQL Injection Prevention**: All queries use parameterized statements (Requirement 10.2)
- **Connection Pooling**: Singleton pattern ensures efficient connection reuse
- **Transaction Support**: ACID-compliant transactions with automatic rollback on errors
- **Batch Operations**: Efficient bulk inserts/updates with transaction wrapping
- **Error Handling**: Comprehensive error handling with detailed error messages
- **Health Checks**: Built-in database health monitoring
- **Graceful Shutdown**: Automatic connection cleanup on process exit

## Configuration

Set the database path via environment variable:

```env
DATABASE_URL=path/to/database.db
```

If not set, defaults to `./data/wedding.db`

## Usage Examples

### Basic Queries

```typescript
import { query, queryOne, execute } from '@/lib/db/connection';

// SELECT multiple rows
const users = query<{ id: number; name: string }>(
  'SELECT id, name FROM users WHERE active = ?',
  [true]
);

// SELECT single row
const user = queryOne<{ id: number; name: string }>(
  'SELECT id, name FROM users WHERE id = ?',
  [123]
);

// INSERT
const result = execute(
  'INSERT INTO users (name, email) VALUES (?, ?)',
  ['John Doe', 'john@example.com']
);
console.log('Inserted ID:', result.lastInsertRowid);

// UPDATE
const updateResult = execute(
  'UPDATE users SET email = ? WHERE id = ?',
  ['newemail@example.com', 123]
);
console.log('Rows updated:', updateResult.changes);

// DELETE
const deleteResult = execute(
  'DELETE FROM users WHERE id = ?',
  [123]
);
console.log('Rows deleted:', deleteResult.changes);
```

### Transactions

```typescript
import { transaction } from '@/lib/db/connection';

// All queries succeed or all fail
const result = transaction(() => {
  execute('INSERT INTO users (name) VALUES (?)', ['Alice']);
  execute('INSERT INTO users (name) VALUES (?)', ['Bob']);
  return { success: true };
});
```

### Batch Operations

```typescript
import { executeBatch } from '@/lib/db/connection';

const users = [
  ['Alice', 'alice@example.com'],
  ['Bob', 'bob@example.com'],
  ['Charlie', 'charlie@example.com'],
];

const results = executeBatch(
  'INSERT INTO users (name, email) VALUES (?, ?)',
  users
);
```

### Health Checks

```typescript
import { isDatabaseHealthy } from '@/lib/db/connection';

if (!isDatabaseHealthy()) {
  console.error('Database is not accessible');
}
```

## Security

### SQL Injection Prevention

The module uses parameterized queries (prepared statements) to prevent SQL injection attacks:

```typescript
// ✅ SAFE - Uses parameterized query
const users = query(
  'SELECT * FROM users WHERE name = ?',
  [userInput]
);

// ❌ UNSAFE - String concatenation (DON'T DO THIS)
const users = query(`SELECT * FROM users WHERE name = '${userInput}'`);
```

Even if `userInput` contains malicious SQL like `'; DROP TABLE users; --`, the parameterized query treats it as a literal string value, not executable SQL.

## API Reference

### `initializeDatabase(): Database`
Initializes the database connection. Called automatically by other functions.

### `getDatabase(): Database`
Returns the database instance. Initializes if not already initialized.

### `closeDatabase(): void`
Closes the database connection. Called automatically on process exit.

### `query<T>(query: string, params?: any[]): T[]`
Executes a SELECT query and returns all matching rows.

### `queryOne<T>(query: string, params?: any[]): T | undefined`
Executes a SELECT query and returns the first matching row or undefined.

### `execute(query: string, params?: any[]): RunResult`
Executes an INSERT, UPDATE, or DELETE query. Returns execution info including `changes` and `lastInsertRowid`.

### `transaction<T>(callback: () => T): T`
Executes multiple queries in a transaction. All succeed or all fail.

### `executeBatch(query: string, paramsList: any[][]): RunResult[]`
Executes the same query multiple times with different parameters. Uses a transaction for atomicity.

### `isDatabaseHealthy(): boolean`
Checks if the database connection is working.

## Testing

Run the test suite:

```bash
npm test lib/db/connection.test.ts
```

The test suite covers:
- Database initialization
- Parameterized queries
- SQL injection prevention
- CRUD operations
- Transactions with rollback
- Batch operations
- Error handling

## Performance Optimizations

- **WAL Mode**: Write-Ahead Logging enabled for better concurrency
- **Foreign Keys**: Enabled for referential integrity
- **Busy Timeout**: 5-second timeout for locked database
- **Connection Reuse**: Singleton pattern prevents connection overhead
- **Batch Transactions**: Bulk operations wrapped in transactions for speed

## Error Handling

All functions throw descriptive errors on failure:

```typescript
try {
  const result = execute('INSERT INTO users (name) VALUES (?)', ['John']);
} catch (error) {
  console.error('Database operation failed:', error.message);
}
```

Errors include:
- Original error message
- Query that failed (for debugging)
- Stack trace

## Requirements Satisfied

- **Requirement 10.2**: SQL injection prevention via parameterized queries
- Connection pooling and error handling
- Query execution functions with parameterized query support

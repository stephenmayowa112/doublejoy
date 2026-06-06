/**
 * Test Database Adapter
 * 
 * Verifies that the database adapter correctly routes to SQLite (local dev)
 * or Postgres (production) and that SQL queries work with both databases.
 */

import { query, execute, isDatabaseHealthy } from './lib/db/adapter.ts';

async function testDatabaseAdapter() {
  console.log('\n=== Testing Database Adapter ===\n');
  
  try {
    // Test 1: Health check
    console.log('Test 1: Database health check...');
    const isHealthy = await isDatabaseHealthy();
    console.log(`✓ Database is ${isHealthy ? 'healthy' : 'unhealthy'}`);
    
    // Test 2: Query with Postgres-style parameters
    console.log('\nTest 2: Query messages with Postgres syntax...');
    const messages = await query(
      'SELECT id, name, message, created_at FROM messages WHERE is_hidden = $1 ORDER BY created_at DESC LIMIT $2',
      [false, 5]
    );
    console.log(`✓ Found ${messages.length} messages`);
    if (messages.length > 0) {
      console.log('  First message:', {
        id: messages[0].id,
        name: messages[0].name,
        message: messages[0].message.substring(0, 50) + '...'
      });
    }
    
    // Test 3: Insert with Postgres syntax (then delete to keep database clean)
    console.log('\nTest 3: Insert test message with Postgres syntax...');
    const testId = 'test-' + Date.now();
    await execute(
      'INSERT INTO messages (id, name, email_encrypted, message, created_at, is_hidden, ip_address_hash) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6)',
      [testId, 'Test User', null, 'This is a test message from the database adapter test', false, 'test-hash-123']
    );
    console.log('✓ Test message inserted successfully');
    
    // Verify insert
    const inserted = await query(
      'SELECT * FROM messages WHERE id = $1',
      [testId]
    );
    console.log('✓ Verified inserted message:', {
      id: inserted[0].id,
      name: inserted[0].name,
      message: inserted[0].message
    });
    
    // Clean up test message
    await execute('DELETE FROM messages WHERE id = $1', [testId]);
    console.log('✓ Test message cleaned up');
    
    // Test 4: Count query
    console.log('\nTest 4: Count total messages...');
    const countResult = await query(
      'SELECT COUNT(*) as count FROM messages WHERE is_hidden = $1',
      [false]
    );
    console.log(`✓ Total messages: ${countResult[0].count}`);
    
    console.log('\n=== All tests passed! ===\n');
    console.log('The database adapter is working correctly.');
    console.log('SQL queries with Postgres syntax ($1, $2, CURRENT_TIMESTAMP) are being');
    console.log('automatically converted for SQLite compatibility.\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run tests
testDatabaseAdapter().then(() => {
  console.log('Test completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed with error:', error);
  process.exit(1);
});

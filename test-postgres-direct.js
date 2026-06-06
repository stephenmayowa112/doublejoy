/**
 * Direct Postgres Test
 * Tests the Postgres database connection directly
 */

import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testPostgres() {
  console.log('\n=== Testing Postgres Database Direct Connection ===\n');
  
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ No connection string found');
    process.exit(1);
  }
  
  console.log('✓ Connection string found');
  console.log(`  ${connectionString.substring(0, 50)}...\n`);
  
  try {
    const sql = neon(connectionString);
    
    // Test 1: Connection
    console.log('Test 1: Testing connection...');
    await sql`SELECT 1 as test`;
    console.log('✓ Connection successful\n');
    
    // Test 2: Insert test message
    console.log('Test 2: Inserting test message with Postgres syntax...');
    const testId = 'test-' + Date.now();
    await sql`
      INSERT INTO messages (id, name, email_encrypted, message, created_at, is_hidden, ip_address_hash)
      VALUES (${testId}, ${'Test User'}, ${null}, ${'This is a test message from Postgres'}, CURRENT_TIMESTAMP, ${false}, ${'test-hash-123'})
    `;
    console.log('✓ Test message inserted\n');
    
    // Test 3: Query the message
    console.log('Test 3: Querying messages...');
    const messages = await sql`
      SELECT id, name, message, created_at 
      FROM messages 
      WHERE is_hidden = ${false}
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    console.log(`✓ Found ${messages.length} messages`);
    if (messages.length > 0) {
      console.log('  First message:', {
        id: messages[0].id,
        name: messages[0].name,
        message: messages[0].message.substring(0, 50) + '...'
      });
    }
    console.log('');
    
    // Test 4: Clean up
    console.log('Test 4: Cleaning up test message...');
    await sql`DELETE FROM messages WHERE id = ${testId}`;
    console.log('✓ Test message deleted\n');
    
    // Test 5: Count messages
    console.log('Test 5: Counting total messages...');
    const countResult = await sql`SELECT COUNT(*) as count FROM messages WHERE is_hidden = ${false}`;
    console.log(`✓ Total messages in database: ${countResult[0].count}\n`);
    
    console.log('=== All tests passed! ===\n');
    console.log('✅ Your Postgres database is working correctly!');
    console.log('✅ Ready for production deployment to Vercel\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testPostgres();

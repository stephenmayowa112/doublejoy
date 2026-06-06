/**
 * Postgres Database Setup Script
 * 
 * Initializes the database schema for the DoubleJoy wedding website.
 * Creates tables: messages, uploads, moderation_log
 */

import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function setupDatabase() {
  console.log('\n=== Setting up Postgres Database ===\n');
  
  // Get connection string from environment
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ Error: POSTGRES_URL or DATABASE_URL environment variable not found');
    console.error('Please add your Neon database connection string to .env.local');
    process.exit(1);
  }
  
  console.log('✓ Connection string found');
  console.log('✓ Connecting to database...\n');
  
  try {
    const sql = neon(connectionString);
    
    // Test connection
    await sql`SELECT 1`;
    console.log('✓ Database connection successful\n');
    
    // Create messages table
    console.log('Creating messages table...');
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email_encrypted TEXT,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        is_hidden BOOLEAN DEFAULT FALSE NOT NULL,
        ip_address_hash VARCHAR(64) NOT NULL
      )
    `;
    console.log('✓ Messages table created');
    
    // Create indexes for messages table
    console.log('Creating indexes for messages table...');
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_is_hidden ON messages(is_hidden)`;
    console.log('✓ Messages indexes created\n');
    
    // Create uploads table
    console.log('Creating uploads table...');
    await sql`
      CREATE TABLE IF NOT EXISTS uploads (
        id VARCHAR(36) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        drive_file_id VARCHAR(255) NOT NULL,
        file_type VARCHAR(10) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        ip_address_hash VARCHAR(64) NOT NULL
      )
    `;
    console.log('✓ Uploads table created');
    
    // Create indexes for uploads table
    console.log('Creating indexes for uploads table...');
    await sql`CREATE INDEX IF NOT EXISTS idx_uploads_uploaded_at ON uploads(uploaded_at DESC)`;
    console.log('✓ Uploads indexes created\n');
    
    // Create moderation_log table
    console.log('Creating moderation_log table...');
    await sql`
      CREATE TABLE IF NOT EXISTS moderation_log (
        id VARCHAR(36) PRIMARY KEY,
        message_id VARCHAR(36) NOT NULL,
        action_type VARCHAR(20) NOT NULL,
        admin_id VARCHAR(100),
        action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        reason TEXT
      )
    `;
    console.log('✓ Moderation log table created');
    
    // Create indexes for moderation_log table
    console.log('Creating indexes for moderation_log table...');
    await sql`CREATE INDEX IF NOT EXISTS idx_moderation_log_message_id ON moderation_log(message_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_moderation_log_action_timestamp ON moderation_log(action_timestamp DESC)`;
    console.log('✓ Moderation log indexes created\n');
    
    // Verify tables were created
    console.log('Verifying tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log('✓ Tables in database:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    console.log('\n=== Database setup complete! ===\n');
    console.log('Your Postgres database is ready for production.');
    console.log('You can now deploy your website to Vercel.\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    console.error('\nFull error:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Check that your POSTGRES_URL is correct in .env.local');
    console.error('2. Verify your Neon database is active in the Neon dashboard');
    console.error('3. Check that your IP address is allowed (Neon allows all by default)');
    process.exit(1);
  }
}

// Run setup
console.log('Starting Postgres database setup...');
setupDatabase();

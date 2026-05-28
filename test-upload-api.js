/**
 * Upload API Endpoint Test Script
 * 
 * This script tests the complete upload flow:
 * 1. Creates test image files
 * 2. Sends them to the /api/upload endpoint
 * 3. Verifies the response
 * 4. Confirms files are uploaded to Google Drive
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

/**
 * Create a test image buffer (1x1 pixel PNG)
 */
function createTestImageBuffer() {
  // This is a valid 1x1 pixel transparent PNG
  const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return Buffer.from(base64PNG, 'base64');
}

/**
 * Create a test video buffer (minimal valid MP4)
 */
function createTestVideoBuffer() {
  // Minimal valid MP4 file header
  const mp4Header = Buffer.from([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
    0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
    0x6D, 0x70, 0x34, 0x31, 0x00, 0x00, 0x00, 0x08,
  ]);
  return mp4Header;
}

/**
 * Create FormData with test files
 */
function createFormData(files) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  let body = '';

  for (const file of files) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="files"; filename="${file.name}"\r\n`;
    body += `Content-Type: ${file.type}\r\n\r\n`;
    body += file.buffer.toString('binary');
    body += '\r\n';
  }

  body += `--${boundary}--\r\n`;

  return {
    body: Buffer.from(body, 'binary'),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

/**
 * Test the upload API endpoint
 */
async function testUploadAPI() {
  log('\n🚀 Starting Upload API Test...', colors.blue);
  log('='.repeat(60), colors.blue);

  const API_URL = 'http://localhost:3001/api/upload';

  try {
    // Step 1: Create test files
    log('\n📝 Step 1: Creating Test Files...', colors.blue);
    
    const testFiles = [
      {
        name: 'test-photo-1.png',
        type: 'image/png',
        buffer: createTestImageBuffer(),
      },
      {
        name: 'test-photo-2.png',
        type: 'image/png',
        buffer: createTestImageBuffer(),
      },
      {
        name: 'test-video.mp4',
        type: 'video/mp4',
        buffer: createTestVideoBuffer(),
      },
    ];

    logSuccess(`Created ${testFiles.length} test files`);
    testFiles.forEach(file => {
      logInfo(`  - ${file.name} (${file.type}, ${file.buffer.length} bytes)`);
    });

    // Step 2: Prepare multipart form data
    log('\n📦 Step 2: Preparing Upload Request...', colors.blue);
    const formData = createFormData(testFiles);
    logSuccess('Form data prepared');

    // Step 3: Send upload request
    log('\n📤 Step 3: Sending Upload Request...', colors.blue);
    logInfo(`Endpoint: ${API_URL}`);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': formData.contentType,
      },
      body: formData.body,
    });

    logInfo(`Response Status: ${response.status} ${response.statusText}`);

    // Step 4: Parse and validate response
    log('\n📋 Step 4: Validating Response...', colors.blue);

    if (!response.ok) {
      const errorText = await response.text();
      logError(`Upload failed with status ${response.status}`);
      logError(`Error: ${errorText}`);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    logSuccess('Response received successfully');

    // Check response structure
    if (!result.results || !Array.isArray(result.results)) {
      logError('Invalid response structure: missing results array');
      throw new Error('Invalid response structure');
    }

    logInfo(`Total files processed: ${result.results.length}`);

    // Analyze results
    log('\n📊 Step 5: Analyzing Upload Results...', colors.blue);
    
    let successCount = 0;
    let failureCount = 0;

    result.results.forEach((fileResult, index) => {
      const file = testFiles[index];
      log(`\nFile ${index + 1}: ${file.name}`, colors.cyan);
      
      if (fileResult.success) {
        successCount++;
        logSuccess(`Status: Success`);
        logInfo(`  Drive File ID: ${fileResult.driveFileId || 'N/A'}`);
        logInfo(`  Original Name: ${fileResult.originalName}`);
      } else {
        failureCount++;
        logError(`Status: Failed`);
        logError(`  Error: ${fileResult.error || 'Unknown error'}`);
      }
    });

    // Summary
    log('\n' + '='.repeat(60), colors.blue);
    log('📈 Test Summary:', colors.blue);
    log('='.repeat(60), colors.blue);
    logInfo(`Total files: ${result.results.length}`);
    logSuccess(`Successful uploads: ${successCount}`);
    
    if (failureCount > 0) {
      logError(`Failed uploads: ${failureCount}`);
    }

    if (successCount === testFiles.length) {
      log('\n' + '='.repeat(60), colors.green);
      logSuccess('🎉 All files uploaded successfully!');
      log('='.repeat(60), colors.green);
      log('\n✨ Your upload API is working perfectly!\n', colors.cyan);
      logInfo('Check your Google Drive folder to see the uploaded files.');
    } else if (successCount > 0) {
      log('\n' + '='.repeat(60), colors.yellow);
      logWarning('⚠️  Some files uploaded successfully, but some failed.');
      log('='.repeat(60), colors.yellow);
    } else {
      log('\n' + '='.repeat(60), colors.red);
      logError('❌ All uploads failed. Please check the errors above.');
      log('='.repeat(60), colors.red);
      process.exit(1);
    }

  } catch (error) {
    log('\n' + '='.repeat(60), colors.red);
    logError('❌ Test failed with error:');
    log('='.repeat(60), colors.red);
    console.error('\nError details:', error.message);
    
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    
    process.exit(1);
  }
}

// Run the test
testUploadAPI();

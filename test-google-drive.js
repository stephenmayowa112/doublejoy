/**
 * Google Drive Connection Test Script
 * 
 * This script verifies that:
 * 1. All Google Drive credentials are properly configured
 * 2. Authentication with Google Drive API works
 * 3. Access to the specified folder is granted
 * 4. A test file can be uploaded successfully
 */

require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const { Readable } = require('stream');

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
 * Step 1: Check environment variables
 */
function checkEnvironmentVariables() {
  log('\n📋 Step 1: Checking Environment Variables...', colors.blue);
  
  const requiredVars = [
    'GOOGLE_DRIVE_CLIENT_ID',
    'GOOGLE_DRIVE_CLIENT_SECRET',
    'GOOGLE_DRIVE_REDIRECT_URI',
    'GOOGLE_DRIVE_REFRESH_TOKEN',
    'GOOGLE_DRIVE_FOLDER_ID',
  ];

  let allPresent = true;

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logSuccess(`${varName} is set`);
    } else {
      logError(`${varName} is missing`);
      allPresent = false;
    }
  }

  if (!allPresent) {
    throw new Error('Missing required environment variables');
  }

  logSuccess('All environment variables are configured\n');
  return true;
}

/**
 * Step 2: Create OAuth2 client
 */
function createOAuth2Client() {
  log('🔐 Step 2: Creating OAuth2 Client...', colors.blue);
  
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    });

    logSuccess('OAuth2 client created successfully\n');
    return oauth2Client;
  } catch (error) {
    logError(`Failed to create OAuth2 client: ${error.message}`);
    throw error;
  }
}

/**
 * Step 3: Verify folder access
 */
async function verifyFolderAccess(oauth2Client) {
  log('📁 Step 3: Verifying Folder Access...', colors.blue);
  
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const response = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType, capabilities',
    });

    if (response.data.mimeType !== 'application/vnd.google-apps.folder') {
      logWarning('The specified ID is not a folder');
    }

    logSuccess(`Folder found: "${response.data.name}"`);
    logInfo(`Folder ID: ${response.data.id}`);
    
    if (response.data.capabilities) {
      if (response.data.capabilities.canAddChildren) {
        logSuccess('Upload permission: Granted');
      } else {
        logError('Upload permission: Denied');
        throw new Error('No permission to upload files to this folder');
      }
    }

    logSuccess('Folder access verified\n');
    return true;
  } catch (error) {
    if (error.code === 404) {
      logError('Folder not found. Please check the GOOGLE_DRIVE_FOLDER_ID');
    } else if (error.code === 403) {
      logError('Access denied. Please check folder permissions');
    } else {
      logError(`Failed to access folder: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Step 4: Upload a test file
 */
async function uploadTestFile(oauth2Client) {
  log('📤 Step 4: Uploading Test File...', colors.blue);
  
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Create test file content
    const testContent = `Google Drive Integration Test
Generated: ${new Date().toISOString()}
Website: DoubleJoy'26 Wedding
Status: Connection Successful ✅

This is a test file to verify that the Google Drive integration is working correctly.
You can safely delete this file.`;

    // Convert string to buffer and then to stream
    const buffer = Buffer.from(testContent, 'utf-8');
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `test_upload_${timestamp}.txt`;

    logInfo(`Uploading: ${fileName}`);

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType: 'text/plain',
        body: bufferStream,
      },
      fields: 'id, name, webViewLink',
    });

    logSuccess(`File uploaded successfully!`);
    logInfo(`File ID: ${response.data.id}`);
    logInfo(`File Name: ${response.data.name}`);
    
    if (response.data.webViewLink) {
      logInfo(`View Link: ${response.data.webViewLink}`);
    }

    logSuccess('Test file upload completed\n');
    return response.data;
  } catch (error) {
    logError(`Failed to upload test file: ${error.message}`);
    throw error;
  }
}

/**
 * Main test function
 */
async function runTest() {
  log('\n🚀 Starting Google Drive Integration Test...', colors.blue);
  log('='.repeat(60), colors.blue);

  try {
    // Step 1: Check environment variables
    checkEnvironmentVariables();

    // Step 2: Create OAuth2 client
    const oauth2Client = createOAuth2Client();

    // Step 3: Verify folder access
    await verifyFolderAccess(oauth2Client);

    // Step 4: Upload test file
    await uploadTestFile(oauth2Client);

    // Success summary
    log('='.repeat(60), colors.green);
    logSuccess('🎉 All tests passed! Google Drive integration is working correctly.');
    log('='.repeat(60), colors.green);
    log('\n✨ Your wedding website is ready to accept guest photo/video uploads!\n', colors.cyan);

  } catch (error) {
    log('\n' + '='.repeat(60), colors.red);
    logError('❌ Test failed. Please fix the issues above and try again.');
    log('='.repeat(60), colors.red);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

// Run the test
runTest();

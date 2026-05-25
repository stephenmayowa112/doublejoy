import { google } from 'googleapis';
import { Readable } from 'stream';

/**
 * Google Drive service for uploading guest media files
 * Uses OAuth 2.0 authentication with refresh token
 */

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

/**
 * Configuration for Google Drive API
 */
interface DriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  folderId: string;
}

/**
 * Result of a file upload operation
 */
export interface UploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  error?: string;
}

/**
 * File data for upload
 */
export interface FileUpload {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

/**
 * Get Google Drive configuration from environment variables
 */
function getDriveConfig(): DriveConfig {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!clientId || !clientSecret || !redirectUri || !refreshToken || !folderId) {
    throw new Error('Missing required Google Drive environment variables');
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    refreshToken,
    folderId,
  };
}

/**
 * Create and configure OAuth2 client
 */
function createOAuth2Client() {
  const config = getDriveConfig();
  
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );

  oauth2Client.setCredentials({
    refresh_token: config.refreshToken,
  });

  return oauth2Client;
}

/**
 * Generate filename with timestamp prefix
 * Format: YYYYMMDD_HHMMSS_originalFilename
 * 
 * @param originalName - Original filename
 * @returns Formatted filename with timestamp
 */
export function generateTimestampedFilename(originalName: string): string {
  const now = new Date();
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
  
  return `${timestamp}_${originalName}`;
}

/**
 * Sleep for a specified duration
 * 
 * @param ms - Duration in milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Upload a single file to Google Drive with retry logic
 * 
 * @param fileUpload - File data to upload
 * @param retryCount - Current retry attempt (internal use)
 * @returns Upload result with file ID or error
 */
export async function uploadFile(
  fileUpload: FileUpload,
  retryCount: number = 0
): Promise<UploadResult> {
  try {
    const oauth2Client = createOAuth2Client();
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const config = getDriveConfig();

    // Generate timestamped filename
    const fileName = generateTimestampedFilename(fileUpload.originalName);

    // Convert buffer to readable stream
    const bufferStream = new Readable();
    bufferStream.push(fileUpload.buffer);
    bufferStream.push(null);

    // Upload file to Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [config.folderId],
      },
      media: {
        mimeType: fileUpload.mimeType,
        body: bufferStream,
      },
      fields: 'id, name',
    });

    if (!response.data.id) {
      throw new Error('Upload succeeded but no file ID returned');
    }

    return {
      success: true,
      fileId: response.data.id,
      fileName: response.data.name || fileName,
    };
  } catch (error) {
    // If we haven't exhausted retries, try again with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryCount];
      console.log(
        `Upload failed for ${fileUpload.originalName}, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`
      );
      
      await sleep(delay);
      return uploadFile(fileUpload, retryCount + 1);
    }

    // All retries exhausted, return error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Upload failed for ${fileUpload.originalName} after ${MAX_RETRIES} retries:`, errorMessage);
    
    return {
      success: false,
      error: `Upload failed: ${errorMessage}`,
    };
  }
}

/**
 * Upload multiple files to Google Drive
 * Each file is uploaded independently with its own retry logic
 * 
 * @param files - Array of files to upload
 * @returns Array of upload results
 */
export async function uploadFiles(files: FileUpload[]): Promise<UploadResult[]> {
  // Upload all files in parallel
  const uploadPromises = files.map(file => uploadFile(file));
  return Promise.all(uploadPromises);
}

/**
 * Verify Google Drive authentication and folder access
 * Useful for testing configuration
 * 
 * @returns True if authentication and folder access are valid
 */
export async function verifyDriveAccess(): Promise<boolean> {
  try {
    const oauth2Client = createOAuth2Client();
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const config = getDriveConfig();

    // Try to get folder metadata to verify access
    const response = await drive.files.get({
      fileId: config.folderId,
      fields: 'id, name',
    });

    return !!response.data.id;
  } catch (error) {
    console.error('Drive access verification failed:', error);
    return false;
  }
}

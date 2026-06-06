/**
 * Media Upload API Route Handler
 * 
 * Handles uploading guest media (images and videos) to Google Drive and storing metadata.
 * 
 * POST /api/upload - Upload media files
 * 
 * Requirements: 3.1, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.2, 5.4, 5.6, 9.2, 10.2, 10.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { validateFile, validateFileType, validateBatchSize } from '@/lib/services/fileValidation';
import { checkRateLimit } from '@/lib/services/rateLimit';
import { hashIpAddress } from '@/lib/utils/ipHash';
import { uploadFiles, FileUpload } from '@/lib/services/googleDrive';
import { execute } from '@/lib/db/adapter';

/**
 * Get client IP address from request headers
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIp(request);

    // Rate Limit: 5 uploads per IP per hour (Requirement 9.2)
    const rateLimitResult = checkRateLimit('upload', ipAddress);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Upload rate limit exceeded. Please try again later.',
            retryAfter: rateLimitResult.error?.retryAfter || 3600,
          },
        },
        { status: 429 }
      );
    }

    // Verify request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CONTENT_TYPE',
            message: 'Content type must be multipart/form-data',
          },
        },
        { status: 400 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Failed to parse multipart form data',
          },
        },
        { status: 400 }
      );
    }

    // Retrieve uploaded files. Support both 'files' array and singular 'file' keys.
    let files = formData.getAll('files') as File[];
    if (files.length === 0) {
      const singular = formData.getAll('file') as File[];
      if (singular.length > 0) {
        files = singular;
      }
    }

    // Enforce batch size validation (Requirement 4.6 - up to 10 files)
    const batchValidation = validateBatchSize(files.length);
    if (!batchValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: batchValidation.error,
        },
        { status: 400 }
      );
    }

    // Track per-file validation and preparation for Google Drive upload
    const uploadsToProcess: { file: File; index: number }[] = [];
    const responseResults: any[] = new Array(files.length);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Perform validation (Requirements 4.1, 4.2, 4.3, 4.4, 4.5)
      const validation = validateFile({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      if (!validation.isValid) {
        responseResults[i] = {
          filename: file.name,
          success: false,
          error: validation.error || {
            code: 'VALIDATION_FAILED',
            message: 'File validation failed',
          },
        };
      } else {
        uploadsToProcess.push({ file, index: i });
      }
    }

    // If there are no valid files to upload, return immediate 400 response
    if (uploadsToProcess.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'All files failed validation check.',
          results: responseResults,
        },
        { status: 400 }
      );
    }

    // Map files to FileUpload buffers for Google Drive service
    const fileUploads: FileUpload[] = [];
    for (const item of uploadsToProcess) {
      const arrayBuffer = await item.file.arrayBuffer();
      fileUploads.push({
        buffer: Buffer.from(arrayBuffer),
        originalName: item.file.name,
        mimeType: item.file.type,
        size: item.file.size,
      });
    }

    // Upload to Google Drive with automatic backoff retry logic (Requirement 5.6)
    const driveUploadResults = await uploadFiles(fileUploads);

    const ipAddressHash = hashIpAddress(ipAddress);

    // Save metadata in database for successful uploads (Requirement 5.3, 10.2, 10.6)
    for (let k = 0; k < uploadsToProcess.length; k++) {
      const { file, index } = uploadsToProcess[k];
      const driveResult = driveUploadResults[k];

      if (driveResult.success && driveResult.fileId) {
        const uploadId = uuidv4();
        const typeValidation = validateFileType(file.type);
        const fileType = typeValidation.fileType || 'image';

        try {
          await execute(
            `INSERT INTO uploads (id, filename, drive_file_id, file_type, file_size, mime_type, uploaded_at, ip_address_hash)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)`,
            [
              uploadId,
              driveResult.fileName || file.name,
              driveResult.fileId,
              fileType,
              file.size,
              file.type,
              ipAddressHash,
            ]
          );

          responseResults[index] = {
            filename: file.name,
            success: true,
            driveFileId: driveResult.fileId,
            driveFileName: driveResult.fileName,
          };
        } catch (dbError) {
          console.error(`Database storage failed for upload ${file.name}:`, dbError);
          responseResults[index] = {
            filename: file.name,
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'File uploaded to Drive but metadata could not be saved',
            },
          };
        }
      } else {
        responseResults[index] = {
          filename: file.name,
          success: false,
          error: {
            code: 'DRIVE_UPLOAD_FAILED',
            message: driveResult.error || 'Upload to Google Drive failed',
          },
        };
      }
    }

    // Check if at least one file uploaded successfully
    const hasSuccessfulUploads = responseResults.some(r => r.success);

    return NextResponse.json(
      {
        success: hasSuccessfulUploads,
        results: responseResults,
      },
      { status: hasSuccessfulUploads ? 201 : 500 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during upload. Please try again later.',
        },
      },
      { status: 500 }
    );
  }
}

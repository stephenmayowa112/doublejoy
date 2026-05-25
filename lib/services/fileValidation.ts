/**
 * File Validation Service
 * 
 * Provides validation functions for media file uploads including:
 * - File type validation (JPEG, PNG, HEIC, MP4, MOV, AVI)
 * - Image size validation (≤25MB)
 * - Video size validation (≤100MB)
 * - Batch size validation (≤10 files)
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

// Constants
const MAX_IMAGE_SIZE = 25 * 1024 * 1024; // 25MB in bytes
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB in bytes
const MAX_FILES_PER_BATCH = 10;

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif', // HEIC alternative MIME type
] as const;

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime', // MOV
  'video/x-msvideo', // AVI
  'video/avi',
] as const;

const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
] as const;

// Type definitions
export interface ValidationResult {
  isValid: boolean;
  error?: ValidationError;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface FileValidationResult extends ValidationResult {
  fileType?: 'image' | 'video';
}

export interface BatchValidationResult {
  isValid: boolean;
  errors: Map<string, ValidationError>; // filename -> error
  validFiles: string[]; // filenames of valid files
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string; // MIME type
}

/**
 * Validates if a file type is allowed
 * Requirement 4.1: File type validation
 * 
 * @param mimeType - The MIME type of the file
 * @returns ValidationResult with error if type is not allowed
 */
export function validateFileType(mimeType: string): FileValidationResult {
  const normalizedType = mimeType.toLowerCase().trim();
  
  const isImage = ALLOWED_IMAGE_TYPES.includes(normalizedType as any);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(normalizedType as any);
  
  if (!isImage && !isVideo) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: `File type not allowed. Allowed types: JPEG, PNG, HEIC, MP4, MOV, AVI`,
        field: 'fileType',
      },
    };
  }
  
  return {
    isValid: true,
    fileType: isImage ? 'image' : 'video',
  };
}

/**
 * Validates if an image file size is within limits
 * Requirement 4.2: Image size validation (≤25MB)
 * 
 * @param fileSize - The size of the file in bytes
 * @returns ValidationResult with error if size exceeds limit
 */
export function validateImageSize(fileSize: number): ValidationResult {
  if (fileSize > MAX_IMAGE_SIZE) {
    return {
      isValid: false,
      error: {
        code: 'IMAGE_SIZE_EXCEEDED',
        message: `Image size exceeds maximum allowed size of 25MB`,
        field: 'fileSize',
      },
    };
  }
  
  return { isValid: true };
}

/**
 * Validates if a video file size is within limits
 * Requirement 4.3: Video size validation (≤100MB)
 * 
 * @param fileSize - The size of the file in bytes
 * @returns ValidationResult with error if size exceeds limit
 */
export function validateVideoSize(fileSize: number): ValidationResult {
  if (fileSize > MAX_VIDEO_SIZE) {
    return {
      isValid: false,
      error: {
        code: 'VIDEO_SIZE_EXCEEDED',
        message: `Video size exceeds maximum allowed size of 100MB`,
        field: 'fileSize',
      },
    };
  }
  
  return { isValid: true };
}

/**
 * Validates a single file (type and size)
 * Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 * 
 * @param file - File metadata containing name, size, and type
 * @returns ValidationResult with specific error reason if validation fails
 */
export function validateFile(file: FileMetadata): ValidationResult {
  // Validate file type first
  const typeValidation = validateFileType(file.type);
  if (!typeValidation.isValid) {
    return typeValidation;
  }
  
  // Validate size based on file type
  const fileType = typeValidation.fileType!;
  
  if (fileType === 'image') {
    return validateImageSize(file.size);
  } else {
    return validateVideoSize(file.size);
  }
}

/**
 * Validates batch size (number of files)
 * Requirement 4.6: Batch size validation (≤10 files)
 * 
 * @param fileCount - Number of files in the batch
 * @returns ValidationResult with error if batch size exceeds limit
 */
export function validateBatchSize(fileCount: number): ValidationResult {
  if (fileCount > MAX_FILES_PER_BATCH) {
    return {
      isValid: false,
      error: {
        code: 'BATCH_SIZE_EXCEEDED',
        message: `Too many files selected. Maximum ${MAX_FILES_PER_BATCH} files allowed per upload`,
        field: 'fileCount',
      },
    };
  }
  
  if (fileCount === 0) {
    return {
      isValid: false,
      error: {
        code: 'NO_FILES_SELECTED',
        message: `No files selected for upload`,
        field: 'fileCount',
      },
    };
  }
  
  return { isValid: true };
}

/**
 * Validates a batch of files
 * Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 * 
 * @param files - Array of file metadata
 * @returns BatchValidationResult with per-file errors and list of valid files
 */
export function validateFileBatch(files: FileMetadata[]): BatchValidationResult {
  const errors = new Map<string, ValidationError>();
  const validFiles: string[] = [];
  
  // First validate batch size
  const batchSizeValidation = validateBatchSize(files.length);
  if (!batchSizeValidation.isValid) {
    return {
      isValid: false,
      errors: new Map([['_batch', batchSizeValidation.error!]]),
      validFiles: [],
    };
  }
  
  // Validate each file individually
  for (const file of files) {
    const validation = validateFile(file);
    
    if (!validation.isValid) {
      errors.set(file.name, validation.error!);
    } else {
      validFiles.push(file.name);
    }
  }
  
  return {
    isValid: errors.size === 0,
    errors,
    validFiles,
  };
}

/**
 * Helper function to format file size for display
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Helper function to get file extension from filename
 * 
 * @param filename - The filename
 * @returns File extension (lowercase, without dot)
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Helper function to check if a file extension matches allowed types
 * Useful for client-side validation before MIME type is available
 * 
 * @param filename - The filename
 * @returns true if extension is allowed
 */
export function isAllowedExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'mp4', 'mov', 'avi'];
  return allowedExtensions.includes(ext);
}

// Export constants for use in other modules
export const FILE_VALIDATION_CONSTANTS = {
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  MAX_FILES_PER_BATCH,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_MIME_TYPES,
} as const;

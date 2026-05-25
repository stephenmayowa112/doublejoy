# Implementation Plan: Guest Interactions Feature

## Overview

This implementation plan breaks down the guest interactions feature into discrete coding tasks. The feature adds guest messaging and media upload capabilities to the DoubleJoy'26 wedding website using Next.js 14 App Router, TypeScript, React, and Google Drive API integration.

The implementation follows a layered approach: first establishing core infrastructure (database, validation, services), then building API endpoints, and finally creating UI components with progressive enhancement.

## Tasks

- [x] 1. Set up project infrastructure and dependencies
  - Install required npm packages: `googleapis`, `dompurify`, `@types/dompurify`, `uuid`, `@types/uuid`
  - Set up environment variables file (.env.local) with placeholders for Google Drive credentials and database connection
  - Create directory structure: `app/components/`, `app/api/messages/`, `app/api/upload/`, `lib/services/`, `lib/db/`, `lib/utils/`
  - _Requirements: 5.1, 10.1, 10.4_

- [x] 2. Implement database schema and connection
  - [x] 2.1 Create database schema for messages table
    - Define SQL schema with id, name, email_encrypted, message, created_at, is_hidden, ip_address_hash fields
    - Add indexes for created_at and is_hidden columns
    - _Requirements: 1.4, 8.3, 8.4_
  
  - [x] 2.2 Create database schema for uploads table
    - Define SQL schema with id, filename, drive_file_id, file_type, file_size, mime_type, uploaded_at, ip_address_hash fields
    - Add index for uploaded_at column
    - _Requirements: 5.3_
  
  - [x] 2.3 Implement database connection module
    - Create `lib/db/connection.ts` with database client initialization
    - Implement connection pooling and error handling
    - Export query execution functions with parameterized query support
    - _Requirements: 10.2_

- [x] 3. Implement validation services
  - [x] 3.1 Create message validation service
    - Implement `lib/services/messageValidation.ts` with functions for name validation (2-100 chars), email validation (optional, valid format), and message validation (10-1000 chars)
    - Return structured validation results with field-specific error messages
    - _Requirements: 1.2, 1.3, 1.6_
  
  - [ ]* 3.2 Write property test for name validation
    - **Property 1: Name Validation Accepts Valid Lengths**
    - **Validates: Requirements 1.2**
  
  - [ ]* 3.3 Write property test for message content validation
    - **Property 2: Message Content Validation Accepts Valid Lengths**
    - **Validates: Requirements 1.3**
  
  - [ ]* 3.4 Write property test for validation error responses
    - **Property 4: Invalid Input Returns Field-Specific Errors**
    - **Validates: Requirements 1.6**
  
  - [x] 3.5 Create file validation service
    - Implement `lib/services/fileValidation.ts` with functions for file type validation (JPEG, PNG, HEIC, MP4, MOV, AVI), image size validation (≤25MB), video size validation (≤100MB), and batch size validation (≤10 files)
    - Return structured validation results with specific error reasons
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ]* 3.6 Write property test for file type validation
    - **Property 11: File Type Validation Accepts Only Allowed Formats**
    - **Validates: Requirements 4.1**
  
  - [ ]* 3.7 Write property test for image size validation
    - **Property 12: Image Size Validation Enforces 25MB Limit**
    - **Validates: Requirements 4.2**
  
  - [ ]* 3.8 Write property test for video size validation
    - **Property 13: Video Size Validation Enforces 100MB Limit**
    - **Validates: Requirements 4.3**
  
  - [ ]* 3.9 Write property test for file validation error messages
    - **Property 14: File Validation Errors Include Specific Failure Reasons**
    - **Validates: Requirements 4.4, 4.5**
  
  - [ ]* 3.10 Write property test for batch size validation
    - **Property 15: Batch Size Validation Enforces 10 File Limit**
    - **Validates: Requirements 4.6**

- [x] 4. Implement security and sanitization services
  - [x] 4.1 Create input sanitization service
    - Implement `lib/services/sanitization.ts` using DOMPurify to sanitize message content and remove XSS attack vectors
    - Handle script tags, event handlers, javascript: protocols
    - _Requirements: 1.7, 10.3_
  
  - [ ]* 4.2 Write property test for XSS sanitization
    - **Property 5: XSS Payloads Are Sanitized**
    - **Validates: Requirements 1.7, 10.3**
  
  - [x] 4.3 Create encryption service for email addresses
    - Implement `lib/services/encryption.ts` with functions to encrypt and decrypt email addresses
    - Use environment variable for encryption key
    - _Requirements: 10.5_
  
  - [ ]* 4.4 Write property test for email encryption
    - **Property 27: Email Addresses Are Encrypted in Database**
    - **Validates: Requirements 10.5**
  
  - [x] 4.5 Create IP address hashing utility
    - Implement `lib/utils/ipHash.ts` to hash IP addresses for rate limiting and storage
    - Ensure sensitive data is not logged in plaintext
    - _Requirements: 10.6_
  
  - [ ]* 4.6 Write property test for sensitive data exclusion from logs
    - **Property 28: Sensitive Data Excluded From Logs**
    - **Validates: Requirements 10.6**

- [ ] 5. Implement rate limiting service
  - [x] 5.1 Create rate limiting middleware
    - Implement `lib/services/rateLimit.ts` with in-memory Map for development
    - Support configurable limits per endpoint (3 messages/hour, 5 uploads/hour)
    - Return 429 status with descriptive error when limit exceeded
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ]* 5.2 Write property test for message submission rate limit
    - **Property 22: Message Submission Rate Limit Enforced**
    - **Validates: Requirements 9.1**
  
  - [ ]* 5.3 Write property test for upload session rate limit
    - **Property 23: Upload Session Rate Limit Enforced**
    - **Validates: Requirements 9.2**
  
  - [ ]* 5.4 Write property test for rate limit error response
    - **Property 24: Rate Limit Exceeded Returns Descriptive Error**
    - **Validates: Requirements 9.3**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Google Drive integration service
  - [x] 7.1 Create Google Drive client service
    - Implement `lib/services/googleDrive.ts` with OAuth 2.0 authentication using googleapis package
    - Create functions for uploading files to designated folder with timestamp naming convention
    - Implement retry logic with exponential backoff (1s, 2s, 4s) for failed uploads
    - _Requirements: 5.1, 5.2, 5.3, 5.6_
  
  - [ ]* 7.2 Write property test for file naming convention
    - **Property 16: Uploaded Files Follow Naming Convention**
    - **Validates: Requirements 5.3**
  
  - [ ]* 7.3 Write property test for upload retry logic
    - **Property 17: Upload Retry Logic Executes With Exponential Backoff**
    - **Validates: Requirements 5.6**

- [ ] 8. Implement message API endpoints
  - [-] 8.1 Create POST /api/messages endpoint
    - Implement `app/api/messages/route.ts` with POST handler
    - Validate request body using message validation service
    - Sanitize input using sanitization service
    - Check rate limit before processing
    - Hash IP address and encrypt email if provided
    - Store message in database with timestamp
    - Return 201 with message data or appropriate error response (400, 429, 500)
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 9.1, 10.2, 10.3, 10.5_
  
  - [ ]* 8.2 Write property test for message storage with timestamps
    - **Property 3: Valid Messages Are Stored With Timestamps**
    - **Validates: Requirements 1.4**
  
  - [ ]* 8.3 Write property test for SQL injection prevention
    - **Property 26: SQL Injection Payloads Are Handled Safely**
    - **Validates: Requirements 10.2**
  
  - [-] 8.4 Create GET /api/messages endpoint
    - Implement GET handler in `app/api/messages/route.ts`
    - Parse query parameters for page and limit (default: page=1, limit=20, max=50)
    - Query database for messages where is_hidden=false, ordered by created_at DESC
    - Implement 60-second caching for message list
    - Return paginated response with messages, pagination metadata, and hasMore flag
    - _Requirements: 2.1, 2.3, 9.6_
  
  - [ ]* 8.5 Write property test for message sorting
    - **Property 6: Messages Are Sorted in Reverse Chronological Order**
    - **Validates: Requirements 2.1**
  
  - [ ]* 8.6 Write property test for pagination
    - **Property 8: Pagination Returns Correct Batch Sizes**
    - **Validates: Requirements 2.3**
  
  - [ ]* 8.7 Write property test for message list caching
    - **Property 25: Message List Caching Reduces Database Queries**
    - **Validates: Requirements 9.6**
  
  - [ ] 8.8 Create DELETE /api/messages/[id] endpoint (admin only)
    - Implement `app/api/messages/[id]/route.ts` with DELETE handler
    - Add authentication check (implementation TBD based on existing auth system)
    - Support delete and hide actions via request body
    - Log moderation action with admin ID and timestamp
    - Return 200 on success or appropriate error (401, 404, 500)
    - _Requirements: 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 8.9 Write property test for hidden message exclusion
    - **Property 20: Hidden Messages Are Excluded From Public Display**
    - **Validates: Requirements 8.4**
  
  - [ ]* 8.10 Write property test for moderation logging
    - **Property 21: Moderation Actions Are Logged**
    - **Validates: Requirements 8.5**

- [ ] 9. Implement upload API endpoint
  - [~] 9.1 Create POST /api/upload endpoint
    - Implement `app/api/upload/route.ts` with POST handler for multipart/form-data
    - Parse uploaded files from request (up to 10 files)
    - Validate each file using file validation service
    - Check rate limit before processing
    - Upload valid files to Google Drive using Google Drive service
    - Store upload metadata in database with hashed IP address
    - Return response with per-file upload results (success/error status, driveFileId, error messages)
    - _Requirements: 3.1, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.2, 5.4, 5.6, 9.2_

- [~] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement GuestMessagesSection component
  - [~] 11.1 Create GuestMessagesSection component structure
    - Create `app/components/GuestMessagesSection.tsx` with TypeScript interfaces for props and state
    - Implement component state for messages array, loading states, error handling, pagination
    - Set up form fields for name, email (optional), and message with controlled inputs
    - _Requirements: 1.1, 2.2_
  
  - [~] 11.2 Implement message submission logic
    - Add form submission handler that calls POST /api/messages
    - Implement client-side validation with inline error messages
    - Show optimistic UI update (add message immediately, rollback on error)
    - Display success confirmation after successful submission
    - Clear form fields after successful submission
    - _Requirements: 1.5, 1.6, 11.1, 11.4_
  
  - [ ]* 11.3 Write property test for validation error highlighting
    - **Property 29: Validation Errors Highlight Specific Fields**
    - **Validates: Requirements 11.4**
  
  - [~] 11.4 Implement message display and pagination
    - Fetch initial messages from GET /api/messages on component mount
    - Display messages with guest name, message content, and relative timestamp
    - Implement infinite scroll with intersection observer to load next page
    - Show loading indicator while fetching messages
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 11.5 Write property test for message display fields
    - **Property 7: Message Display Includes All Required Fields**
    - **Validates: Requirements 2.2**
  
  - [~] 11.6 Style GuestMessagesSection component
    - Apply Tailwind CSS classes using deep purple (#4A1A5C) and gold (#D4AF37) color scheme
    - Implement responsive design for mobile (320px+), tablet, and desktop
    - Ensure touch-friendly inputs with 44x44px minimum touch targets
    - Add ARIA labels for accessibility
    - Implement focus indicators for form fields
    - _Requirements: 2.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ]* 11.7 Write property test for ARIA labels
    - **Property 19: Interactive Elements Have ARIA Labels**
    - **Validates: Requirements 7.5**

- [ ] 12. Implement MediaUploadSection component
  - [~] 12.1 Create MediaUploadSection component structure
    - Create `app/components/MediaUploadSection.tsx` with TypeScript interfaces for props and state
    - Implement component state for selected files, upload progress, upload status, errors
    - Create FileWithPreview interface with id, file, preview, and type fields
    - _Requirements: 3.1, 3.3, 3.4_
  
  - [~] 12.2 Implement file selection interface
    - Add file input with multiple file selection support
    - Implement drag-and-drop zone with visual feedback on dragover
    - Generate preview thumbnails for images using FileReader API
    - Display file metadata (name, size) for each selected file
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 12.3 Write property test for file preview generation
    - **Property 9: File Previews Generated for All Selected Files**
    - **Validates: Requirements 3.3**
  
  - [ ]* 12.4 Write property test for file metadata display
    - **Property 10: File Metadata Displayed for All Selected Files**
    - **Validates: Requirements 3.4**
  
  - [~] 12.5 Implement client-side file validation
    - Validate file types against allowed formats (JPEG, PNG, HEIC, MP4, MOV, AVI)
    - Validate image files against 25MB size limit
    - Validate video files against 100MB size limit
    - Validate total file count against 10 file limit
    - Display inline error messages for validation failures
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [~] 12.6 Implement file upload logic
    - Add upload handler that calls POST /api/upload with FormData
    - Track upload progress for each file using XMLHttpRequest or fetch with progress events
    - Update progress bars as upload progresses
    - Display success/error indicators for each file
    - Implement retry mechanism for failed uploads
    - Prevent navigation during active uploads with beforeunload event
    - _Requirements: 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 11.2_
  
  - [ ]* 12.7 Write property test for upload progress updates
    - **Property 18: Progress Updates Reflect Upload Percentage**
    - **Validates: Requirements 6.2**
  
  - [~] 12.8 Style MediaUploadSection component
    - Apply Tailwind CSS classes using deep purple (#4A1A5C) and gold (#D4AF37) color scheme
    - Implement responsive design for mobile (320px+), tablet, and desktop
    - Ensure touch-friendly controls with 44x44px minimum touch targets
    - Add ARIA labels for accessibility
    - Style drag-and-drop zone with clear visual feedback
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 13. Implement error handling and user feedback
  - [~] 13.1 Add comprehensive error handling to components
    - Implement network error handling with user-friendly messages and retry buttons
    - Handle API errors with structured error response parsing
    - Display service unavailable messages when backend is down
    - Show validation errors inline with field highlighting
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ]* 13.2 Write property test for error response structure
    - **Property 30: Error Responses Include Code and Message**
    - **Validates: Requirements 11.6**
  
  - [~] 13.3 Implement consistent error styling
    - Create reusable error message components with consistent styling
    - Match error messages to website design aesthetic
    - Ensure error messages are accessible with proper ARIA attributes
    - _Requirements: 11.5_

- [ ] 14. Integrate components into main page
  - [~] 14.1 Add GuestMessagesSection to home page
    - Import and render GuestMessagesSection component in `app/page.tsx` or appropriate page
    - Position component in appropriate section of the page layout
    - _Requirements: 1.1, 2.1_
  
  - [~] 14.2 Add MediaUploadSection to home page
    - Import and render MediaUploadSection component in `app/page.tsx` or appropriate page
    - Position component in appropriate section of the page layout
    - _Requirements: 3.1_

- [~] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- The implementation uses TypeScript throughout for type safety
- Database choice (SQLite for development, PostgreSQL/MySQL for production) should be determined before starting task 2
- Google Drive OAuth 2.0 credentials must be obtained and configured in environment variables before starting task 7
- Admin authentication system for message moderation (task 8.8) depends on existing auth infrastructure
- Property-based tests use fast-check library with minimum 100 iterations per test
- All API endpoints implement proper error handling with structured error responses
- Security measures (sanitization, encryption, rate limiting) are integrated throughout the implementation
- The design follows Next.js 14 App Router conventions with server components and API route handlers

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["3.1", "3.5", "4.1", "4.3", "4.5"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "3.6", "3.7", "3.8", "3.9", "3.10", "4.2", "4.4", "4.6", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4", "7.1"] },
    { "id": 5, "tasks": ["7.2", "7.3", "8.1"] },
    { "id": 6, "tasks": ["8.2", "8.3", "8.4"] },
    { "id": 7, "tasks": ["8.5", "8.6", "8.7", "8.8", "9.1"] },
    { "id": 8, "tasks": ["8.9", "8.10", "11.1", "12.1"] },
    { "id": 9, "tasks": ["11.2", "11.4", "12.2"] },
    { "id": 10, "tasks": ["11.3", "11.5", "12.3", "12.4", "12.5"] },
    { "id": 11, "tasks": ["11.6", "12.6"] },
    { "id": 12, "tasks": ["11.7", "12.7", "12.8", "13.1"] },
    { "id": 13, "tasks": ["13.2", "13.3", "14.1", "14.2"] }
  ]
}
```

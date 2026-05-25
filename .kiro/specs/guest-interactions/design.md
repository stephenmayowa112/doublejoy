# Design Document: Guest Interactions Feature

## Overview

This design document specifies the technical implementation for two interactive features on the DoubleJoy'26 wedding website:

1. **Guest Messages Section**: A system for collecting, storing, and displaying text messages from wedding guests
2. **Media Upload Section**: A system for uploading photos and videos directly to Google Drive through the website

The implementation leverages Next.js 14 App Router architecture with TypeScript, React Server Components, and API Route Handlers. The design prioritizes security, performance, and user experience while maintaining the existing website's aesthetic (deep purple #4A1A5C and gold #D4AF37 color scheme).

### Key Design Principles

- **Security First**: All user input is sanitized and validated; credentials are never exposed to clients
- **Progressive Enhancement**: Core functionality works without JavaScript; enhanced features require it
- **Responsive Design**: Mobile-first approach with touch-friendly interfaces
- **Performance**: Optimistic UI updates, pagination, caching, and efficient file handling
- **Accessibility**: WCAG 2.1 AA compliance with proper ARIA labels and keyboard navigation

## Architecture

### System Architecture

The guest interactions feature follows a three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Browser)                   │
│  ┌──────────────────┐         ┌──────────────────────────┐  │
│  │ GuestMessages    │         │ MediaUpload              │  │
│  │ Component        │         │ Component                │  │
│  └────────┬─────────┘         └──────────┬───────────────┘  │
│           │                              │                   │
└───────────┼──────────────────────────────┼───────────────────┘
            │                              │
            │ HTTP/HTTPS                   │ HTTP/HTTPS
            │                              │
┌───────────┼──────────────────────────────┼───────────────────┐
│           │      Server Layer (Next.js)  │                   │
│  ┌────────▼─────────┐         ┌──────────▼───────────────┐  │
│  │ /api/messages    │         │ /api/upload              │  │
│  │ Route Handler    │         │ Route Handler            │  │
│  └────────┬─────────┘         └──────────┬───────────────┘  │
│           │                              │                   │
│  ┌────────▼─────────┐         ┌──────────▼───────────────┐  │
│  │ Message Service  │         │ Upload Service           │  │
│  │ - Validation     │         │ - File Validation        │  │
│  │ - Sanitization   │         │ - Google Drive Client    │  │
│  │ - Rate Limiting  │         │ - Rate Limiting          │  │
│  └────────┬─────────┘         └──────────┬───────────────┘  │
│           │                              │                   │
└───────────┼──────────────────────────────┼───────────────────┘
            │                              │
            │                              │ Google Drive API
┌───────────┼──────────────────────────────┼───────────────────┐
│           │      Data Layer              │                   │
│  ┌────────▼─────────┐         ┌──────────▼───────────────┐  │
│  │ Database         │         │ Google Drive Storage     │  │
│  │ (Messages)       │         │ (Media Files)            │  │
│  └──────────────────┘         └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```


### Technology Stack

**Frontend**:
- React 18.2 with TypeScript
- Next.js 14 App Router
- Tailwind CSS for styling
- React Icons (FiHeart, FiUpload, etc.)
- Client-side form validation

**Backend**:
- Next.js 14 API Route Handlers
- Node.js runtime
- Google Drive API v3 (googleapis npm package)
- DOMPurify for XSS prevention
- Rate limiting middleware

**Data Storage**:
- Database: To be determined (SQLite for development, PostgreSQL/MySQL for production recommended)
- File Storage: Google Drive via OAuth 2.0
- Session Storage: In-memory rate limiting (Redis recommended for production)

**Security**:
- HTTPS for all communications
- OAuth 2.0 for Google Drive authentication
- Input sanitization (DOMPurify)
- SQL injection prevention (parameterized queries)
- Rate limiting per IP address
- CORS configuration

## Components and Interfaces

### Frontend Components

#### 1. GuestMessagesSection Component

**Location**: `app/components/GuestMessagesSection.tsx`

**Purpose**: Display message submission form and list of guest messages

**Props**:
```typescript
interface GuestMessagesSectionProps {
  initialMessages?: Message[]
  className?: string
}
```

**State**:
```typescript
interface GuestMessagesState {
  messages: Message[]
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  hasMore: boolean
  page: number
}
```


**Key Features**:
- Message submission form with name, email (optional), and message fields
- Real-time validation with inline error messages
- Optimistic UI updates (show message immediately, rollback on error)
- Infinite scroll pagination (load 20 messages at a time)
- Loading states and error handling
- Responsive design with touch-friendly inputs (44x44px minimum)

**Accessibility**:
- ARIA labels for form fields
- Focus management for form submission
- Screen reader announcements for success/error states
- Keyboard navigation support

#### 2. MediaUploadSection Component

**Location**: `app/components/MediaUploadSection.tsx`

**Purpose**: Handle file selection, validation, and upload to Google Drive

**Props**:
```typescript
interface MediaUploadSectionProps {
  className?: string
  maxFiles?: number // default: 10
  maxImageSize?: number // default: 25MB
  maxVideoSize?: number // default: 100MB
}
```

**State**:
```typescript
interface MediaUploadState {
  selectedFiles: FileWithPreview[]
  uploadProgress: Map<string, number> // fileId -> progress percentage
  uploadStatus: Map<string, 'pending' | 'uploading' | 'success' | 'error'>
  errors: Map<string, string>
  isUploading: boolean
}

interface FileWithPreview {
  id: string
  file: File
  preview: string | null
  type: 'image' | 'video'
}
```


**Key Features**:
- Drag-and-drop file selection with visual feedback
- File input with multiple file selection
- Preview thumbnails for images and video placeholders
- Client-side file validation (type, size)
- Individual file upload progress bars
- Retry mechanism for failed uploads
- Prevention of navigation during active uploads
- Support for JPEG, PNG, HEIC, MP4, MOV, AVI formats

**Accessibility**:
- Keyboard-accessible file input
- ARIA live regions for upload status announcements
- Focus management during upload process
- Clear error messages for validation failures

### Backend API Endpoints

#### 1. POST /api/messages

**Purpose**: Submit a new guest message

**Request Body**:
```typescript
interface CreateMessageRequest {
  name: string // 2-100 characters
  email?: string // optional, valid email format
  message: string // 10-1000 characters
}
```

**Response**:
```typescript
interface CreateMessageResponse {
  success: boolean
  message?: Message
  error?: {
    code: string
    message: string
    field?: string
  }
}
```

**Status Codes**:
- 201: Message created successfully
- 400: Validation error
- 429: Rate limit exceeded
- 500: Server error


**Rate Limiting**: 3 requests per IP per hour

**Validation Rules**:
- Name: Required, 2-100 characters, alphanumeric with spaces and common punctuation
- Email: Optional, valid email format if provided
- Message: Required, 10-1000 characters

**Security Measures**:
- Input sanitization using DOMPurify
- SQL injection prevention via parameterized queries
- XSS prevention via sanitization
- Rate limiting by IP address

#### 2. GET /api/messages

**Purpose**: Retrieve paginated list of guest messages

**Query Parameters**:
```typescript
interface GetMessagesQuery {
  page?: number // default: 1
  limit?: number // default: 20, max: 50
}
```

**Response**:
```typescript
interface GetMessagesResponse {
  success: boolean
  messages: Message[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  error?: {
    code: string
    message: string
  }
}
```

**Status Codes**:
- 200: Messages retrieved successfully
- 400: Invalid query parameters
- 500: Server error

**Caching**: 60-second cache for message list


#### 3. POST /api/upload

**Purpose**: Upload media files to Google Drive

**Request**: Multipart form data with files

**Request Body**:
```typescript
// Content-Type: multipart/form-data
// Files: file[] (up to 10 files)
```

**Response**:
```typescript
interface UploadResponse {
  success: boolean
  uploads: UploadResult[]
  error?: {
    code: string
    message: string
  }
}

interface UploadResult {
  filename: string
  status: 'success' | 'error'
  driveFileId?: string
  error?: string
}
```

**Status Codes**:
- 200: Upload completed (check individual file status)
- 400: Validation error (invalid file type/size)
- 429: Rate limit exceeded
- 500: Server error
- 503: Google Drive service unavailable

**Rate Limiting**: 5 upload sessions per IP per hour

**Validation Rules**:
- File types: JPEG, PNG, HEIC, MP4, MOV, AVI
- Image size: Max 25MB
- Video size: Max 100MB
- Max files per request: 10

**Retry Logic**: Up to 3 retries with exponential backoff for Google Drive API failures


#### 4. DELETE /api/messages/[id] (Admin Only)

**Purpose**: Delete or hide a guest message (moderation)

**Authentication**: Requires admin authentication (implementation TBD)

**Request Body**:
```typescript
interface DeleteMessageRequest {
  action: 'delete' | 'hide'
}
```

**Response**:
```typescript
interface DeleteMessageResponse {
  success: boolean
  error?: {
    code: string
    message: string
  }
}
```

**Status Codes**:
- 200: Message deleted/hidden successfully
- 401: Unauthorized
- 404: Message not found
- 500: Server error

**Audit Logging**: All moderation actions are logged with admin ID and timestamp

## Data Models

### Message Model

```typescript
interface Message {
  id: string // UUID
  name: string // Guest name (2-100 chars)
  email?: string // Optional email (encrypted in DB)
  message: string // Sanitized message content (10-1000 chars)
  createdAt: Date // Timestamp
  isHidden: boolean // Moderation flag
  ipAddress: string // For rate limiting (hashed in DB)
}
```


**Database Schema** (SQL):
```sql
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email_encrypted TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_hidden BOOLEAN DEFAULT FALSE,
  ip_address_hash VARCHAR(64) NOT NULL,
  INDEX idx_created_at (created_at DESC),
  INDEX idx_is_hidden (is_hidden)
);
```

### Upload Metadata Model

```typescript
interface UploadMetadata {
  id: string // UUID
  filename: string // Original filename
  driveFileId: string // Google Drive file ID
  fileType: 'image' | 'video'
  fileSize: number // Bytes
  mimeType: string
  uploadedAt: Date
  ipAddress: string // For rate limiting (hashed in DB)
}
```

**Database Schema** (SQL):
```sql
CREATE TABLE uploads (
  id VARCHAR(36) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  drive_file_id VARCHAR(255) NOT NULL,
  file_type VARCHAR(10) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address_hash VARCHAR(64) NOT NULL,
  INDEX idx_uploaded_at (uploaded_at DESC)
);
```


### Rate Limit Model

```typescript
interface RateLimitEntry {
  key: string // IP address hash + endpoint
  count: number // Request count
  resetAt: Date // When the limit resets
}
```

**In-Memory Storage** (Development):
```typescript
// Map<key, { count: number, resetAt: Date }>
const rateLimitStore = new Map<string, RateLimitEntry>()
```

**Redis Storage** (Production Recommended):
```
Key: ratelimit:{endpoint}:{ipHash}
Value: count
TTL: 3600 seconds (1 hour)
```

### Google Drive Configuration

```typescript
interface DriveConfig {
  clientId: string // OAuth 2.0 client ID
  clientSecret: string // OAuth 2.0 client secret
  redirectUri: string // OAuth callback URL
  refreshToken: string // Long-lived refresh token
  folderId: string // Target folder ID for uploads
}
```

**Environment Variables**:
```
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REDIRECT_URI=
GOOGLE_DRIVE_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=
```

**File Naming Convention**:
```
{timestamp}_{originalFilename}
Example: 20260606_143022_wedding_photo.jpg
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Properties 1.7 and 10.3 both test XSS sanitization - these will be combined
- Properties for file validation (4.1, 4.2, 4.3) can be combined into comprehensive file validation properties
- Properties for error messaging (4.4, 4.5, 11.4) share common patterns and can be consolidated

The following properties represent the unique, non-redundant correctness requirements for this feature:

### Property 1: Name Validation Accepts Valid Lengths

*For any* string input to the name field, the validation service SHALL accept strings between 2 and 100 characters (inclusive) and reject all other lengths.

**Validates: Requirements 1.2**

### Property 2: Message Content Validation Accepts Valid Lengths

*For any* string input to the message field, the validation service SHALL accept strings between 10 and 1000 characters (inclusive) and reject all other lengths.

**Validates: Requirements 1.3**

### Property 3: Valid Messages Are Stored With Timestamps

*For any* valid message submission (name 2-100 chars, message 10-1000 chars), the system SHALL store the message in the database with a timestamp field populated with the current time.

**Validates: Requirements 1.4**


### Property 4: Invalid Input Returns Field-Specific Errors

*For any* invalid message submission (name too short/long, message too short/long, invalid email format), the validation service SHALL return an error response that identifies which specific field failed validation.

**Validates: Requirements 1.6**

### Property 5: XSS Payloads Are Sanitized

*For any* string containing XSS attack vectors (script tags, event handlers, javascript: protocols), the sanitization service SHALL remove or neutralize the malicious content before storage or display.

**Validates: Requirements 1.7, 10.3**

### Property 6: Messages Are Sorted in Reverse Chronological Order

*For any* set of messages with different timestamps, the system SHALL return them sorted by creation time in descending order (newest first).

**Validates: Requirements 2.1**

### Property 7: Message Display Includes All Required Fields

*For any* message retrieved from the database, the rendered output SHALL include the guest name, message content, and a relative timestamp (e.g., "2 hours ago").

**Validates: Requirements 2.2**

### Property 8: Pagination Returns Correct Batch Sizes

*For any* message list with N total messages and a page size of 20, requesting page P SHALL return at most 20 messages, starting from offset (P-1) × 20, and the hasMore flag SHALL be true if and only if more messages exist beyond the current batch.

**Validates: Requirements 2.3**


### Property 9: File Previews Generated for All Selected Files

*For any* set of selected files (images or videos), the UI SHALL generate and display a preview thumbnail for each file in the selection.

**Validates: Requirements 3.3**

### Property 10: File Metadata Displayed for All Selected Files

*For any* set of selected files, the UI SHALL display the filename and file size for each file in the selection.

**Validates: Requirements 3.4**

### Property 11: File Type Validation Accepts Only Allowed Formats

*For any* file with a MIME type, the validation service SHALL accept only files with MIME types corresponding to JPEG, PNG, HEIC, MP4, MOV, or AVI formats, and reject all other MIME types.

**Validates: Requirements 4.1**

### Property 12: Image Size Validation Enforces 25MB Limit

*For any* file identified as an image (JPEG, PNG, HEIC), the validation service SHALL accept files with size ≤ 25MB and reject files with size > 25MB.

**Validates: Requirements 4.2**

### Property 13: Video Size Validation Enforces 100MB Limit

*For any* file identified as a video (MP4, MOV, AVI), the validation service SHALL accept files with size ≤ 100MB and reject files with size > 100MB.

**Validates: Requirements 4.3**


### Property 14: File Validation Errors Include Specific Failure Reasons

*For any* invalid file (wrong type, too large), the validation service SHALL return an error message that specifies the validation failure reason (e.g., "allowed file types" for type errors, "maximum size" for size errors).

**Validates: Requirements 4.4, 4.5**

### Property 15: Batch Size Validation Enforces 10 File Limit

*For any* file selection, the validation service SHALL accept selections with ≤ 10 files and reject selections with > 10 files.

**Validates: Requirements 4.6**

### Property 16: Uploaded Files Follow Naming Convention

*For any* file uploaded to Google Drive, the stored filename SHALL follow the format `{timestamp}_{originalFilename}` where timestamp is in the format YYYYMMDD_HHMMSS.

**Validates: Requirements 5.3**

### Property 17: Upload Retry Logic Executes With Exponential Backoff

*For any* file upload that fails, the system SHALL retry the upload up to 3 times with exponentially increasing delays between attempts (e.g., 1s, 2s, 4s).

**Validates: Requirements 5.6**

### Property 18: Progress Updates Reflect Upload Percentage

*For any* file being uploaded, as upload progress events are received, the progress bar SHALL update to reflect the percentage of data transferred (bytes uploaded / total bytes × 100).

**Validates: Requirements 6.2**


### Property 19: Interactive Elements Have ARIA Labels

*For any* interactive element (button, input, link) in the guest interactions UI, the element SHALL have an appropriate ARIA label or aria-label attribute for screen reader accessibility.

**Validates: Requirements 7.5**

### Property 20: Hidden Messages Are Excluded From Public Display

*For any* set of messages where some are flagged as hidden (isHidden = true), the public message list SHALL exclude all messages with isHidden = true and include only messages with isHidden = false.

**Validates: Requirements 8.4**

### Property 21: Moderation Actions Are Logged

*For any* moderation action (delete or hide message), the system SHALL create a log entry containing the admin identifier, action type, message ID, and timestamp.

**Validates: Requirements 8.5**

### Property 22: Message Submission Rate Limit Enforced

*For any* IP address, the system SHALL accept at most 3 message submissions within any 1-hour window, and reject additional submissions with a rate limit error until the window resets.

**Validates: Requirements 9.1**

### Property 23: Upload Session Rate Limit Enforced

*For any* IP address, the system SHALL accept at most 5 upload sessions within any 1-hour window, and reject additional sessions with a rate limit error until the window resets.

**Validates: Requirements 9.2**


### Property 24: Rate Limit Exceeded Returns Descriptive Error

*For any* request that exceeds the rate limit, the system SHALL return an error response with status code 429 and a message indicating that the rate limit has been exceeded.

**Validates: Requirements 9.3**

### Property 25: Message List Caching Reduces Database Queries

*For any* two GET /api/messages requests made within 60 seconds with identical query parameters, the second request SHALL return cached data without executing a new database query.

**Validates: Requirements 9.6**

### Property 26: SQL Injection Payloads Are Handled Safely

*For any* input string containing SQL injection attack vectors (e.g., `'; DROP TABLE--`, `' OR '1'='1`), the system SHALL handle the input safely through parameterized queries, preventing SQL execution and treating the input as literal data.

**Validates: Requirements 10.2**

### Property 27: Email Addresses Are Encrypted in Database

*For any* message submission that includes an email address, the email SHALL be stored in the database in encrypted format (not plaintext), and SHALL be decryptable back to the original email when retrieved by authorized processes.

**Validates: Requirements 10.5**

### Property 28: Sensitive Data Excluded From Logs

*For any* operation involving sensitive data (email addresses, IP addresses, file contents), the application logs SHALL NOT contain the sensitive data in plaintext.

**Validates: Requirements 10.6**


### Property 29: Validation Errors Highlight Specific Fields

*For any* validation error on a form field, the UI SHALL highlight the specific field that failed validation and display an inline error message adjacent to that field.

**Validates: Requirements 11.4**

### Property 30: Error Responses Include Code and Message

*For any* error condition in the API, the error response SHALL include both a machine-readable error code and a human-readable error message.

**Validates: Requirements 11.6**

## Error Handling

### Client-Side Error Handling

**Form Validation Errors**:
- Display inline error messages next to invalid fields
- Highlight invalid fields with red border
- Prevent form submission until all fields are valid
- Show field-specific error messages (e.g., "Name must be between 2 and 100 characters")

**Network Errors**:
- Display user-friendly error message: "Unable to connect. Please check your internet connection and try again."
- Provide retry button for failed operations
- Show loading states during retry attempts
- Implement exponential backoff for automatic retries

**API Errors**:
- Parse structured error responses from API
- Display human-readable error messages to users
- Log technical error details to console for debugging
- Handle specific error codes (400, 429, 500, 503) with appropriate messages


**File Upload Errors**:
- Show per-file error indicators for failed uploads
- Display specific error messages (file too large, invalid type, etc.)
- Provide retry button for individual failed files
- Allow users to remove failed files and continue with successful ones
- Prevent navigation during active uploads with confirmation dialog

### Server-Side Error Handling

**Validation Errors** (400 Bad Request):
```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    field: 'name', // or 'message', 'email'
    details: 'Name must be between 2 and 100 characters'
  }
}
```

**Rate Limit Errors** (429 Too Many Requests):
```typescript
{
  success: false,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.',
    retryAfter: 3600 // seconds until rate limit resets
  }
}
```

**Server Errors** (500 Internal Server Error):
```typescript
{
  success: false,
  error: {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again later.'
  }
}
```

**Service Unavailable** (503 Service Unavailable):
```typescript
{
  success: false,
  error: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'The service is temporarily unavailable. Please try again later.'
  }
}
```


**Google Drive API Errors**:
- Authentication failures: Return 503 with "service temporarily unavailable" message
- Upload failures: Retry up to 3 times with exponential backoff (1s, 2s, 4s)
- Quota exceeded: Return 503 with appropriate message
- Network timeouts: Retry with exponential backoff

**Database Errors**:
- Connection failures: Log error, return 500 to client
- Query errors: Log error with sanitized query, return 500 to client
- Constraint violations: Return 400 with appropriate validation message

**Error Logging**:
- Log all errors to application logs with timestamp, error type, and stack trace
- Sanitize sensitive data (emails, IP addresses) before logging
- Include request ID for error correlation
- Use structured logging format (JSON) for easy parsing

## Testing Strategy

### Unit Testing

**Purpose**: Verify specific examples, edge cases, and error conditions for individual functions and components.

**Scope**:
- Individual validation functions (name length, email format, file type, file size)
- Sanitization functions (XSS prevention, SQL injection prevention)
- Utility functions (timestamp formatting, file naming, encryption/decryption)
- React component rendering (form fields present, buttons work)
- Error message formatting
- Rate limiting logic with specific scenarios

**Tools**:
- Jest for test runner
- React Testing Library for component tests
- Mock Service Worker (MSW) for API mocking


**Example Unit Tests**:
- Test that form renders with name, email, and message fields
- Test that empty name shows validation error
- Test that XSS payload `<script>alert('xss')</script>` is sanitized
- Test that SQL injection payload `'; DROP TABLE--` is handled safely
- Test that file with MIME type `application/pdf` is rejected
- Test that 26MB image file is rejected
- Test that retry logic waits 1s, 2s, 4s between attempts
- Test that hidden messages are excluded from public display
- Test that rate limit returns 429 after 3 requests

### Property-Based Testing

**Purpose**: Verify universal properties across all valid inputs using randomized test data generation.

**Scope**: All 30 correctness properties defined in this document

**Tools**:
- **fast-check** (recommended for TypeScript/JavaScript)
- Minimum 100 iterations per property test
- Custom generators for domain-specific data (messages, files, timestamps)

**Property Test Configuration**:
```typescript
import fc from 'fast-check'

// Example property test
describe('Property 1: Name Validation', () => {
  it('accepts names between 2-100 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 100 }),
        (name) => {
          const result = validateName(name)
          expect(result.isValid).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('rejects names outside 2-100 character range', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string({ maxLength: 1 }),
          fc.string({ minLength: 101 })
        ),
        (name) => {
          const result = validateName(name)
          expect(result.isValid).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```


**Property Test Tagging**:
Each property test MUST include a comment tag referencing the design property:

```typescript
// Feature: guest-interactions, Property 1: Name Validation Accepts Valid Lengths
it('accepts names between 2-100 characters', () => { ... })

// Feature: guest-interactions, Property 5: XSS Payloads Are Sanitized
it('sanitizes script tags and event handlers', () => { ... })
```

**Custom Generators**:
```typescript
// Generator for valid messages
const validMessageArbitrary = fc.record({
  name: fc.string({ minLength: 2, maxLength: 100 }),
  email: fc.option(fc.emailAddress()),
  message: fc.string({ minLength: 10, maxLength: 1000 })
})

// Generator for XSS payloads
const xssPayloadArbitrary = fc.oneof(
  fc.constant('<script>alert("xss")</script>'),
  fc.constant('<img src=x onerror="alert(1)">'),
  fc.constant('<a href="javascript:alert(1)">click</a>'),
  fc.constant('"><script>alert(String.fromCharCode(88,83,83))</script>')
)

// Generator for file metadata
const fileMetadataArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 255 }),
  size: fc.nat(),
  type: fc.oneof(
    fc.constant('image/jpeg'),
    fc.constant('image/png'),
    fc.constant('video/mp4')
  )
})
```

### Integration Testing

**Purpose**: Verify that components work together correctly and external services are properly integrated.

**Scope**:
- API route handlers with database operations
- Google Drive API integration (upload, authentication)
- End-to-end message submission flow
- End-to-end file upload flow
- Rate limiting with actual request tracking
- Caching behavior with real cache store


**Tools**:
- Jest for test runner
- Supertest for API testing
- Test database (SQLite in-memory or PostgreSQL test instance)
- Google Drive API mocks or test account

**Example Integration Tests**:
- POST /api/messages stores message in database and returns 201
- GET /api/messages returns paginated messages from database
- POST /api/upload uploads file to Google Drive and stores metadata
- Rate limiting blocks 4th message submission from same IP
- Cached message list returns same data within 60 seconds
- Google Drive authentication succeeds with valid credentials
- File upload retries 3 times on transient failures

### End-to-End Testing

**Purpose**: Verify complete user workflows from browser to backend.

**Scope**:
- User submits message and sees it appear in the list
- User uploads files and sees progress bars and success indicators
- User receives appropriate error messages for invalid inputs
- Rate limiting prevents abuse from single IP

**Tools**:
- Playwright or Cypress for browser automation
- Test database and Google Drive test account

### Accessibility Testing

**Purpose**: Verify WCAG 2.1 AA compliance.

**Scope**:
- Keyboard navigation works for all interactive elements
- Screen readers can access all content and controls
- Focus indicators are visible
- ARIA labels are present and correct
- Color contrast meets WCAG standards

**Tools**:
- axe-core for automated accessibility testing
- Manual testing with screen readers (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation testing


### Performance Testing

**Purpose**: Verify system meets performance requirements.

**Scope**:
- Message submission completes within 2 seconds
- File upload begins within 5 seconds
- Message list loads within 1 second
- System handles concurrent requests without degradation

**Tools**:
- Apache JMeter or k6 for load testing
- Chrome DevTools for client-side performance profiling

## Implementation Notes

### Database Selection

**Development**: SQLite with file-based storage
- Simple setup, no external dependencies
- Sufficient for development and testing
- File location: `./data/guest-interactions.db`

**Production**: PostgreSQL or MySQL
- Better concurrency handling
- Built-in encryption support
- Scalability for high traffic
- Connection pooling recommended

### Google Drive Setup

**Prerequisites**:
1. Create Google Cloud Project
2. Enable Google Drive API
3. Create OAuth 2.0 credentials (Web application type)
4. Configure authorized redirect URIs
5. Generate refresh token using OAuth 2.0 Playground
6. Create dedicated folder in Google Drive for uploads
7. Note folder ID from URL

**OAuth 2.0 Flow** (One-time setup):
1. Navigate to OAuth 2.0 Playground: https://developers.google.com/oauthplayground/
2. Select "Drive API v3" and scope: `https://www.googleapis.com/auth/drive.file`
3. Authorize and exchange authorization code for tokens
4. Copy refresh token to environment variables
5. Application will use refresh token to obtain access tokens automatically


### Security Considerations

**Input Sanitization**:
- Use DOMPurify library for XSS prevention
- Sanitize on server-side before storage
- Sanitize on client-side before display (defense in depth)
- Never use `dangerouslySetInnerHTML` without sanitization

**SQL Injection Prevention**:
- Always use parameterized queries or ORM
- Never concatenate user input into SQL strings
- Validate input types before database operations

**Rate Limiting Implementation**:
- Use IP address as identifier (hash before storage)
- Store rate limit data in memory (Map) for development
- Use Redis for production (persistent, distributed)
- Implement sliding window algorithm for accurate limiting
- Clean up expired entries periodically

**Credential Management**:
- Store all credentials in environment variables
- Never commit credentials to version control
- Use `.env.local` for local development
- Use secure secret management in production (AWS Secrets Manager, etc.)
- Rotate Google Drive refresh token periodically

**HTTPS Enforcement**:
- Configure Next.js to redirect HTTP to HTTPS in production
- Use HSTS headers to enforce HTTPS
- Ensure all external API calls use HTTPS

**CORS Configuration**:
- Restrict CORS to specific origins in production
- Allow credentials only for trusted origins
- Validate Origin header on server


### Performance Optimizations

**Client-Side**:
- Lazy load components (React.lazy for upload section)
- Debounce form validation (300ms delay)
- Optimize images with Next.js Image component
- Use React.memo for message list items
- Implement virtual scrolling for large message lists (if needed)
- Compress uploaded files on client before sending (optional)

**Server-Side**:
- Implement response caching (60s for message list)
- Use database connection pooling
- Index database columns used in queries (created_at, is_hidden)
- Batch database operations where possible
- Stream large file uploads instead of buffering in memory
- Use CDN for static assets

**Database**:
- Create indexes on frequently queried columns
- Implement query result caching
- Use read replicas for high traffic (production)
- Archive old messages periodically (optional)

### Monitoring and Observability

**Metrics to Track**:
- Message submission rate (per minute, per hour)
- File upload success/failure rate
- Average upload time per file size
- API response times (p50, p95, p99)
- Rate limit hit rate
- Database query performance
- Google Drive API error rate

**Logging**:
- Structured JSON logs for easy parsing
- Log levels: ERROR, WARN, INFO, DEBUG
- Include request ID for correlation
- Sanitize sensitive data before logging
- Rotate logs daily, retain for 30 days

**Alerting**:
- Alert on high error rates (>5% of requests)
- Alert on slow API responses (>5s)
- Alert on Google Drive API failures
- Alert on database connection failures
- Alert on rate limit abuse (same IP hitting limit repeatedly)


## Deployment Considerations

### Environment Variables

**Required for Production**:
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Google Drive API
GOOGLE_DRIVE_CLIENT_ID=your_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REDIRECT_URI=https://yourdomain.com/api/auth/callback
GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token
GOOGLE_DRIVE_FOLDER_ID=your_folder_id

# Security
ENCRYPTION_KEY=your_32_byte_encryption_key
SESSION_SECRET=your_session_secret

# Rate Limiting (if using Redis)
REDIS_URL=redis://host:6379

# Application
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Database Migrations

**Initial Schema**:
```sql
-- Create messages table
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email_encrypted TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_hidden BOOLEAN DEFAULT FALSE,
  ip_address_hash VARCHAR(64) NOT NULL
);

CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_hidden ON messages(is_hidden);

-- Create uploads table
CREATE TABLE uploads (
  id VARCHAR(36) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  drive_file_id VARCHAR(255) NOT NULL,
  file_type VARCHAR(10) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address_hash VARCHAR(64) NOT NULL
);

CREATE INDEX idx_uploads_uploaded_at ON uploads(uploaded_at DESC);

-- Create moderation_log table (optional, for admin features)
CREATE TABLE moderation_log (
  id VARCHAR(36) PRIMARY KEY,
  message_id VARCHAR(36) NOT NULL,
  admin_id VARCHAR(36),
  action VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id)
);

CREATE INDEX idx_moderation_log_message_id ON moderation_log(message_id);
CREATE INDEX idx_moderation_log_created_at ON moderation_log(created_at DESC);
```


### Deployment Checklist

**Pre-Deployment**:
- [ ] Set up production database (PostgreSQL/MySQL)
- [ ] Run database migrations
- [ ] Configure Google Drive API credentials
- [ ] Generate and store encryption keys
- [ ] Set up Redis for rate limiting (optional but recommended)
- [ ] Configure environment variables
- [ ] Test Google Drive upload with production credentials
- [ ] Run full test suite (unit, property, integration)
- [ ] Perform security audit (dependency scanning, OWASP checks)
- [ ] Test with production-like data volume

**Post-Deployment**:
- [ ] Verify HTTPS is enforced
- [ ] Test message submission from production
- [ ] Test file upload from production
- [ ] Verify rate limiting works
- [ ] Check error logging and monitoring
- [ ] Test on multiple devices and browsers
- [ ] Verify accessibility with screen readers
- [ ] Monitor performance metrics for 24 hours
- [ ] Set up alerting for critical errors

### Rollback Plan

**If deployment fails**:
1. Revert to previous Next.js deployment
2. Restore database from backup if schema changed
3. Verify previous version is working
4. Investigate failure in staging environment
5. Fix issues and redeploy

**Database Rollback**:
- Keep database backups before migrations
- Test rollback scripts in staging
- Document rollback procedures

## Future Enhancements

**Phase 2 Features** (Post-Launch):
- Admin dashboard for message moderation
- Email notifications for new messages
- Message reactions (hearts, likes)
- Photo gallery view of uploaded media
- Video playback in browser
- Message search and filtering
- Export messages to PDF
- Bulk upload support (>10 files)
- Image compression before upload
- Video transcoding for web playback
- Real-time message updates (WebSocket)
- Guest authentication (optional)
- Spam detection using ML
- Profanity filter for messages


## References and Resources

### Documentation
- [Next.js 14 App Router Documentation](https://nextjs.org/docs/app)
- [Google Drive API v3 Reference](https://developers.google.com/drive/api/v3/reference)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Libraries and Tools
- **googleapis**: Google Drive API client for Node.js
- **DOMPurify**: XSS sanitization library
- **fast-check**: Property-based testing library for TypeScript
- **isomorphic-dompurify**: DOMPurify wrapper for server and client
- **multer** or **formidable**: Multipart form data parsing for file uploads
- **uuid**: UUID generation for database IDs
- **bcrypt** or **crypto**: For hashing IP addresses and encrypting emails

### Security Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

### Research Sources
Content was researched and rephrased for compliance with licensing restrictions. Key sources included:
- [Next.js file upload patterns](https://oneuptime.com/blog/post/2026-01-24-nextjs-file-uploads/view) - Server Actions and Route Handlers for file uploads
- [Google Drive API integration guides](https://developers.google.com/drive/api/quickstart/nodejs) - OAuth 2.0 authentication and file upload methods
- [Rate limiting implementations](https://nesin.io/blog/rate-limiting-nextjs) - IP-based rate limiting strategies for Next.js
- [XSS prevention with DOMPurify](https://github.com/cure53/DOMPurify) - Sanitization techniques for React applications

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-XX  
**Author**: Kiro AI Agent  
**Status**: Ready for Review

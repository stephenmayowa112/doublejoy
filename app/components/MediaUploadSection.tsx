'use client'

import React, { useState, useEffect, useRef } from 'react'
import { FiCamera, FiUploadCloud, FiTrash2, FiAlertCircle, FiCheckCircle, FiRefreshCw } from 'react-icons/fi'

interface FileWithStatus {
  id: string
  file: File
  preview: string
  size: number
  type: string // image or video
  isValid: boolean
  validationError?: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  driveFileId?: string
  errorMessage?: string
  xhr?: XMLHttpRequest // reference to cancel or monitor
}

export default function MediaUploadSection() {
  const [files, setFiles] = useState<FileWithStatus[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Track if any file is actively uploading
  const isUploading = files.some(f => f.status === 'uploading')

  // Set up navigation lock (beforeunload) during active uploads (Requirement 11.2)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploading) {
        const msg = 'Uploads are still in progress. Leaving this page will cancel your active uploads. Are you sure?'
        e.preventDefault()
        e.returnValue = msg
        return msg
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isUploading])

  // Helper to format file size for display
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  // Client-side file validation (Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6)
  const validateSingleFile = (file: File): { isValid: boolean; error?: string; type: 'image' | 'video' } => {
    const mime = file.type.toLowerCase()
    const name = file.name.toLowerCase()
    
    // 1. Validate File Type (Requirement 4.1)
    const allowedImageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif']
    const allowedVideoMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi']
    
    const isImageMime = allowedImageMimes.includes(mime)
    const isVideoMime = allowedVideoMimes.includes(mime)
    
    // Fallback file extension check (e.g. HEIC or MOV doesn't always populate MIME in all OS browsers)
    const ext = name.split('.').pop() || ''
    const allowedImageExts = ['jpg', 'jpeg', 'png', 'heic', 'heif']
    const allowedVideoExts = ['mp4', 'mov', 'avi']
    
    const isImageExt = allowedImageExts.includes(ext)
    const isVideoExt = allowedVideoExts.includes(ext)

    if (!isImageMime && !isVideoMime && !isImageExt && !isVideoExt) {
      return {
        isValid: false,
        type: 'image',
        error: 'Unsupported format. Allowed: JPEG, PNG, HEIC, MP4, MOV, AVI'
      }
    }

    const fileType: 'image' | 'video' = (isImageMime || isImageExt) ? 'image' : 'video'

    // 2. Validate Size (Requirement 4.2: Image ≤ 25MB, Requirement 4.3: Video ≤ 100MB)
    const maxImageSize = 25 * 1024 * 1024
    const maxVideoSize = 100 * 1024 * 1024

    if (fileType === 'image' && file.size > maxImageSize) {
      return {
        isValid: false,
        type: 'image',
        error: 'Image is too large. Maximum size is 25MB.'
      }
    }

    if (fileType === 'video' && file.size > maxVideoSize) {
      return {
        isValid: false,
        type: 'video',
        error: 'Video is too large. Maximum size is 100MB.'
      }
    }

    return {
      isValid: true,
      type: fileType
    }
  }

  // Handle addition of files (both drop and click pick)
  const addFiles = (selectedFiles: FileList) => {
    if (isUploading) return

    // 3. Batch Size Limit check (Requirement 4.6: ≤ 10 files per batch)
    const totalProposedFiles = files.length + selectedFiles.length
    if (totalProposedFiles > 10) {
      alert('You can upload a maximum of 10 media files per batch. Please remove files or select fewer.')
      return
    }

    const newFiles: FileWithStatus[] = []

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      
      // Generate Client Preview Thumbnail (Requirement 3.3)
      let preview = ''
      const validation = validateSingleFile(file)
      
      if (validation.isValid && validation.type === 'image') {
        try {
          preview = URL.createObjectURL(file)
        } catch (e) {
          preview = ''
        }
      }

      newFiles.push({
        id: `${file.name}-${Date.now()}-${i}`,
        file,
        preview,
        size: file.size,
        type: validation.type,
        isValid: validation.isValid,
        validationError: validation.error,
        progress: 0,
        status: 'pending'
      })
    }

    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (id: string) => {
    if (isUploading) return
    setFiles(prev => {
      const target = prev.find(f => f.id === id)
      if (target?.preview) {
        URL.revokeObjectURL(target.preview)
      }
      if (target?.xhr) {
        target.xhr.abort()
      }
      return prev.filter(f => f.id !== id)
    })
  }

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!isUploading) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  // Handle File Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files)
    }
  }

  // Single file upload worker with robust progress tracking (Requirement 6.2)
  const uploadSingleFile = (fileItem: FileWithStatus) => {
    if (!fileItem.isValid || fileItem.status === 'success') return

    // Create custom XHR for granular progress tracking
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('files', fileItem.file)

    // Update state to uploading
    setFiles(prev =>
      prev.map(f =>
        f.id === fileItem.id
          ? { ...f, status: 'uploading', progress: 0, xhr }
          : f
      )
    )

    // Progress updates listener (Requirement 6.2)
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100)
        setFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id ? { ...f, progress: percentComplete } : f
          )
        )
      }
    })

    // Request load completion listener
    xhr.addEventListener('load', () => {
      try {
        const status = xhr.status
        const response = JSON.parse(xhr.responseText)

        if (status >= 200 && status < 300 && response.success) {
          const result = response.results[0]
          
          if (result && result.success) {
            setFiles(prev =>
              prev.map(f =>
                f.id === fileItem.id
                  ? { ...f, status: 'success', progress: 100, driveFileId: result.driveFileId }
                  : f
              )
            )
          } else {
            setFiles(prev =>
              prev.map(f =>
                f.id === fileItem.id
                  ? {
                      ...f,
                      status: 'error',
                      errorMessage: result?.error?.message || 'Upload failed'
                    }
                  : f
              )
            )
          }
        } else {
          setFiles(prev =>
            prev.map(f =>
              f.id === fileItem.id
                ? {
                    ...f,
                    status: 'error',
                    errorMessage: response.error?.message || 'Server error occurred during upload'
                  }
                : f
            )
          )
        }
      } catch (err) {
        setFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id
              ? { ...f, status: 'error', errorMessage: 'Invalid response from server' }
              : f
          )
        )
      }
    })

    // Request error listener
    xhr.addEventListener('error', () => {
      setFiles(prev =>
        prev.map(f =>
          f.id === fileItem.id
            ? { ...f, status: 'error', errorMessage: 'Network error occurred. Please try again.' }
            : f
        )
      )
    })

    // Send the POST request to API
    xhr.open('POST', '/api/upload', true)
    xhr.send(formData)
  }

  // Trigger uploads for all valid pending files
  const triggerBatchUpload = () => {
    const pendingValid = files.filter(f => f.isValid && (f.status === 'pending' || f.status === 'error'))
    if (pendingValid.length === 0) return

    pendingValid.forEach(fileItem => {
      uploadSingleFile(fileItem)
    })
  }

  return (
    <div className="w-full font-sans">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-deep-purple/10 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-wedding-gold/10 rounded-full blur-3xl"></div>
        
        <h3 className="text-2xl font-serif text-deep-purple mb-2 flex items-center gap-2">
          Capture & Share Media <FiCamera className="text-wedding-gold" />
        </h3>
        <p className="text-sm text-gray-600 mb-8 max-w-2xl">
          Did you snap sweet moments or record beautiful video clips at the wedding? Upload them to our shared digital album so we can keep the memories forever!
        </p>

        {/* Drop Zone Selection (Requirement 3.5) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            isUploading ? 'opacity-50 cursor-not-allowed border-gray-300' : 'cursor-pointer border-deep-purple/20 hover:border-wedding-gold hover:bg-wedding-gold/5'
          } ${isDragOver ? 'border-wedding-gold bg-wedding-gold/10 scale-[1.02]' : ''}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && addFiles(e.target.files)}
            multiple
            accept="image/*,video/*"
            disabled={isUploading}
            aria-label="Upload files"
            className="hidden"
          />
          <FiUploadCloud className={`mx-auto text-5xl mb-3 transition-transform ${isDragOver ? 'scale-110 text-wedding-gold animate-bounce' : 'text-deep-purple/50'}`} />
          <p className="font-semibold text-deep-purple text-base mb-1">
            Drag & Drop your photos and videos here
          </p>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            Supports JPEG, PNG, HEIC images up to 25MB and MP4, MOV, AVI videos up to 100MB. Upload up to 10 files per batch.
          </p>
        </div>

        {/* Selected Media Grid List */}
        {files.length > 0 && (
          <div className="mt-8 space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-deep-purple/10">
              <span className="text-sm font-semibold text-deep-purple uppercase tracking-wider">
                Selected Media ({files.length}/10)
              </span>
              {!isUploading && (
                <button
                  onClick={() => setFiles([])}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="p-4 bg-white border border-deep-purple/5 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden group"
                >
                  {/* Thumbnail / Extension Display (Requirement 3.3, 3.4) */}
                  <div className="h-32 bg-gray-100 rounded-lg overflow-hidden relative flex items-center justify-center mb-3">
                    {fileItem.preview ? (
                      <img
                        src={fileItem.preview}
                        alt={fileItem.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-3">
                        <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-deep-purple/10 text-deep-purple mb-1">
                          {fileItem.file.name.split('.').pop() || 'media'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">No preview available</span>
                      </div>
                    )}

                    {/* Progress overlay */}
                    {fileItem.status === 'uploading' && (
                      <div className="absolute inset-0 bg-deep-purple/70 backdrop-blur-xs flex items-center justify-center text-white">
                        <div className="text-center">
                          <FiRefreshCw className="animate-spin text-3xl mx-auto mb-2 text-wedding-gold" />
                          <span className="text-sm font-semibold">{fileItem.progress}%</span>
                        </div>
                      </div>
                    )}

                    {/* Success overlay */}
                    {fileItem.status === 'success' && (
                      <div className="absolute inset-0 bg-green-950/70 backdrop-blur-xs flex items-center justify-center text-white">
                        <div className="text-center animate-scaleUp">
                          <FiCheckCircle className="text-4xl mx-auto mb-1 text-green-400 fill-green-950/50" />
                          <span className="text-xs font-medium">Uploaded</span>
                        </div>
                      </div>
                    )}

                    {/* Error overlay */}
                    {fileItem.status === 'error' && (
                      <div className="absolute inset-0 bg-red-950/75 backdrop-blur-xs flex items-center justify-center text-white p-3 text-center">
                        <div className="animate-fadeIn">
                          <FiAlertCircle className="text-3xl mx-auto mb-1 text-red-400" />
                          <span className="text-[11px] leading-tight block font-medium max-h-16 overflow-y-auto">
                            {fileItem.errorMessage || 'Upload failed'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metadata & Progress details (Requirement 3.4) */}
                  <div className="flex-grow">
                    <h4 className="text-xs font-bold text-gray-800 line-clamp-1 mb-0.5" title={fileItem.file.name}>
                      {fileItem.file.name}
                    </h4>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 mb-2">
                      <span>{formatSize(fileItem.size)}</span>
                      <span className="capitalize">{fileItem.type}</span>
                    </div>

                    {/* Inline Validation Warnings (Requirement 4.4, 4.5) */}
                    {!fileItem.isValid && (
                      <div className="p-2 rounded bg-red-50 text-[10px] text-red-600 flex items-start gap-1 font-sans">
                        <FiAlertCircle className="flex-shrink-0 mt-0.5" />
                        <span>{fileItem.validationError}</span>
                      </div>
                    )}

                    {/* Individual progress bar (Requirement 6.2) */}
                    {fileItem.status === 'uploading' && (
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-wedding-gold h-full transition-all duration-100"
                          style={{ width: `${fileItem.progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>

                  {/* Retry / Delete actions */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex justify-between items-center">
                    {fileItem.status === 'error' ? (
                      <button
                        onClick={() => uploadSingleFile(fileItem)}
                        className="text-[10px] text-deep-purple hover:text-royal-purple font-semibold flex items-center gap-1 min-h-[44px] min-w-[44px] cursor-pointer"
                        aria-label="Retry upload"
                      >
                        <FiRefreshCw /> Retry
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-400 capitalize font-medium">
                        Status: {fileItem.status}
                      </span>
                    )}

                    {!isUploading && (
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                        aria-label="Remove media"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Batch Upload Triggers */}
            <div className="flex justify-end pt-4">
              <button
                onClick={triggerBatchUpload}
                disabled={isUploading || files.every(f => !f.isValid || f.status === 'success')}
                aria-label="Start Upload"
                className="min-h-[44px] bg-deep-purple hover:bg-royal-purple text-white px-8 py-2.5 rounded-lg text-sm font-semibold shadow-md active:scale-98 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FiUploadCloud className="text-lg" />
                    Upload Album Media
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

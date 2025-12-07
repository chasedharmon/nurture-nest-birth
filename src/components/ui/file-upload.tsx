'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  X,
  FileText,
  Image,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onUpload: (file: File) => Promise<{ success: boolean; error?: string }>
  accept?: string
  maxSize?: number // in bytes
  className?: string
  disabled?: boolean
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({
  onUpload,
  accept = '*/*',
  maxSize = 10 * 1024 * 1024, // 10MB default
  className,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) setIsDragging(true)
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `File too large. Maximum size is ${formatFileSize(maxSize)}.`
      }

      if (accept !== '*/*') {
        const acceptedTypes = accept.split(',').map(t => t.trim())
        const fileType = file.type
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`

        const isAccepted = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return fileExtension === type.toLowerCase()
          }
          if (type.endsWith('/*')) {
            return fileType.startsWith(type.replace('/*', '/'))
          }
          return fileType === type
        })

        if (!isAccepted) {
          return `File type not accepted. Allowed types: ${accept}`
        }
      }

      return null
    },
    [accept, maxSize]
  )

  const handleFile = useCallback(
    async (selectedFile: File) => {
      const validationError = validateFile(selectedFile)
      if (validationError) {
        setError(validationError)
        setUploadStatus('error')
        return
      }

      setFile(selectedFile)
      setError(null)
      setIsUploading(true)
      setUploadStatus('idle')

      const result = await onUpload(selectedFile)

      setIsUploading(false)
      if (result.success) {
        setUploadStatus('success')
        setTimeout(() => {
          setFile(null)
          setUploadStatus('idle')
        }, 2000)
      } else {
        setError(result.error || 'Upload failed')
        setUploadStatus('error')
      }
    },
    [onUpload, validateFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        handleFile(droppedFile)
      }
    },
    [disabled, handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        handleFile(selectedFile)
      }
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [handleFile]
  )

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      inputRef.current?.click()
    }
  }, [disabled, isUploading])

  const handleClear = useCallback(() => {
    setFile(null)
    setError(null)
    setUploadStatus('idle')
  }, [])

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />
    }
    return <FileText className="h-8 w-8 text-stone-500" />
  }

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <motion.div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging ? '#8b7355' : '#e5e5e5',
          backgroundColor: isDragging
            ? 'rgba(139, 115, 85, 0.05)'
            : 'transparent',
        }}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          isUploading && 'cursor-wait'
        )}
      >
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <div className="p-3 bg-stone-100 rounded-full">
                <Upload className="h-6 w-6 text-stone-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-700">
                  Drop a file here, or click to browse
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Max file size: {formatFileSize(maxSize)}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-4"
            >
              <div className="flex-shrink-0">{getFileIcon(file)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-stone-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <div className="flex-shrink-0">
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#8b7355]" />
                ) : uploadStatus === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : uploadStatus === 'error' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation()
                      handleClear()
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 flex items-center gap-2 text-sm text-red-600"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Multi-file upload variant
interface MultiFileUploadProps {
  onUpload: (files: File[]) => Promise<{ success: boolean; error?: string }>
  accept?: string
  maxSize?: number
  maxFiles?: number
  className?: string
  disabled?: boolean
}

export function MultiFileUpload({
  onUpload,
  accept = '*/*',
  maxSize = 10 * 1024 * 1024,
  maxFiles = 5,
  className,
  disabled = false,
}: MultiFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) setIsDragging(true)
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const validateFiles = useCallback(
    (newFiles: File[]): string | null => {
      if (files.length + newFiles.length > maxFiles) {
        return `Maximum ${maxFiles} files allowed.`
      }

      for (const file of newFiles) {
        if (file.size > maxSize) {
          return `${file.name} is too large. Maximum size is ${formatFileSize(maxSize)}.`
        }
      }

      return null
    },
    [files.length, maxFiles, maxSize]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const droppedFiles = Array.from(e.dataTransfer.files)
      const validationError = validateFiles(droppedFiles)
      if (validationError) {
        setError(validationError)
        return
      }

      setError(null)
      setFiles(prev => [...prev, ...droppedFiles])
    },
    [disabled, validateFiles]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      const validationError = validateFiles(selectedFiles)
      if (validationError) {
        setError(validationError)
        return
      }

      setError(null)
      setFiles(prev => [...prev, ...selectedFiles])

      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [validateFiles]
  )

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      inputRef.current?.click()
    }
  }, [disabled, isUploading])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setError(null)

    const result = await onUpload(files)

    setIsUploading(false)
    if (result.success) {
      setFiles([])
    } else {
      setError(result.error || 'Upload failed')
    }
  }, [files, onUpload])

  return (
    <div className={cn('w-full space-y-4', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <motion.div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging ? '#8b7355' : '#e5e5e5',
          backgroundColor: isDragging
            ? 'rgba(139, 115, 85, 0.05)'
            : 'transparent',
        }}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          isUploading && 'cursor-wait'
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-3 bg-stone-100 rounded-full">
            <Upload className="h-6 w-6 text-stone-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-700">
              Drop files here, or click to browse
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Max {maxFiles} files, {formatFileSize(maxSize)} each
            </p>
          </div>
        </div>
      </motion.div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <motion.div
              key={`${file.name}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg"
            >
              <FileText className="h-5 w-5 text-stone-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-stone-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={isUploading}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}

          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-[#8b7355] hover:bg-[#6b5a45] text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {files.length} file{files.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-sm text-red-600"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

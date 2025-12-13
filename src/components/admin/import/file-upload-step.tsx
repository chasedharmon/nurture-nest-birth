'use client'

import { useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, FileText, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { parseFile } from '@/lib/import/parsers'
import type { ParsedFile } from '@/lib/import/types'

interface FileUploadStepProps {
  onFileLoaded: (parsedFile: ParsedFile) => void
}

export function FileUploadStep({ onFileLoaded }: FileUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)
      setIsLoading(true)
      setSelectedFile(file)

      try {
        const parsed = await parseFile(file)

        if (parsed.headers.length === 0) {
          setError('No data found in file. Please check the file format.')
          return
        }

        if (parsed.rows.length === 0) {
          setError('No data rows found. The file appears to only have headers.')
          return
        }

        onFileLoaded(parsed)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file')
        setSelectedFile(null)
      } finally {
        setIsLoading(false)
      }
    },
    [onFileLoaded]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const clearFile = useCallback(() => {
    setSelectedFile(null)
    setError(null)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Upload Your File</h2>
        <p className="text-sm text-muted-foreground">
          Upload a CSV or Excel file containing your data. We support .csv,
          .xlsx, and .xls formats.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!selectedFile ? (
        <Card
          className={`border-2 border-dashed p-12 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-muted p-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>

            <div>
              <p className="font-medium">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supported formats: CSV, Excel (.xlsx, .xls)
              </p>
            </div>

            <label htmlFor="file-upload">
              <Button asChild disabled={isLoading}>
                <span>
                  {isLoading ? 'Processing...' : 'Select File'}
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                </span>
              </Button>
            </label>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedFile.name.endsWith('.csv') ? (
                <FileText className="h-10 w-10 text-green-600" />
              ) : (
                <FileSpreadsheet className="h-10 w-10 text-green-600" />
              )}
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      <div className="rounded-lg bg-muted/50 p-4">
        <h3 className="mb-2 font-medium">Tips for successful imports:</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Ensure your file has a header row with column names</li>
          <li>• Email addresses should be valid (e.g., name@example.com)</li>
          <li>• Dates should be in YYYY-MM-DD or MM/DD/YYYY format</li>
          <li>
            • Phone numbers can include formatting (we&apos;ll clean them up)
          </li>
          <li>• Required fields: Name, Email</li>
        </ul>
      </div>
    </div>
  )
}

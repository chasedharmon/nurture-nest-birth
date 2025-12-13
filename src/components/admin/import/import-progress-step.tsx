'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { executeImport } from '@/app/actions/import'
import type {
  ImportObjectType,
  ImportResult,
  ParsedFile,
} from '@/lib/import/types'

interface ImportProgressStepProps {
  parsedFile: ParsedFile
  objectType: ImportObjectType
  mapping: Record<string, string | null>
  selectedRows: number[]
  onComplete: (result: ImportResult) => void
  onReset: () => void
}

type ImportPhase = 'ready' | 'importing' | 'complete' | 'error'

export function ImportProgressStep({
  parsedFile,
  objectType,
  mapping,
  selectedRows,
  onComplete,
  onReset,
}: ImportProgressStepProps) {
  const [phase, setPhase] = useState<ImportPhase>('ready')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const hasStartedRef = React.useRef(false)

  const startImport = useCallback(async () => {
    setPhase('importing')
    setProgress(0)

    // Get only the selected rows
    const rowsToImport = parsedFile.rows.filter((_, index) =>
      selectedRows.includes(index + 1)
    )

    // Simulate progress during import
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 90))
    }, 200)

    try {
      const importResult = await executeImport(
        objectType,
        rowsToImport,
        mapping,
        {
          fileName: parsedFile.filename,
          skipDuplicates: true,
          duplicateCheckField: 'email',
        }
      )

      clearInterval(progressInterval)
      setProgress(100)
      setResult(importResult)
      setPhase(importResult.success ? 'complete' : 'error')
      onComplete(importResult)
    } catch (error) {
      clearInterval(progressInterval)
      setProgress(100)
      setResult({
        success: false,
        totalRows: rowsToImport.length,
        successfulRows: 0,
        failedRows: rowsToImport.length,
        skippedRows: 0,
        errors: [
          {
            row: 0,
            message:
              error instanceof Error ? error.message : 'Unknown error occurred',
          },
        ],
      })
      setPhase('error')
    }
  }, [parsedFile, selectedRows, objectType, mapping, onComplete])

  // Start import automatically when component mounts
  useEffect(() => {
    if (phase === 'ready' && !hasStartedRef.current) {
      hasStartedRef.current = true
      // Use setTimeout to avoid calling setState synchronously in effect
      const timeoutId = setTimeout(() => {
        startImport()
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [phase, startImport])

  const downloadErrorReport = () => {
    if (!result?.errors?.length) return

    const csvContent = [
      ['Row', 'Error', 'Data'].join(','),
      ...result.errors.map(error =>
        [
          error.row,
          `"${error.message.replace(/"/g, '""')}"`,
          error.data
            ? `"${JSON.stringify(error.data).replace(/"/g, '""')}"`
            : '',
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `import-errors-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const objectLabel =
    objectType === 'leads'
      ? 'leads'
      : objectType === 'clients'
        ? 'clients'
        : objectType

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          {phase === 'importing'
            ? 'Importing...'
            : phase === 'complete'
              ? 'Import Complete!'
              : phase === 'error'
                ? 'Import Finished with Errors'
                : 'Ready to Import'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {phase === 'importing'
            ? 'Please wait while your data is being imported.'
            : phase === 'complete'
              ? `Your ${objectLabel} have been imported successfully.`
              : phase === 'error'
                ? 'Some records could not be imported.'
                : `Click Start Import to begin.`}
        </p>
      </div>

      {/* Progress Card */}
      <Card className="p-6">
        {phase === 'importing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              Processing {selectedRows.length} records...
            </p>
          </div>
        )}

        {(phase === 'complete' || phase === 'error') && result && (
          <div className="space-y-6">
            {/* Result Summary */}
            <div className="flex items-center justify-center">
              {result.success ? (
                <div className="rounded-full bg-green-100 p-4 dark:bg-green-950">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              ) : result.successfulRows > 0 ? (
                <div className="rounded-full bg-yellow-100 p-4 dark:bg-yellow-950">
                  <AlertCircle className="h-12 w-12 text-yellow-600" />
                </div>
              ) : (
                <div className="rounded-full bg-red-100 p-4 dark:bg-red-950">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{result.totalRows}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {result.successfulRows}
                </p>
                <p className="text-sm text-muted-foreground">Imported</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {result.failedRows}
                </p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {result.skippedRows}
                </p>
                <p className="text-sm text-muted-foreground">Skipped</p>
              </div>
            </div>

            {/* Error List (if any) */}
            {result.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium text-red-800 dark:text-red-200">
                    {result.errors.length} Error(s)
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadErrorReport}
                    className="text-red-600"
                  >
                    <Download className="mr-1 h-4 w-4" />
                    Download Error Report
                  </Button>
                </div>
                <ul className="max-h-40 space-y-1 overflow-auto text-sm text-red-700 dark:text-red-300">
                  {result.errors.slice(0, 10).map((error, idx) => (
                    <li key={idx}>
                      Row {error.row}: {error.message}
                    </li>
                  ))}
                  {result.errors.length > 10 && (
                    <li className="italic">
                      ...and {result.errors.length - 10} more errors
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      {(phase === 'complete' || phase === 'error') && (
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={onReset}>
            Import Another File
          </Button>
          <Button asChild>
            <a
              href={`/admin/${objectType === 'clients' ? 'leads' : objectType}`}
            >
              View {objectLabel.charAt(0).toUpperCase() + objectLabel.slice(1)}
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}

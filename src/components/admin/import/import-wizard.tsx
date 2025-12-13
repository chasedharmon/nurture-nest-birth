'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FileUploadStep } from './file-upload-step'
import { ColumnMappingStep } from './column-mapping-step'
import { PreviewStep } from './preview-step'
import { ImportProgressStep } from './import-progress-step'
import { getMappingTemplates, saveMappingTemplate } from '@/app/actions/import'
import { getMissingRequiredFields } from '@/lib/import/field-definitions'
import type {
  ImportObjectType,
  ParsedFile,
  MappingTemplate,
  ImportResult,
} from '@/lib/import/types'

interface ImportWizardProps {
  objectType: ImportObjectType
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'import'

const STEPS: WizardStep[] = ['upload', 'mapping', 'preview', 'import']

const STEP_LABELS: Record<WizardStep, string> = {
  upload: 'Upload File',
  mapping: 'Map Columns',
  preview: 'Preview',
  import: 'Import',
}

export function ImportWizard({ objectType }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload')
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null)
  const [mapping, setMapping] = useState<Record<string, string | null>>({})
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [savedTemplates, setSavedTemplates] = useState<MappingTemplate[]>([])
  // Track import result for potential future use (e.g., showing summary)
  const [, setImportResult] = useState<ImportResult | null>(null)

  // Load saved templates
  useEffect(() => {
    getMappingTemplates(objectType).then(result => {
      if (result.success) {
        setSavedTemplates(result.data)
      }
    })
  }, [objectType])

  // Calculate current step index
  const currentStepIndex = STEPS.indexOf(currentStep)

  // Check if can proceed to next step
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 'upload':
        return parsedFile !== null
      case 'mapping':
        return getMissingRequiredFields(mapping, objectType).length === 0
      case 'preview':
        return selectedRows.length > 0
      default:
        return false
    }
  }, [currentStep, parsedFile, mapping, objectType, selectedRows])

  // Navigation handlers
  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length && canProceed()) {
      setCurrentStep(STEPS[nextIndex]!)
    }
  }, [currentStepIndex, canProceed])

  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]!)
    }
  }, [currentStepIndex])

  // File upload handler
  const handleFileLoaded = useCallback((file: ParsedFile) => {
    setParsedFile(file)
    // Initialize mapping with null values
    const initialMapping: Record<string, string | null> = {}
    file.headers.forEach(header => {
      initialMapping[header] = null
    })
    setMapping(initialMapping)
    setCurrentStep('mapping')
  }, [])

  // Mapping change handler
  const handleMappingChange = useCallback(
    (newMapping: Record<string, string | null>) => {
      setMapping(newMapping)
    },
    []
  )

  // Save template handler
  const handleSaveTemplate = useCallback(
    async (name: string) => {
      const cleanMapping: Record<string, string> = {}
      Object.entries(mapping).forEach(([key, value]) => {
        if (value) cleanMapping[key] = value
      })

      const result = await saveMappingTemplate(name, objectType, cleanMapping)
      if (result.success && result.data) {
        setSavedTemplates(prev => [...prev, result.data!])
      }
    },
    [mapping, objectType]
  )

  // Load template handler
  const handleLoadTemplate = useCallback(
    (template: MappingTemplate) => {
      const newMapping: Record<string, string | null> = {}
      parsedFile?.headers.forEach(header => {
        newMapping[header] = template.mappings[header] || null
      })
      setMapping(newMapping)
    },
    [parsedFile]
  )

  // Row selection change handler (for preview step)
  const handleRowSelectionChange = useCallback((rows: number[]) => {
    setSelectedRows(rows)
  }, [])

  // Track if we've initialized selected rows for preview
  const hasInitializedPreviewRef = useRef(false)

  // Initialize selected rows when entering preview
  useEffect(() => {
    if (
      currentStep === 'preview' &&
      parsedFile &&
      !hasInitializedPreviewRef.current
    ) {
      hasInitializedPreviewRef.current = true
      // Select all valid rows by default using setTimeout to avoid sync setState in effect
      const timeoutId = setTimeout(() => {
        const allRows = Array.from(
          { length: parsedFile.rows.length },
          (_, i) => i + 1
        )
        setSelectedRows(allRows)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
    // Reset flag when leaving preview step
    if (currentStep !== 'preview') {
      hasInitializedPreviewRef.current = false
    }
  }, [currentStep, parsedFile])

  // Import complete handler
  const handleImportComplete = useCallback((result: ImportResult) => {
    setImportResult(result)
  }, [])

  // Reset wizard
  const handleReset = useCallback(() => {
    setParsedFile(null)
    setMapping({})
    setSelectedRows([])
    setImportResult(null)
    setCurrentStep('upload')
  }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Progress Steps */}
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isCurrent = step === currentStep
            const isPast = index < currentStepIndex
            const isFuture = index > currentStepIndex

            return (
              <li key={step} className="flex items-center">
                <div
                  className={`flex items-center ${
                    index < STEPS.length - 1 ? 'flex-1' : ''
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      isPast
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isCurrent
                          ? 'border-primary bg-background text-primary'
                          : 'border-muted-foreground/30 bg-background text-muted-foreground'
                    }`}
                  >
                    {isPast ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      isFuture ? 'text-muted-foreground' : ''
                    }`}
                  >
                    {STEP_LABELS[step]}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-4 h-0.5 w-20 sm:w-32 ${
                      isPast ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Step Content */}
      <Card className="p-6">
        {currentStep === 'upload' && (
          <FileUploadStep onFileLoaded={handleFileLoaded} />
        )}

        {currentStep === 'mapping' && parsedFile && (
          <ColumnMappingStep
            parsedFile={parsedFile}
            objectType={objectType}
            mapping={mapping}
            onMappingChange={handleMappingChange}
            savedTemplates={savedTemplates}
            onSaveTemplate={handleSaveTemplate}
            onLoadTemplate={handleLoadTemplate}
          />
        )}

        {currentStep === 'preview' && parsedFile && (
          <PreviewStep
            parsedFile={parsedFile}
            objectType={objectType}
            mapping={mapping}
            selectedRows={selectedRows}
            onRowSelectionChange={handleRowSelectionChange}
          />
        )}

        {currentStep === 'import' && parsedFile && (
          <ImportProgressStep
            parsedFile={parsedFile}
            objectType={objectType}
            mapping={mapping}
            selectedRows={selectedRows}
            onComplete={handleImportComplete}
            onReset={handleReset}
          />
        )}
      </Card>

      {/* Navigation Buttons */}
      {currentStep !== 'import' && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button onClick={goNext} disabled={!canProceed()}>
            {currentStep === 'preview' ? (
              <>
                Start Import
                <Check className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import {
  Database,
  Columns3,
  Filter,
  Layers,
  Calculator,
  BarChart3,
  Save,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ReportConfig } from '@/lib/supabase/types'
import { ReportObjectSelector } from './report-object-selector'
import { ReportColumnPicker } from './report-column-picker'
import { ReportFilterStep } from './report-filter-step'
import { ReportGroupingStep } from './report-grouping-step'
import { ReportAggregationStep } from './report-aggregation-step'
import { ReportChartConfig } from './report-chart-config'
import { ReportSaveDialog } from './report-save-dialog'
import { ReportPreview } from './report-preview'

const STEPS = [
  { id: 'object', label: 'Select Data', icon: Database },
  { id: 'columns', label: 'Choose Fields', icon: Columns3 },
  { id: 'filters', label: 'Add Filters', icon: Filter },
  { id: 'grouping', label: 'Group By', icon: Layers },
  { id: 'aggregations', label: 'Calculations', icon: Calculator },
  { id: 'chart', label: 'Chart Options', icon: BarChart3 },
] as const

type StepId = (typeof STEPS)[number]['id']

// Re-export for backwards compatibility
export type { ReportConfig } from '@/lib/supabase/types'

interface ReportBuilderWizardProps {
  initialConfig?: ReportConfig
  onSave: (config: ReportConfig) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

const DEFAULT_CONFIG: ReportConfig = {
  name: '',
  description: '',
  report_type: 'tabular',
  object_type: 'leads',
  columns: [],
  filters: [],
  groupings: [],
  aggregations: [],
  chart_config: { type: 'bar', showLegend: true, showGrid: true },
  visibility: 'private',
}

export function ReportBuilderWizard({
  initialConfig,
  onSave,
  onCancel,
  isEdit = false,
}: ReportBuilderWizardProps) {
  const [currentStep, setCurrentStep] = useState<StepId>('object')
  const [config, setConfig] = useState<ReportConfig>(
    initialConfig || DEFAULT_CONFIG
  )
  const [showPreview, setShowPreview] = useState(false)

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)

  const updateConfig = (updates: Partial<ReportConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const goToStep = (step: StepId) => {
    setCurrentStep(step)
  }

  const goNext = () => {
    const nextStep = STEPS[currentStepIndex + 1]
    if (nextStep) {
      setCurrentStep(nextStep.id)
    }
  }

  const goPrev = () => {
    const prevStep = STEPS[currentStepIndex - 1]
    if (prevStep) {
      setCurrentStep(prevStep.id)
    }
  }

  const handleSave = async (data: {
    name: string
    description: string
    visibility: 'private' | 'shared' | 'org'
  }) => {
    const finalConfig: ReportConfig = {
      ...config,
      name: data.name,
      description: data.description,
      visibility: data.visibility,
    }
    await onSave(finalConfig)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'object':
        return !!config.object_type
      case 'columns':
        return config.columns.filter(c => c.visible).length > 0
      default:
        return true
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isCompleted = index < currentStepIndex

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => goToStep(step.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                      isActive && 'bg-primary text-primary-foreground',
                      isCompleted && 'text-primary',
                      !isActive &&
                        !isCompleted &&
                        'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border-2',
                        isActive &&
                          'border-primary-foreground bg-primary-foreground/20',
                        isCompleted &&
                          'border-primary bg-primary text-primary-foreground',
                        !isActive && !isCompleted && 'border-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className="hidden md:inline text-sm font-medium">
                      {step.label}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {STEPS[currentStepIndex]?.label || 'Report Builder'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStep === 'object' && (
                <ReportObjectSelector
                  value={config.object_type}
                  reportType={config.report_type}
                  onChange={(objectType, reportType) =>
                    updateConfig({
                      object_type: objectType,
                      report_type: reportType,
                      columns: [], // Reset columns when object changes
                    })
                  }
                />
              )}
              {currentStep === 'columns' && (
                <ReportColumnPicker
                  objectType={config.object_type}
                  selectedColumns={config.columns}
                  onChange={columns => updateConfig({ columns })}
                />
              )}
              {currentStep === 'filters' && (
                <ReportFilterStep
                  objectType={config.object_type}
                  filters={config.filters}
                  onChange={filters => updateConfig({ filters })}
                />
              )}
              {currentStep === 'grouping' && (
                <ReportGroupingStep
                  objectType={config.object_type}
                  selectedColumns={config.columns}
                  groupings={config.groupings}
                  onChange={groupings => updateConfig({ groupings })}
                />
              )}
              {currentStep === 'aggregations' && (
                <ReportAggregationStep
                  objectType={config.object_type}
                  aggregations={config.aggregations}
                  onChange={aggregations => updateConfig({ aggregations })}
                />
              )}
              {currentStep === 'chart' && (
                <ReportChartConfig
                  objectType={config.object_type}
                  groupings={config.groupings}
                  aggregations={config.aggregations}
                  chartConfig={config.chart_config}
                  onChange={chart_config => updateConfig({ chart_config })}
                />
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-4">
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={goPrev}
                disabled={currentStepIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Hide Preview' : 'Preview Report'}
              </Button>
              {currentStepIndex === STEPS.length - 1 ? (
                <ReportSaveDialog
                  onSave={handleSave}
                  initialName={config.name}
                  initialDescription={config.description}
                  initialVisibility={config.visibility}
                  isEdit={isEdit}
                  trigger={
                    <Button disabled={!canProceed()}>
                      <Save className="mr-2 h-4 w-4" />
                      {isEdit ? 'Update Report' : 'Save Report'}
                    </Button>
                  }
                />
              ) : (
                <Button onClick={goNext} disabled={!canProceed()}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="hidden lg:block">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Report Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground">Data Source:</span>
                <span className="ml-2 font-medium capitalize">
                  {config.object_type.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Report Type:</span>
                <span className="ml-2 font-medium capitalize">
                  {config.report_type}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Fields:</span>
                <span className="ml-2 font-medium">
                  {config.columns.filter(c => c.visible).length} selected
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Filters:</span>
                <span className="ml-2 font-medium">
                  {config.filters.length} active
                </span>
              </div>
              {config.groupings.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Grouped by:</span>
                  <span className="ml-2 font-medium">
                    {config.groupings.join(', ')}
                  </span>
                </div>
              )}
              {config.aggregations.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Calculations:</span>
                  <span className="ml-2 font-medium">
                    {config.aggregations.map(a => a.label).join(', ')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Section (bottom panel when toggled) */}
      {showPreview && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Report Preview</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPreview(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ReportPreview
              objectType={config.object_type}
              reportType={config.report_type}
              columns={config.columns}
              filters={config.filters}
              groupings={config.groupings}
              aggregations={config.aggregations}
              chartConfig={config.chart_config}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

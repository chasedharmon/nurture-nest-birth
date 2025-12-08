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
  HelpCircle,
  Info,
  Sparkles,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
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
  {
    id: 'object',
    label: 'Data Source',
    shortLabel: 'Source',
    icon: Database,
    description: 'Choose what type of records to include in your report',
    tip: 'Start by selecting the main data type. For example, select "Leads" to analyze your sales pipeline or "Invoices" for financial reports.',
  },
  {
    id: 'columns',
    label: 'Fields',
    shortLabel: 'Fields',
    icon: Columns3,
    description: 'Select and arrange the fields to display',
    tip: 'Check the fields you want to see as columns. Drag to reorder them. The preview on the right updates as you make changes.',
  },
  {
    id: 'filters',
    label: 'Filters',
    shortLabel: 'Filter',
    icon: Filter,
    description: 'Narrow down the data with conditions',
    tip: 'Add conditions to filter your data. For example, filter leads by status or invoices by date range. Filters are optional.',
  },
  {
    id: 'grouping',
    label: 'Grouping',
    shortLabel: 'Group',
    icon: Layers,
    description: 'Group records by a field for summaries',
    tip: 'Grouping organizes your data into categories. For example, group leads by source to see how many came from each channel.',
  },
  {
    id: 'aggregations',
    label: 'Calculations',
    shortLabel: 'Calc',
    icon: Calculator,
    description: 'Add totals, counts, and averages',
    tip: 'Add calculations like sum, count, or average. These appear as summary metrics above your data.',
  },
  {
    id: 'chart',
    label: 'Visualization',
    shortLabel: 'Chart',
    icon: BarChart3,
    description: 'Choose how to visualize your data',
    tip: 'Select a chart type to visualize your data. Bar charts work great for comparisons, line charts for trends over time.',
  },
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

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)
  const currentStepData = STEPS[currentStepIndex]

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

  const getStepStatus = (
    stepId: StepId
  ): 'complete' | 'current' | 'upcoming' => {
    const stepIndex = STEPS.findIndex(s => s.id === stepId)
    if (stepIndex < currentStepIndex) return 'complete'
    if (stepIndex === currentStepIndex) return 'current'
    return 'upcoming'
  }

  const visibleFieldCount = config.columns.filter(c => c.visible).length

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Compact Step Progress */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex">
              {STEPS.map((step, index) => {
                const Icon = step.icon
                const status = getStepStatus(step.id)

                return (
                  <Tooltip key={step.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => goToStep(step.id)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-3 px-2 border-b-2 transition-all relative',
                          status === 'current' &&
                            'bg-primary/5 border-primary text-primary',
                          status === 'complete' &&
                            'bg-green-50 border-green-500 text-green-700 dark:bg-green-950/20 dark:text-green-400',
                          status === 'upcoming' &&
                            'border-transparent text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                            status === 'current' &&
                              'bg-primary text-primary-foreground',
                            status === 'complete' &&
                              'bg-green-500 text-white dark:bg-green-600',
                            status === 'upcoming' &&
                              'bg-muted text-muted-foreground'
                          )}
                        >
                          {status === 'complete' ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Icon className="h-3 w-3" />
                          )}
                        </div>
                        <span className="hidden sm:inline text-xs font-medium">
                          {step.shortLabel}
                        </span>
                        {index < STEPS.length - 1 && (
                          <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="font-medium">{step.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area - Side by Side */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Left: Configuration Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {currentStepData && (
                        <>
                          <currentStepData.icon className="h-5 w-5 text-primary" />
                          {currentStepData.label}
                        </>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {currentStepData?.description}
                    </CardDescription>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{currentStepData?.tip}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
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
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={goPrev}
                  disabled={currentStepIndex === 0}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              </div>
              <div className="flex gap-2">
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
                    Next Step
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="h-4 w-4 text-primary" />
                    Live Preview
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Auto-updates
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  See your report build in real-time as you configure options
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Quick Summary */}
                <div className="mb-4 p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Data Source</span>
                    <Badge variant="secondary" className="capitalize">
                      {config.object_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Report Type</span>
                    <Badge variant="outline" className="capitalize">
                      {config.report_type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Fields Selected
                    </span>
                    <span className="font-medium">{visibleFieldCount}</span>
                  </div>
                  {config.filters.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Active Filters
                      </span>
                      <span className="font-medium">
                        {config.filters.length}
                      </span>
                    </div>
                  )}
                  {config.groupings.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Grouped By</span>
                      <span className="font-medium text-xs truncate max-w-[150px]">
                        {config.groupings.join(', ')}
                      </span>
                    </div>
                  )}
                  {config.aggregations.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Calculations
                      </span>
                      <span className="font-medium">
                        {config.aggregations.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Preview Component */}
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
          </div>
        </div>

        {/* Help Tips Section */}
        <Card className="bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="py-3">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {currentStepData?.label} - Quick Tip
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {currentStepData?.tip}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

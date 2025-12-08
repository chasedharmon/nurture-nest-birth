'use client'

import {
  Users,
  FileText,
  Calendar,
  DollarSign,
  Briefcase,
  UserCheck,
  HelpCircle,
  Table2,
  Layers,
  BarChart3,
} from 'lucide-react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { ObjectType, ReportType } from '@/lib/supabase/types'

interface ReportObjectSelectorProps {
  value: ObjectType
  reportType: ReportType
  onChange: (objectType: ObjectType, reportType: ReportType) => void
}

const OBJECT_OPTIONS: {
  value: ObjectType
  label: string
  description: string
  example: string
  icon: React.ElementType
}[] = [
  {
    value: 'leads',
    label: 'Leads',
    description: 'All leads and prospects in your pipeline',
    example: 'e.g., "Show me all leads from this month"',
    icon: Users,
  },
  {
    value: 'clients',
    label: 'Clients',
    description: 'Active clients (leads with client status)',
    example: 'e.g., "List all clients with upcoming due dates"',
    icon: UserCheck,
  },
  {
    value: 'invoices',
    label: 'Invoices',
    description: 'All invoices and billing records',
    example: 'e.g., "Show unpaid invoices over 30 days"',
    icon: FileText,
  },
  {
    value: 'meetings',
    label: 'Meetings',
    description: 'Scheduled and past appointments',
    example: 'e.g., "View all consultations this week"',
    icon: Calendar,
  },
  {
    value: 'payments',
    label: 'Payments',
    description: 'Payment transactions and history',
    example: 'e.g., "Total revenue by payment method"',
    icon: DollarSign,
  },
  {
    value: 'services',
    label: 'Services',
    description: 'Client services and packages',
    example: 'e.g., "Most popular service packages"',
    icon: Briefcase,
  },
]

const REPORT_TYPE_OPTIONS: {
  value: ReportType
  label: string
  description: string
  detail: string
  icon: React.ElementType
}[] = [
  {
    value: 'tabular',
    label: 'Tabular',
    description: 'Simple table with rows and columns',
    detail:
      'Best for: Detailed lists, exporting data, scanning individual records',
    icon: Table2,
  },
  {
    value: 'summary',
    label: 'Summary',
    description: 'Grouped data with subtotals',
    detail: 'Best for: Comparing groups, showing totals by category',
    icon: Layers,
  },
  {
    value: 'chart',
    label: 'Chart',
    description: 'Visual chart representation',
    detail: 'Best for: Trends, distributions, quick visual insights',
    icon: BarChart3,
  },
]

export function ReportObjectSelector({
  value,
  reportType,
  onChange,
}: ReportObjectSelectorProps) {
  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Object Type Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Select Data Source</h3>
              <p className="text-sm text-muted-foreground">
                Choose which type of data you want to report on
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded-full hover:bg-muted">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">
                  The data source determines what kind of records your report
                  will include. Each source has different fields available.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OBJECT_OPTIONS.map(option => {
              const Icon = option.icon
              const isSelected = value === option.value

              return (
                <Tooltip key={option.value}>
                  <TooltipTrigger asChild>
                    <Card
                      className={cn(
                        'cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm',
                        isSelected &&
                          'border-primary ring-2 ring-primary/20 shadow-sm'
                      )}
                      onClick={() => onChange(option.value, reportType)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {option.label}
                            </CardTitle>
                            <CardDescription className="text-xs line-clamp-1">
                              {option.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground mb-1">
                      {option.description}
                    </p>
                    <p className="text-xs text-primary italic">
                      {option.example}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Report Type</h3>
              <p className="text-sm text-muted-foreground">
                Choose how you want to display the data
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded-full hover:bg-muted">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">
                  Report type determines how your data is presented. You can
                  change this later, but it affects which options are available.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <RadioGroup
            value={reportType}
            onValueChange={(val: ReportType) => onChange(value, val)}
            className="grid gap-3 sm:grid-cols-3"
          >
            {REPORT_TYPE_OPTIONS.map(option => {
              const Icon = option.icon
              return (
                <Tooltip key={option.value}>
                  <TooltipTrigger asChild>
                    <div>
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={option.value}
                        className={cn(
                          'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all'
                        )}
                      >
                        <Icon className="h-5 w-5 mb-2 text-muted-foreground" />
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">
                          {option.description}
                        </span>
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground mb-1">
                      {option.description}
                    </p>
                    <p className="text-xs text-primary">{option.detail}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </RadioGroup>
        </div>
      </div>
    </TooltipProvider>
  )
}

'use client'

import {
  Users,
  FileText,
  Calendar,
  DollarSign,
  Briefcase,
  UserCheck,
} from 'lucide-react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
  icon: React.ElementType
}[] = [
  {
    value: 'leads',
    label: 'Leads',
    description: 'All leads and prospects in your pipeline',
    icon: Users,
  },
  {
    value: 'clients',
    label: 'Clients',
    description: 'Active clients (leads with client status)',
    icon: UserCheck,
  },
  {
    value: 'invoices',
    label: 'Invoices',
    description: 'All invoices and billing records',
    icon: FileText,
  },
  {
    value: 'meetings',
    label: 'Meetings',
    description: 'Scheduled and past appointments',
    icon: Calendar,
  },
  {
    value: 'payments',
    label: 'Payments',
    description: 'Payment transactions and history',
    icon: DollarSign,
  },
  {
    value: 'services',
    label: 'Services',
    description: 'Client services and packages',
    icon: Briefcase,
  },
]

const REPORT_TYPE_OPTIONS: {
  value: ReportType
  label: string
  description: string
}[] = [
  {
    value: 'tabular',
    label: 'Tabular',
    description: 'Simple table with rows and columns',
  },
  {
    value: 'summary',
    label: 'Summary',
    description: 'Grouped data with subtotals',
  },
  {
    value: 'chart',
    label: 'Chart',
    description: 'Visual chart representation',
  },
]

export function ReportObjectSelector({
  value,
  reportType,
  onChange,
}: ReportObjectSelectorProps) {
  return (
    <div className="space-y-8">
      {/* Object Type Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Select Data Source</h3>
          <p className="text-sm text-muted-foreground">
            Choose which type of data you want to report on
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OBJECT_OPTIONS.map(option => {
            const Icon = option.icon
            const isSelected = value === option.value

            return (
              <Card
                key={option.value}
                className={cn(
                  'cursor-pointer transition-all hover:border-primary/50',
                  isSelected && 'border-primary ring-2 ring-primary/20'
                )}
                onClick={() => onChange(option.value, reportType)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
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
                      <CardDescription className="text-xs">
                        {option.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Report Type</h3>
          <p className="text-sm text-muted-foreground">
            Choose how you want to display the data
          </p>
        </div>

        <RadioGroup
          value={reportType}
          onValueChange={(val: ReportType) => onChange(value, val)}
          className="grid gap-4 sm:grid-cols-3"
        >
          {REPORT_TYPE_OPTIONS.map(option => (
            <div key={option.value}>
              <RadioGroupItem
                value={option.value}
                id={option.value}
                className="peer sr-only"
              />
              <Label
                htmlFor={option.value}
                className={cn(
                  'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer'
                )}
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  {option.description}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  )
}

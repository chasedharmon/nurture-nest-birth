'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { RefreshCw } from 'lucide-react'
import type { ReentryMode } from '@/lib/workflows/types'
import { REENTRY_MODE_OPTIONS } from '@/lib/workflows/types'

interface ReentryRulesProps {
  mode: ReentryMode
  waitDays: number | null
  onModeChange: (mode: ReentryMode) => void
  onWaitDaysChange: (days: number | null) => void
}

export function ReentryRules({
  mode,
  waitDays,
  onModeChange,
  onWaitDaysChange,
}: ReentryRulesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Re-entry Rules</Label>
      </div>

      <p className="text-xs text-muted-foreground">
        Control whether a record can enter this workflow multiple times.
      </p>

      <RadioGroup
        value={mode}
        onValueChange={(value: ReentryMode) => onModeChange(value)}
        className="space-y-3"
      >
        {REENTRY_MODE_OPTIONS.map(option => (
          <div key={option.value} className="flex items-start space-x-3">
            <RadioGroupItem
              value={option.value}
              id={option.value}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label
                htmlFor={option.value}
                className="text-sm font-medium cursor-pointer"
              >
                {option.label}
              </Label>
              <p className="text-xs text-muted-foreground">
                {option.description}
              </p>
              {option.value === 'reentry_after_days' &&
                mode === 'reentry_after_days' && (
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      min={1}
                      value={waitDays || ''}
                      onChange={e => {
                        const val = e.target.value
                        onWaitDaysChange(val ? parseInt(val, 10) : null)
                      }}
                      placeholder="Days"
                      className="w-24 h-8"
                    />
                    <span className="text-sm text-muted-foreground">
                      days between entries
                    </span>
                  </div>
                )}
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

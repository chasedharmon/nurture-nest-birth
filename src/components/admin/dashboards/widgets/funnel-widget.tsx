'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FunnelStage {
  name: string
  count: number
  color?: string
}

interface FunnelWidgetProps {
  title: string
  stages: FunnelStage[]
  className?: string
}

// Brand-aligned background colors
const FALLBACK_BG_COLORS = [
  'bg-[#7C9070]',
  'bg-[#A3B899]',
  'bg-[#8B7355]',
  'bg-[#C4B7A6]',
  'bg-[#D4C4B0]',
]

export function FunnelWidget({ title, stages, className }: FunnelWidgetProps) {
  const maxCount = Math.max(...stages.map(s => s.count), 1)

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const widthPercent = (stage.count / maxCount) * 100
            const bgColor =
              stage.color ||
              FALLBACK_BG_COLORS[index % FALLBACK_BG_COLORS.length]

            return (
              <div key={stage.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.name}</span>
                  <span className="text-muted-foreground">{stage.count}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      bgColor
                    )}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Conversion rates */}
        {stages.length > 1 && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">Conversion Rates</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {stages.slice(0, -1).map((stage, index) => {
                const nextStage = stages[index + 1]
                if (!nextStage) return null
                const rate =
                  stage.count > 0
                    ? ((nextStage.count / stage.count) * 100).toFixed(1)
                    : '0'
                return (
                  <span key={stage.name} className="text-xs">
                    {stage.name} → {nextStage.name}:{' '}
                    <span className="font-medium">{rate}%</span>
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

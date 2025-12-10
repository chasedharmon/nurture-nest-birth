'use client'

import { cn } from '@/lib/utils'

interface NPSScaleProps {
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
  showLabels?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/**
 * NPS (Net Promoter Score) scale component
 * Allows selection of a score from 0-10
 *
 * 0-6 = Detractor (red)
 * 7-8 = Passive (yellow)
 * 9-10 = Promoter (green)
 */
export function NPSScale({
  value,
  onChange,
  disabled = false,
  showLabels = true,
  size = 'md',
}: NPSScaleProps) {
  const getScoreColor = (score: number, isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-muted hover:bg-muted-foreground/20'
    }

    if (score >= 9) return 'bg-green-500 text-white'
    if (score >= 7) return 'bg-yellow-500 text-white'
    return 'bg-red-500 text-white'
  }

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }

  return (
    <div className="space-y-3">
      {/* Scale buttons */}
      <div className="flex gap-1 sm:gap-2">
        {Array.from({ length: 11 }, (_, i) => i).map(score => {
          const isSelected = value === score
          return (
            <button
              key={score}
              type="button"
              disabled={disabled}
              onClick={() => onChange(score)}
              className={cn(
                'rounded-md font-medium transition-all',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                sizeClasses[size],
                getScoreColor(score, isSelected),
                isSelected && 'ring-2 ring-primary ring-offset-2 scale-110'
              )}
              aria-label={`Score ${score}`}
              aria-pressed={isSelected}
            >
              {score}
            </button>
          )
        })}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Not likely at all</span>
          <span>Extremely likely</span>
        </div>
      )}

      {/* Sentiment indicator */}
      {value !== null && (
        <div
          className={cn('text-center text-sm font-medium', {
            'text-red-600': value <= 6,
            'text-yellow-600': value >= 7 && value <= 8,
            'text-green-600': value >= 9,
          })}
        >
          {value <= 6 && 'Detractor'}
          {value >= 7 && value <= 8 && 'Passive'}
          {value >= 9 && 'Promoter'}
        </div>
      )}
    </div>
  )
}

/**
 * Display-only NPS score badge
 */
export function NPSBadge({
  score,
  size = 'md',
}: {
  score: number | null
  size?: 'sm' | 'md' | 'lg'
}) {
  if (score === null) {
    return <span className="text-muted-foreground text-sm">No score</span>
  }

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  }

  const colorClasses =
    score >= 9
      ? 'bg-green-500 text-white'
      : score >= 7
        ? 'bg-yellow-500 text-white'
        : 'bg-red-500 text-white'

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        sizeClasses[size],
        colorClasses
      )}
    >
      {score}
    </span>
  )
}

/**
 * NPS score summary display with breakdown
 */
export function NPSSummary({
  nps,
  promoters,
  passives,
  detractors,
  totalResponses,
}: {
  nps: number | null
  promoters: number
  passives: number
  detractors: number
  totalResponses: number
}) {
  return (
    <div className="space-y-4">
      {/* Main NPS score */}
      <div className="text-center">
        <div
          className={cn('text-5xl font-bold', {
            'text-green-600': nps !== null && nps >= 50,
            'text-yellow-600': nps !== null && nps >= 0 && nps < 50,
            'text-red-600': nps !== null && nps < 0,
            'text-muted-foreground': nps === null,
          })}
        >
          {nps !== null ? nps : '—'}
        </div>
        <div className="text-sm text-muted-foreground">Net Promoter Score</div>
      </div>

      {/* Breakdown */}
      {totalResponses > 0 && (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-semibold text-green-600">
              {Math.round((promoters / totalResponses) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Promoters ({promoters})
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-yellow-600">
              {Math.round((passives / totalResponses) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Passives ({passives})
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-red-600">
              {Math.round((detractors / totalResponses) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Detractors ({detractors})
            </div>
          </div>
        </div>
      )}

      {/* Response count */}
      <div className="text-center text-sm text-muted-foreground">
        Based on {totalResponses} response{totalResponses !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

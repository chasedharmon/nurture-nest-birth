/**
 * Reading Time Badge
 *
 * Displays estimated reading time for blog posts
 */

interface ReadingTimeBadgeProps {
  minutes: number
  className?: string
}

export function ReadingTimeBadge({
  minutes,
  className = '',
}: ReadingTimeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm text-muted-foreground ${className}`}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{minutes} min read</span>
    </span>
  )
}

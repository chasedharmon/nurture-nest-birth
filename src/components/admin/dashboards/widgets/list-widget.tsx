'use client'

import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ListItem {
  id: string
  title: string
  subtitle?: string
  date?: string
  status?: string
  badge?: string
  href?: string
}

interface ListWidgetProps {
  title: string
  items: ListItem[]
  emptyMessage?: string
  viewAllHref?: string
  viewAllLabel?: string
  dateFormat?: 'relative' | 'short' | 'full'
  className?: string
}

export function ListWidget({
  title,
  items,
  emptyMessage = 'No items to display',
  viewAllHref,
  viewAllLabel = 'View All',
  dateFormat = 'relative',
  className,
}: ListWidgetProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    switch (dateFormat) {
      case 'relative':
        return formatDistanceToNow(date, { addSuffix: true })
      case 'short':
        return format(date, 'MMM d')
      case 'full':
        return format(date, 'MMM d, yyyy')
      default:
        return dateStr
    }
  }

  const getStatusBadgeVariant = (
    status: string
  ): 'default' | 'secondary' | 'error' | 'outline' => {
    const positiveStatuses = ['client', 'active', 'paid', 'completed']
    const negativeStatuses = ['lost', 'cancelled', 'overdue', 'failed']

    if (positiveStatuses.includes(status.toLowerCase())) return 'default'
    if (negativeStatuses.includes(status.toLowerCase())) return 'error'
    return 'secondary'
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {viewAllHref && (
          <Link href={viewAllHref}>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              {viewAllLabel}
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map(item => (
              <li key={item.id}>
                <Link
                  href={item.href || '#'}
                  className="flex items-start justify-between gap-2 rounded-md p-2 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    {item.subtitle && (
                      <p className="truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {item.status && (
                      <Badge variant={getStatusBadgeVariant(item.status)}>
                        {item.status}
                      </Badge>
                    )}
                    {item.badge && !item.status && (
                      <Badge variant="outline">{item.badge}</Badge>
                    )}
                    {item.date && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.date)}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

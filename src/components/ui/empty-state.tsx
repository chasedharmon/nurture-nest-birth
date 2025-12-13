import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Card, CardContent } from './card'

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  icon?: React.ReactNode
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  actions?: EmptyStateAction[]
  className?: string
  variant?: 'default' | 'card' | 'inline'
  size?: 'sm' | 'default' | 'lg'
}

export function EmptyState({
  icon,
  title,
  description,
  actions = [],
  className,
  variant = 'default',
  size = 'default',
}: EmptyStateProps) {
  const iconSize = {
    sm: 'h-6 w-6',
    default: 'h-8 w-8',
    lg: 'h-10 w-10',
  }

  const iconContainerSize = {
    sm: 'p-2',
    default: 'p-4',
    lg: 'p-5',
  }

  const textSize = {
    sm: { title: 'text-base', description: 'text-sm' },
    default: { title: 'text-lg', description: 'text-sm' },
    lg: { title: 'text-xl', description: 'text-base' },
  }

  const paddingSize = {
    sm: 'py-8',
    default: 'py-16',
    lg: 'py-24',
  }

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        paddingSize[size],
        className
      )}
    >
      <div
        className={cn('rounded-full bg-muted mb-4', iconContainerSize[size])}
      >
        {React.isValidElement(icon)
          ? React.cloneElement(
              icon as React.ReactElement<{ className?: string }>,
              {
                className: cn(iconSize[size], 'text-muted-foreground'),
              }
            )
          : icon}
      </div>
      <h3 className={cn('font-semibold', textSize[size].title)}>{title}</h3>
      <p
        className={cn(
          'text-muted-foreground mt-1 max-w-md',
          textSize[size].description
        )}
      >
        {description}
      </p>
      {actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {actions.map((action, index) => {
            const buttonContent = (
              <>
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </>
            )

            if (action.href) {
              return (
                <Link key={index} href={action.href}>
                  <Button
                    variant={
                      action.variant || (index === 0 ? 'default' : 'outline')
                    }
                  >
                    {buttonContent}
                  </Button>
                </Link>
              )
            }

            return (
              <Button
                key={index}
                variant={
                  action.variant || (index === 0 ? 'default' : 'outline')
                }
                onClick={action.onClick}
              >
                {buttonContent}
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )

  if (variant === 'card') {
    return (
      <Card>
        <CardContent className="p-0">{content}</CardContent>
      </Card>
    )
  }

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed border-border bg-muted/30',
          className
        )}
      >
        {content}
      </div>
    )
  }

  return content
}

// Pre-configured empty states for common scenarios
export const emptyStateConfigs = {
  leads: {
    icon: null, // Will be provided by the consumer
    title: 'No leads yet',
    description:
      'Start building your client pipeline. Add your first lead manually or share your contact form to start capturing inquiries.',
  },
  workflows: {
    icon: null,
    title: 'No workflows yet',
    description:
      'Automate your follow-ups and communications. Create a workflow to save time and never miss a touchpoint.',
  },
  reports: {
    icon: null,
    title: 'No reports yet',
    description:
      'Build custom reports to gain insights into your business. Track leads, revenue, and more.',
  },
  messages: {
    icon: null,
    title: 'No messages yet',
    description:
      'Start a conversation with a client. Messages are delivered instantly and stay organized in one place.',
  },
  invoices: {
    icon: null,
    title: 'No invoices yet',
    description:
      'Create your first invoice to start tracking payments. Clients can pay online directly from the invoice.',
  },
  services: {
    icon: null,
    title: 'No services configured',
    description:
      'Add your service packages to quickly create contracts and track what you offer to clients.',
  },
  team: {
    icon: null,
    title: 'Just you for now',
    description:
      "Invite team members to collaborate on client care. They'll get their own login and can be assigned to clients.",
  },
  documents: {
    icon: null,
    title: 'No documents yet',
    description:
      'Upload contracts, resources, and files to share with your clients securely.',
  },
  meetings: {
    icon: null,
    title: 'No meetings scheduled',
    description:
      'Schedule consultations and appointments with your clients. Meetings will appear here.',
  },
  contracts: {
    icon: null,
    title: 'No contracts yet',
    description:
      'Create contracts for your clients. They can review and sign documents electronically.',
  },
  search: {
    icon: null,
    title: 'No results found',
    description:
      'Try adjusting your search or filters to find what you are looking for.',
  },
  error: {
    icon: null,
    title: 'Something went wrong',
    description:
      'We encountered an error loading this data. Please try refreshing the page.',
  },
}

export type EmptyStateType = keyof typeof emptyStateConfigs

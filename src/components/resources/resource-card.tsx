'use client'

import { trackEvent, EVENTS } from '@/lib/analytics'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * Resource Card Component
 *
 * Displays downloadable resources with tracking analytics.
 * Ready for PDF guides, checklists, and other client resources.
 */

export interface Resource {
  title: string
  description: string
  category: string
  fileUrl: string
  fileType: string
  fileSize?: string
  icon?: React.ReactNode
}

interface ResourceCardProps {
  resource: Resource
  className?: string
}

export function ResourceCard({ resource, className = '' }: ResourceCardProps) {
  const handleDownload = () => {
    trackEvent(EVENTS.RESOURCE_DOWNLOAD, {
      resource_title: resource.title,
      resource_category: resource.category,
      file_type: resource.fileType,
    })
  }

  return (
    <Card
      className={`flex h-full flex-col transition-shadow hover:shadow-md ${className}`}
    >
      <CardHeader>
        <div className="flex items-start gap-4">
          {resource.icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {resource.icon}
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="font-serif text-xl">
              {resource.title}
            </CardTitle>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                {resource.category}
              </span>
              <span className="uppercase">{resource.fileType}</span>
              {resource.fileSize && <span>{resource.fileSize}</span>}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <CardDescription className="text-base leading-relaxed">
          {resource.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button asChild className="w-full" onClick={handleDownload}>
          <a
            href={resource.fileUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Resource
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}

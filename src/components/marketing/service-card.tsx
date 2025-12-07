import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { card, icon as iconStyles, typography } from '@/lib/design-system'

interface ServiceCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
}

export function ServiceCard({
  title,
  description,
  icon,
  href,
}: ServiceCardProps) {
  return (
    <Card
      className={`group relative flex h-full flex-col overflow-hidden ${card.base} ${card.interactive}`}
    >
      <CardHeader>
        <div
          className={`mb-4 flex ${iconStyles.container.lg} items-center justify-center text-primary transition-transform group-hover:scale-110`}
        >
          {icon}
        </div>
        <h3 className={typography.h4}>{title}</h3>
      </CardHeader>
      <CardContent className="flex-1">
        <p className={typography.small}>{description}</p>
      </CardContent>
      <CardFooter>
        <Button
          asChild
          variant="ghost"
          className="group/link w-full font-medium hover:bg-primary/5"
        >
          <Link href={href}>
            Learn More
            <svg
              className="ml-2 h-4 w-4 transition-transform group-hover/link:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </Button>
      </CardFooter>
      {/* Subtle accent line on hover */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-0 transition-opacity group-hover:opacity-100" />
    </Card>
  )
}

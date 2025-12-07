import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

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
    <Card className="group relative flex h-full flex-col overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
      <CardHeader>
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/10 text-primary transition-transform group-hover:scale-110">
          {icon}
        </div>
        <h3 className="font-serif text-xl font-bold text-foreground">
          {title}
        </h3>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
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

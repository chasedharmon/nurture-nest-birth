import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Custom 404 Not Found Page
 *
 * This page is shown when a user navigates to a route that doesn't exist.
 * Provides helpful navigation options to get users back on track.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We could not find the page you are looking for. It may have been
            moved or deleted.
          </p>

          <div className="space-y-2">
            <p className="text-sm font-medium">Here are some helpful links:</p>
            <nav
              className="flex flex-col gap-2"
              aria-label="Navigation options"
            >
              <Button
                asChild
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <Link href="/">Home</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <Link href="/services">Services</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <Link href="/about">About</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <Link href="/blog">Blog</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <Link href="/contact">Contact</Link>
              </Button>
            </nav>
          </div>

          <div className="pt-4">
            <Button asChild size="sm" className="w-full">
              <Link href="/contact">Schedule a Consultation</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

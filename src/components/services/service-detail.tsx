import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/fade-in'

interface ServiceDetailProps {
  title: string
  description: string
  benefits: string[]
  included: string[]
  process?: string[]
  pricing?: {
    amount?: string
    details?: string
  }
}

/**
 * Service Detail Component
 *
 * Reusable component for individual service pages.
 * Displays comprehensive service information with benefits, what's included, and pricing.
 */
export function ServiceDetail({
  title,
  description,
  benefits,
  included,
  process,
  pricing,
}: ServiceDetailProps) {
  return (
    <article className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
      {/* Breadcrumb */}
      <FadeIn>
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/services" className="hover:text-foreground">
            Services
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{title}</span>
        </nav>
      </FadeIn>

      {/* Page Header */}
      <FadeIn delay={0.1}>
        <header className="mb-12">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
            {description}
          </p>
        </header>
      </FadeIn>

      {/* Main Content Grid */}
      <div className="space-y-12">
        {/* Benefits Section */}
        <FadeIn delay={0.2}>
          <section>
            <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">
              How This Supports You
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="flex items-start gap-3 p-4">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-foreground">{benefit}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* What's Included Section */}
        <FadeIn delay={0.3}>
          <section>
            <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">
              What&apos;s Included
            </h2>
            <Card>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {included.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        </FadeIn>

        {/* Process Section (Optional) */}
        {process && process.length > 0 && (
          <FadeIn delay={0.4}>
            <section>
              <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">
                How We Work Together
              </h2>
              <div className="space-y-4">
                {process.map((step, index) => (
                  <Card key={index}>
                    <CardContent className="flex gap-4 p-6">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {index + 1}
                      </div>
                      <p className="pt-2 text-foreground">{step}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </FadeIn>
        )}

        {/* Pricing Section (Optional) */}
        {pricing && (
          <FadeIn delay={0.5}>
            <section>
              <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">
                Investment
              </h2>
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-8 text-center">
                  {pricing.amount && (
                    <p className="mb-2 font-serif text-4xl font-bold text-foreground">
                      {pricing.amount}
                    </p>
                  )}
                  {pricing.details && (
                    <p className="text-muted-foreground">{pricing.details}</p>
                  )}
                  <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                    <p>💳 Payment plans available</p>
                    <p>🏥 HSA/FSA accepted</p>
                    <p>💰 Sliding scale for financial hardship</p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </FadeIn>
        )}

        {/* CTA Section */}
        <FadeIn delay={0.6}>
          <section className="rounded-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8 text-center">
            <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
              Ready to Get Started?
            </h2>
            <p className="mb-6 text-muted-foreground">
              Let&apos;s talk about how I can support you through this journey.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="/contact">Schedule Free Consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">View All Pricing</Link>
              </Button>
            </div>
          </section>
        </FadeIn>
      </div>
    </article>
  )
}

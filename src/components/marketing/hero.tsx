import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background px-6 py-20 md:py-32 lg:px-8">
      {/* Subtle organic background shape */}
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Content */}
          <div className="flex flex-col justify-center">
            {/* Small badge above title */}
            <div className="mb-6 inline-flex items-center gap-2 self-start rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              DONA Certified Doula
            </div>

            <h1 className="font-serif text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Compassionate Support for Your Birth Journey
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Evidence-based doula care in Kearney, Nebraska. From pregnancy
              through postpartum, I provide nurturing support tailored to your
              family&apos;s unique needs.
            </p>

            {/* Credentials - Modern badge style */}
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Lactation Consultant
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                3+ Years Experience
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Kearney, NE
              </div>
            </div>

            {/* CTA Buttons with enhanced styling */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="group relative overflow-hidden text-base shadow-lg shadow-accent/20 transition-all hover:shadow-xl hover:shadow-accent/30"
              >
                <Link href="/contact">
                  Schedule a Consultation
                  <svg
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
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
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 text-base transition-all hover:border-primary hover:bg-primary/5"
              >
                <Link href="/services">Explore Services</Link>
              </Button>
            </div>
          </div>

          {/* Right Column - Image Placeholder with film aesthetic */}
          <div className="relative lg:row-start-1">
            {/* Decorative element */}
            <div className="absolute -left-6 -top-6 h-full w-full rounded-3xl bg-primary/10" />

            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted shadow-2xl shadow-primary/10 lg:aspect-[3/4]">
              <Image
                src="/images/hero-warm.jpg"
                alt="Nurturing hands holding newborn baby - doula support"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Subtle overlay for warmth */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

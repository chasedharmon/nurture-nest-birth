/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/fade-in'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { spacing, maxWidth, typography, grid } from '@/lib/design-system'
import { JSONLDScript, getServiceSchema } from '@/lib/schema'
import { EVENTS } from '@/lib/analytics'
import {
  Car,
  Shield,
  CheckCircle,
  AlertTriangle,
  Baby,
  Clock,
  Award,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Car Seat Safety | Certified Child Passenger Safety Technician',
  description:
    'Certified Child Passenger Safety Technician (CPST) in Kearney, NE. Professional car seat installation checks, safety education, and hands-on guidance for new parents.',
  keywords:
    'car seat safety Kearney, CPST Nebraska, car seat installation check, child passenger safety, infant car seat help, car seat inspection',
}

export default function CarSeatSafetyPage() {
  const serviceSchema = getServiceSchema({
    name: 'Car Seat Safety Check',
    description:
      'Certified Child Passenger Safety Technician providing car seat installation checks, safety education, and hands-on guidance for new parents in Kearney, Nebraska.',
    priceRange: '$50-$75',
    slug: 'car-seat-safety',
  })

  return (
    <div className="bg-background">
      <JSONLDScript data={serviceSchema} />
      <PageViewTracker
        eventName={EVENTS.SERVICE_PAGE_VIEW}
        properties={{ service: 'car-seat-safety', title: 'Car Seat Safety' }}
      />

      {/* Hero Section */}
      <section className={`${spacing.container} ${spacing.section.lg}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <Car className="h-4 w-4" />
              Certified CPST
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className={typography.h1}>Car Seat Safety Check</h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className={`mt-6 ${typography.lead}`}>
              As a Certified Child Passenger Safety Technician (CPST), I help
              ensure your little one travels safely from day one. Most car seats
              are installed incorrectly—let's make sure yours isn't one of them.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Stat Section */}
      <section
        className={`bg-red-50 dark:bg-red-950/20 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-4xl font-bold text-red-600 dark:text-red-400">
                46%
              </p>
              <p className="text-lg text-red-700 dark:text-red-300 mt-2">
                of car seats are misused in ways that could reduce their
                effectiveness in a crash
              </p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-2">
                — National Highway Traffic Safety Administration (NHTSA)
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* What's Included */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={`text-center ${typography.h2}`}>
              What's Included in a Car Seat Check
            </h2>
          </FadeIn>
          <div className={`mt-12 grid ${grid.gap.medium} ${grid.cols.two}`}>
            {[
              {
                icon: <Shield className="h-6 w-6" />,
                title: 'Installation Inspection',
                desc: 'I check that your car seat is properly installed—correct angle, tight enough, using the right method (LATCH vs. seat belt) for your vehicle.',
              },
              {
                icon: <Baby className="h-6 w-6" />,
                title: 'Harness Adjustment',
                desc: 'We ensure the harness is at the correct height, properly threaded, and snug enough to keep your child secure.',
              },
              {
                icon: <CheckCircle className="h-6 w-6" />,
                title: 'Hands-On Education',
                desc: "You'll learn to install and adjust the seat yourself. I guide you through every step so you feel confident.",
              },
              {
                icon: <Award className="h-6 w-6" />,
                title: 'Recall & Expiration Check',
                desc: "I verify your seat hasn't been recalled and check its expiration date. Car seats do expire!",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <Card className="h-full border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {item.icon}
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-foreground">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Common Mistakes */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>Common Car Seat Mistakes</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-4 text-muted-foreground">
              Even careful parents make these mistakes. A professional check
              catches issues you might miss:
            </p>
          </FadeIn>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              'Seat installed at wrong angle (too upright or too reclined)',
              'Harness straps too loose or at wrong height',
              'Using LATCH and seat belt together (usually incorrect)',
              'Chest clip positioned at belly instead of armpit level',
              'Rear-facing seat turned forward too early',
              'Using an expired or recalled car seat',
              'Car seat not tight enough (moves more than 1 inch)',
              'Bulky clothing under harness straps',
            ].map((mistake, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900 dark:text-amber-200">
                    {mistake}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* When to Schedule */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={`text-center ${typography.h2}`}>
              When to Schedule a Check
            </h2>
          </FadeIn>
          <div className={`mt-12 grid ${grid.gap.medium} ${grid.cols.three}`}>
            {[
              {
                icon: <Clock className="h-8 w-8" />,
                title: 'Before Baby Arrives',
                desc: 'Ideally 2-4 weeks before your due date. Install it early, get it checked, and practice taking it in and out.',
              },
              {
                icon: <Baby className="h-8 w-8" />,
                title: 'After Purchasing a New Seat',
                desc: "Each seat is different. Even if you've done this before, a new seat means new installation considerations.",
              },
              {
                icon: <Car className="h-8 w-8" />,
                title: 'When Changing Vehicles',
                desc: 'Different vehicles have different seat configurations. What worked in one car may not work in another.',
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="mx-auto w-fit p-3 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 mb-4">
                      {item.icon}
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose a CPST */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>
              Why Choose a Certified Technician?
            </h2>
          </FadeIn>
          <div className="mt-8 space-y-6 text-muted-foreground">
            <p>
              A Child Passenger Safety Technician (CPST) certification requires:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Completion of an intensive 32-hour certification course</li>
              <li>Passing a rigorous certification exam</li>
              <li>Ongoing continuing education to stay current</li>
              <li>Hands-on training with multiple car seat models</li>
              <li>Knowledge of federal safety standards and best practices</li>
            </ul>
            <p>
              Unlike a quick video tutorial or instruction manual, working with
              a certified technician means you get personalized guidance for
              your specific car seat, vehicle, and child. We troubleshoot
              real-world issues and ensure you leave feeling confident.
            </p>
          </div>
        </div>
      </section>

      {/* Bundle Mention */}
      <section
        className={`bg-primary/5 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h2 className={typography.h2}>
                  Bundle with Your Doula Package
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Car seat safety checks are included in select birth doula
                  packages, or can be added to any service. It's one less thing
                  to worry about before baby arrives!
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg">
                    <Link href="/pricing">View Packages</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/services/birth-doula">
                      Birth Doula Services
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">
                    Standalone Check
                  </p>
                  <p className="text-4xl font-bold text-foreground mt-2">$50</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or included in packages
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <h2 className={typography.h2}>Ready to Ride Safe?</h2>
            <p className={`mt-4 ${typography.lead}`}>
              Schedule a car seat check before baby arrives. Peace of mind is
              priceless.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Schedule a Check</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/services">View All Services</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}

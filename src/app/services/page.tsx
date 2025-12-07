import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ServiceCard } from '@/components/marketing/service-card'
import { spacing, maxWidth, grid, typography, icon } from '@/lib/design-system'

export const metadata: Metadata = {
  title: 'Services | Nurture Nest Birth | Doula Care in Kearney, NE',
  description:
    'Comprehensive doula services in Kearney, Nebraska including birth support, postpartum care, lactation consulting, and sibling preparation classes.',
  keywords:
    'doula services Kearney NE, birth doula, postpartum doula, lactation consultant, sibling classes Nebraska',
}

const services = [
  {
    title: 'Birth Doula Support',
    description:
      'Continuous physical, emotional, and informational support throughout labor and birth. Includes prenatal visits, 24/7 on-call availability, and postpartum follow-up.',
    href: '/services/birth-doula',
    icon: (
      <svg
        className="h-7 w-7"
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
    ),
  },
  {
    title: 'Postpartum Care',
    description:
      'In-home support during the fourth trimester. Newborn care education, feeding assistance, emotional support, and light household help so you can rest and bond.',
    href: '/services/postpartum-care',
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    title: 'Lactation Consulting',
    description:
      'Expert breastfeeding support from a Certified Lactation Consultant. Help with latch issues, supply concerns, pumping, and feeding challenges.',
    href: '/services/lactation',
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Sibling Preparation',
    description:
      'Age-appropriate classes to help older children feel excited and prepared for their new sibling. Interactive, fun sessions tailored to your child.',
    href: '/services/sibling-prep',
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
]

export default function ServicesPage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section
        className={`relative overflow-hidden ${spacing.container} ${spacing.section.lg}`}
      >
        {/* Decorative background */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />

        <div className={`relative mx-auto ${maxWidth.content} text-center`}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Services
          </div>
          <h1 className={typography.h1}>
            Comprehensive Doula Care for Every Stage
          </h1>
          <p className={`mt-6 ${typography.lead}`}>
            From pregnancy through postpartum, I offer personalized support to
            help your family thrive.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.layout}`}>
          <div className={`grid ${grid.gap.medium} ${grid.cols.four}`}>
            {services.map(service => (
              <ServiceCard key={service.href} {...service} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Support */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <h2 className={`text-center ${typography.h2}`}>
            Why Invest in Doula Support?
          </h2>
          <div className={`mt-12 grid ${grid.gap.medium} ${grid.cols.two}`}>
            <div className="flex gap-4">
              <div
                className={`flex shrink-0 items-center justify-center ${icon.container.md}`}
              >
                <svg
                  className={`text-primary ${icon.size.md}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Better Birth Outcomes
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Research shows doula support leads to shorter labors, fewer
                  interventions, and increased satisfaction with the birth
                  experience.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div
                className={`flex shrink-0 items-center justify-center ${icon.container.md}`}
              >
                <svg
                  className={`text-primary ${icon.size.md}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Emotional Confidence
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Continuous support helps you feel more prepared, empowered,
                  and capable during birth and postpartum.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div
                className={`flex shrink-0 items-center justify-center ${icon.container.md}`}
              >
                <svg
                  className={`text-primary ${icon.size.md}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Partner Support
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  I help your partner feel confident and involved, providing
                  guidance so they can best support you.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div
                className={`flex shrink-0 items-center justify-center ${icon.container.md}`}
              >
                <svg
                  className={`text-primary ${icon.size.md}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Evidence-Based Care
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  I combine research-backed practices with personalized
                  attention to your unique needs and preferences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Info */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <h2 className={`text-center ${typography.h2}`}>
            Flexible Service Packages
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-muted-foreground">
            I offer both individual services and comprehensive packages. Many
            families combine birth doula support with postpartum care or
            lactation consulting for complete support throughout their journey.
          </p>
          <div className="mt-12 space-y-4 rounded-2xl border-2 border-primary/20 bg-primary/5 p-8">
            <h3 className="font-serif text-xl font-semibold text-foreground">
              Custom Packages Available
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                </span>
                <span>
                  Birth + Postpartum package for seamless transition from
                  pregnancy through the fourth trimester
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                </span>
                <span>
                  Postpartum + Lactation bundle for comprehensive feeding and
                  recovery support
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                </span>
                <span>
                  Sibling prep sessions can be added to any package to prepare
                  your whole family
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className={`bg-primary/5 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <h2 className={typography.h2}>Ready to Get Started?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Let&apos;s schedule a free consultation to discuss your needs and
            create a personalized support plan.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/contact">Schedule Consultation</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/faq">View FAQ</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/fade-in'
import { spacing, maxWidth, grid, typography, card } from '@/lib/design-system'

export const metadata: Metadata = {
  title: 'Pricing | Nurture Nest Birth | Doula Services in Kearney, NE',
  description:
    'Transparent pricing for birth doula and postpartum doula services in Kearney, Nebraska and Central Nebraska. Flexible packages available.',
  keywords:
    'doula pricing Kearney NE, birth doula cost, postpartum doula rates, infant feeding support Nebraska',
}

export default function PricingPage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className={`${spacing.container} ${spacing.section.lg}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Pricing
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className={typography.h1}>Investment in Your Birth Journey</h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className={`mt-6 ${typography.lead}`}>
              Transparent pricing with flexible payment options for families in
              Kearney and central Nebraska.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.layout}`}>
          <div className={`grid ${grid.gap.medium} lg:grid-cols-3`}>
            {/* Birth Doula */}
            <FadeIn delay={0}>
              <Card
                className={`relative flex h-full flex-col overflow-hidden ${card.base} ${card.interactive}`}
              >
                <CardHeader className="bg-gradient-to-br from-primary/5 to-secondary/5">
                  <CardTitle className="font-serif text-2xl">
                    Birth Doula Support
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive labor & delivery support
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col pt-6">
                  <div className="mb-6">
                    <span className="text-sm text-muted-foreground">
                      Starting at
                    </span>
                    <span className="block text-4xl font-bold text-foreground">
                      $1,500
                    </span>
                  </div>

                  <h4 className="mb-3 font-semibold text-foreground">
                    What's Included:
                  </h4>
                  <ul className="mb-6 flex-1 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      2 prenatal visits (2 hours each)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Birth plan consultation
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      24/7 on-call from 38 weeks
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Continuous labor support
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Immediate postpartum support
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      1 postpartum visit (within 2 weeks)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Phone/text support throughout
                    </li>
                  </ul>

                  <div className="mt-auto">
                    <Button asChild className="w-full">
                      <Link href="/contact">Get Started</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Postpartum Care */}
            <FadeIn delay={0.1}>
              <Card
                className={`relative flex h-full flex-col overflow-hidden ${card.base} border-primary/40 shadow-lg shadow-primary/20 ${card.interactive} hover:shadow-2xl hover:shadow-primary/30`}
              >
                <div className="absolute right-0 top-0 rounded-bl-2xl bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                  Most Popular
                </div>
                <CardHeader className="bg-gradient-to-br from-primary/10 to-secondary/10">
                  <CardTitle className="font-serif text-2xl">
                    Postpartum Doula Support
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    In-home fourth trimester support
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col pt-6">
                  <div className="mb-6">
                    <span className="text-sm text-muted-foreground">
                      Starting at
                    </span>
                    <span className="block text-4xl font-bold text-foreground">
                      $40
                      <span className="text-lg font-normal text-muted-foreground">
                        /hour
                      </span>
                    </span>
                  </div>

                  <h4 className="mb-3 font-semibold text-foreground">
                    Services Include:
                  </h4>
                  <ul className="mb-4 flex-1 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Newborn care education
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Feeding support (breast/bottle/combo)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Light household tasks (baby-focused)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Light meal preparation
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Sibling support
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Emotional support
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Recovery assistance
                    </li>
                  </ul>

                  <p className="mb-6 text-sm text-muted-foreground">
                    Packages available: 10, 20, or 40 hour blocks at discounted
                    rates
                  </p>

                  <div className="mt-auto">
                    <Button asChild className="w-full">
                      <Link href="/contact">Get Started</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Complete Care Bundle */}
            <FadeIn delay={0.2}>
              <Card
                className={`relative flex h-full flex-col overflow-hidden ${card.base} ${card.interactive}`}
              >
                <CardHeader className="bg-gradient-to-br from-primary/5 to-secondary/5">
                  <CardTitle className="font-serif text-2xl">
                    Complete Care Bundle
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Birth + postpartum support
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col pt-6">
                  <div className="mb-6">
                    <span className="text-sm text-muted-foreground">
                      Starting at
                    </span>
                    <span className="block text-4xl font-bold text-foreground">
                      $1,800
                    </span>
                  </div>

                  <h4 className="mb-3 font-semibold text-foreground">
                    Bundle Includes:
                  </h4>
                  <ul className="mb-4 flex-1 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Everything in Birth Doula Support
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Discounted postpartum hourly rate ($35/hr)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Seamless continuity of care
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Priority scheduling
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Infant feeding support included
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Car seat safety check included
                    </li>
                  </ul>

                  <p className="mb-6 text-sm text-muted-foreground">
                    Best value for comprehensive support
                  </p>

                  <div className="mt-auto">
                    <Button asChild className="w-full">
                      <Link href="/contact">Get Started</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Photography Services */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn direction="down">
            <h2 className={`text-center ${typography.h2}`}>
              Photography Services
            </h2>
            <p className="mt-4 text-center text-muted-foreground">
              Capture your birth story and early days with professional
              photography
            </p>
          </FadeIn>
          <div className={`mt-12 grid ${grid.gap.tight} ${grid.cols.three}`}>
            <FadeIn delay={0.1}>
              <div className="rounded-2xl border-2 border-border bg-background p-6">
                <h3 className="font-serif text-xl font-semibold text-foreground">
                  Birth Photography
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Starting at
                </p>
                <p className="text-2xl font-bold text-foreground">Contact</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Documentary-style coverage of labor, delivery, and golden
                  hour. On-call from 38 weeks.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="rounded-2xl border-2 border-border bg-background p-6">
                <h3 className="font-serif text-xl font-semibold text-foreground">
                  Fresh 48 Session
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Starting at
                </p>
                <p className="text-2xl font-bold text-foreground">Contact</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Lifestyle portraits within the first 48 hours. Hospital or
                  home setting, natural approach.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="rounded-2xl border-2 border-border bg-background p-6">
                <h3 className="font-serif text-xl font-semibold text-foreground">
                  Newborn & Family
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Starting at
                </p>
                <p className="text-2xl font-bold text-foreground">Contact</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  In-home lifestyle sessions 1-3 weeks after birth. Whole family
                  and pets welcome.
                </p>
              </div>
            </FadeIn>
          </div>
          <FadeIn delay={0.4}>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Photography can be added to any doula package or booked
              standalone. Contact me for custom pricing.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Included Services */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn direction="down">
            <h2 className={`text-center ${typography.h2}`}>
              Included with Doula Packages
            </h2>
            <p className="mt-4 text-center text-muted-foreground">
              These services are included at no extra cost when you book doula
              support
            </p>
          </FadeIn>
          <div className={`mt-12 grid ${grid.gap.tight} ${grid.cols.two}`}>
            <FadeIn delay={0.1}>
              <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6">
                <h3 className="font-serif text-xl font-semibold text-foreground">
                  Infant Feeding Support
                </h3>
                <p className="mt-2 text-lg font-semibold text-primary">
                  Included
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Breastfeeding, bottle feeding, and combination feeding
                  guidance. Complex issues referred to IBCLC.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6">
                <h3 className="font-serif text-xl font-semibold text-foreground">
                  Car Seat Safety Check
                </h3>
                <p className="mt-2 text-lg font-semibold text-primary">
                  Included
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  CPST-certified installation check and education. Also
                  available at community check days.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6">
                <h3 className="font-serif text-xl font-semibold text-foreground">
                  Sibling Preparation
                </h3>
                <p className="mt-2 text-lg font-semibold text-primary">
                  Included
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Guidance for helping older children adjust. Includes
                  age-appropriate activities and sibling bonding support.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6">
                <h3 className="font-serif text-xl font-semibold text-foreground">
                  Infant Massage Instruction
                </h3>
                <p className="mt-2 text-lg font-semibold text-primary">
                  Included
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  CIMI-certified instruction included with postpartum doula
                  packages. Learn techniques for bonding and soothing.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Discounts & Add-Ons */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={`text-center ${typography.h2}`}>
              Discounts & Add-Ons
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-12 space-y-4 rounded-2xl border-2 border-primary/20 bg-primary/5 p-8">
              <div>
                <h3 className="font-semibold text-foreground">
                  Complete Care Bundle Savings
                </h3>
                <p className="text-sm text-muted-foreground">
                  Save $200+ when bundling birth doula with postpartum support.
                  Plus discounted hourly rate ($35/hr) for additional postpartum
                  hours.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Photography Add-On
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add photography to any doula package for seamless support. As
                  your doula AND photographer, I already know your preferences
                  and have built trust.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Multiple Birth Discount
                </h3>
                <p className="text-sm text-muted-foreground">
                  10% discount for twins/multiples on all services
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Payment Info */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn direction="down">
            <h2 className={`text-center ${typography.h2}`}>
              Payment Information
            </h2>
          </FadeIn>
          <div className="mt-12 space-y-6 text-muted-foreground">
            <FadeIn delay={0.1}>
              <div>
                <h3 className="font-semibold text-foreground">Retainer</h3>
                <p className="mt-2">
                  A non-refundable retainer (typically 50%) is due at contract
                  signing to reserve your due date. Balance due by 36 weeks.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div>
                <h3 className="font-semibold text-foreground">
                  Insurance & Reimbursement
                </h3>
                <p className="mt-2">
                  Nebraska Medicaid covers doula services. Many private
                  insurance plans now reimburse for doula care—I provide
                  superbills for submission.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div>
                <h3 className="font-semibold text-foreground">
                  HSA/FSA Eligible
                </h3>
                <p className="mt-2">
                  All doula services typically qualify for HSA and FSA payment.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div>
                <h3 className="font-semibold text-foreground">
                  Postpartum Booking
                </h3>
                <p className="mt-2">
                  For postpartum services booked less than 2 weeks out, full
                  payment is due upfront. For services booked more than 2 weeks
                  out, a 50% retainer reserves your spot.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className={`bg-primary/5 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn direction="down">
            <h2 className={typography.h2}>Questions About Pricing?</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-4 text-lg text-muted-foreground">
              Let's schedule a free consultation to discuss your needs and
              create a custom package that fits your budget.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Schedule Free Consultation</Link>
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

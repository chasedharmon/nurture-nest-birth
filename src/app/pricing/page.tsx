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
    'Transparent pricing for birth doula, postpartum, and lactation services in Kearney, Nebraska. Flexible packages and payment plans available.',
  keywords:
    'doula pricing Kearney NE, birth doula cost, postpartum doula rates, lactation consultant fees Nebraska',
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
                    <span className="text-4xl font-bold text-foreground">
                      $1,200–$1,500
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
                    Postpartum Care
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    In-home fourth trimester support
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col pt-6">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">
                      $35–$45
                    </span>
                    <span className="text-muted-foreground">/hour</span>
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
                      Light household tasks
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Meal preparation
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

            {/* Lactation Consulting */}
            <FadeIn delay={0.2}>
              <Card
                className={`relative flex h-full flex-col overflow-hidden ${card.base} ${card.interactive}`}
              >
                <CardHeader className="bg-gradient-to-br from-primary/5 to-secondary/5">
                  <CardTitle className="font-serif text-2xl">
                    Lactation Consulting
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Expert breastfeeding support
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col pt-6">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">
                      $125–$175
                    </span>
                    <span className="text-muted-foreground">/visit</span>
                  </div>

                  <h4 className="mb-3 font-semibold text-foreground">
                    Consultation Includes:
                  </h4>
                  <ul className="mb-4 flex-1 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Comprehensive feeding assessment
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Latch evaluation
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Supply assessment
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Pumping strategies
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Personalized feeding plan
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Follow-up support via phone/text
                    </li>
                  </ul>

                  <p className="mb-6 text-sm text-muted-foreground">
                    60–90 minute in-home visit
                  </p>

                  <div className="mt-auto">
                    <Button asChild className="w-full">
                      <Link href="/contact">Book Consultation</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn direction="down">
            <h2 className={`text-center ${typography.h2}`}>
              Additional Services
            </h2>
          </FadeIn>
          <div className={`mt-12 grid ${grid.gap.tight} ${grid.cols.two}`}>
            <FadeIn delay={0.1}>
              <div className="rounded-2xl border-2 border-border bg-background p-6">
                <h3 className="font-serif text-xl font-semibold text-foreground">
                  Sibling Preparation
                </h3>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  $75–$100
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  60–90 minute session tailored to your child's age. Includes
                  activities, books, and hands-on practice.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="rounded-2xl border-2 border-border bg-background p-6">
                <h3 className="font-serif text-xl font-semibold text-foreground">
                  Overnight Postpartum Support
                </h3>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  $45–$50/hour
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  10-hour shifts (8pm–6am). I care for baby while you sleep,
                  bringing baby for feedings.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Package Bundles */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={`text-center ${typography.h2}`}>
              Package Bundles & Discounts
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-12 space-y-4 rounded-2xl border-2 border-primary/20 bg-primary/5 p-8">
              <div>
                <h3 className="font-semibold text-foreground">
                  Birth + Postpartum Package
                </h3>
                <p className="text-sm text-muted-foreground">
                  Save $200 when bundling birth doula services with 20+ hours of
                  postpartum care
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Postpartum + Lactation Package
                </h3>
                <p className="text-sm text-muted-foreground">
                  Save $100 when combining postpartum care with lactation
                  consulting
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
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn direction="down">
            <h2 className={`text-center ${typography.h2}`}>
              Payment Information
            </h2>
          </FadeIn>
          <div className="mt-12 space-y-6 text-muted-foreground">
            <FadeIn delay={0.1}>
              <div>
                <h3 className="font-semibold text-foreground">Payment Plans</h3>
                <p className="mt-2">
                  Flexible monthly payment plans available for all packages. No
                  interest, no fees.
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
                  Deposit & Cancellation
                </h3>
                <p className="mt-2">
                  $300 non-refundable deposit reserves your due date. Balance
                  due by 36 weeks. Full refund (minus deposit) if you move out
                  of service area.
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

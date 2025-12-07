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

export const metadata: Metadata = {
  title: 'Birth Doula Support | Comprehensive Labor & Delivery Care',
  description:
    'DONA-certified birth doula in Kearney, NE. Continuous labor support, prenatal planning, and postpartum follow-up. Supporting all birth settings and preferences.',
  keywords:
    'birth doula Kearney, labor support, doula services Nebraska, hospital birth support, home birth doula',
}

export default function BirthDoulaPage() {
  const serviceSchema = getServiceSchema({
    name: 'Birth Doula Support',
    description:
      'DONA-certified birth doula providing continuous labor support, prenatal planning, and postpartum follow-up. Supporting all birth settings and preferences in Kearney, Nebraska.',
    priceRange: '$800-$1500',
    slug: 'birth-doula',
  })

  return (
    <div className="bg-background">
      <JSONLDScript data={serviceSchema} />
      <PageViewTracker
        eventName={EVENTS.SERVICE_PAGE_VIEW}
        properties={{ service: 'birth-doula', title: 'Birth Doula Support' }}
      />
      {/* Hero Section */}
      <section className={`${spacing.container} ${spacing.section.lg}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Birth Doula Support
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className={typography.h1}>
              Continuous Support for Your Birth Journey
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className={`mt-6 ${typography.lead}`}>
              From active labor through the first hours with your baby, I'll be
              by your side with physical comfort, emotional encouragement, and
              evidence-based guidance.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* What's Included */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={`text-center ${typography.h2}`}>
              What&apos;s Included
            </h2>
          </FadeIn>
          <div className={`mt-12 grid ${grid.gap.medium} ${grid.cols.two}`}>
            {[
              {
                title: '2 Prenatal Visits',
                desc: "We'll get to know each other, discuss your birth preferences, practice comfort techniques, and create your birth plan.",
              },
              {
                title: '24/7 On-Call from 38 Weeks',
                desc: "Text or call anytime—whether it's early labor questions or 'is this it?' moments.",
              },
              {
                title: 'Continuous Labor Support',
                desc: 'I join you in active labor and stay through birth. Physical comfort measures, position changes, and emotional encouragement.',
              },
              {
                title: '1 Postpartum Visit',
                desc: "Within 1-2 weeks after birth, I'll process your birth story, answer questions, and check on your recovery.",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <Card className="h-full border-2">
                  <CardContent className="pt-6">
                    <h3 className="font-serif text-xl font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose a Doula */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <h2 className={typography.h2}>Why Choose a Birth Doula?</h2>
          <div className="mt-8 space-y-6 text-muted-foreground">
            <p>
              Research shows that continuous labor support from a doula leads
              to:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Shorter labors</li>
              <li>Decreased use of pain medication</li>
              <li>Lower cesarean rates</li>
              <li>Increased satisfaction with birth experience</li>
              <li>Better breastfeeding initiation</li>
            </ul>
            <p>
              As your doula, I don&apos;t replace your medical team or your
              partner. Instead, I complement their care by providing continuous
              emotional support, comfort measures, and evidence-based
              information to help you make informed decisions.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`bg-primary/5 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <h2 className={typography.h2}>Ready to Plan Your Birth Together?</h2>
          <p className={`mt-4 ${typography.lead}`}>
            Let&apos;s discuss how I can support your unique birth vision.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/contact">Schedule a Consultation</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/services">View All Services</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

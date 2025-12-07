import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Birth Doula Support | Nurture Nest Birth | Kearney, NE',
  description:
    'Professional birth doula services in Kearney, Nebraska. Continuous labor support, comfort measures, and advocacy for your birth preferences. DONA certified.',
  keywords:
    'birth doula Kearney NE, labor support, doula services Nebraska, DONA certified doula',
}

export default function BirthDoulaPage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Birth Doula Support
          </h1>
          <p className="mt-6 text-xl text-muted-foreground">
            Continuous, compassionate support during one of life&apos;s most
            transformative experiences.
          </p>
        </div>
      </section>

      {/* What's Included */}
      <section className="bg-card px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            What&apos;s Included
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Prenatal Visits
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Two prenatal meetings to discuss your birth preferences,
                  comfort measures, and answer questions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Continuous Labor Support
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  I&apos;ll be by your side from active labor through the first
                  hours postpartum.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Comfort Techniques
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Evidence-based pain relief methods including positioning,
                  breathing, and massage.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Partner Support
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  I support your partner too, offering guidance and breaks when
                  needed.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Postpartum Visit
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  One postpartum visit to process your birth experience and
                  support early recovery.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  24/7 Availability
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  On-call support from 38 weeks until your baby arrives.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose a Doula */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            Why Choose a Birth Doula?
          </h2>
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
      <section className="bg-primary/5 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            Ready to Plan Your Birth Together?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
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

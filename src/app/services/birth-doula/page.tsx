/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/fade-in'

export const metadata: Metadata = {
  title: 'Birth Doula Support | Comprehensive Labor & Delivery Care',
  description:
    'DONA-certified birth doula in Kearney, NE. Continuous labor support, prenatal planning, and postpartum follow-up. Supporting all birth settings and preferences.',
  keywords:
    'birth doula Kearney, labor support, doula services Nebraska, hospital birth support, home birth doula',
}

export default function BirthDoulaPage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Birth Doula Support
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Continuous Support for Your Birth Journey
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-6 text-xl text-muted-foreground">
              From active labor through the first hours with your baby, I'll be
              by your side with physical comfort, emotional encouragement, and
              evidence-based guidance.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* What's Included */}
      <section className="bg-card px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <h2 className="text-center font-serif text-3xl font-bold text-foreground">
              What&apos;s Included
            </h2>
          </FadeIn>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
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

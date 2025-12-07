/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/fade-in'

export const metadata: Metadata = {
  title: 'Lactation Consulting | Nurture Nest Birth | Kearney, NE',
  description:
    'Certified lactation consultant in Kearney, Nebraska. Expert breastfeeding support for latch issues, supply concerns, and feeding challenges.',
  keywords:
    'lactation consultant Kearney NE, breastfeeding support, IBCLC Nebraska, nursing help',
}

export default function LactationPage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Lactation Consulting
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Expert Breastfeeding Support
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-6 text-xl text-muted-foreground">
              Compassionate, evidence-based guidance to establish and maintain
              your breastfeeding journey.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Common Concerns */}
      <section className="bg-card px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn direction="down">
            <h2 className="text-center font-serif text-3xl font-bold text-foreground">
              I Can Help With
            </h2>
          </FadeIn>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {[
              {
                title: 'Latch Issues',
                desc: 'Pain during nursing, shallow latch, or difficulty getting baby to latch effectively.',
              },
              {
                title: 'Low Milk Supply',
                desc: 'Concerns about milk production and strategies to increase supply safely.',
              },
              {
                title: 'Oversupply Management',
                desc: 'Too much milk causing issues like engorgement, forceful letdown, or green stools.',
              },
              {
                title: 'Pumping & Storage',
                desc: 'Building a freezer stash, exclusive pumping, or returning to work strategies.',
              },
              {
                title: 'Tongue & Lip Ties',
                desc: 'Assessment and referrals for oral restrictions affecting feeding.',
              },
              {
                title: 'Weaning',
                desc: "Gentle weaning strategies when you're ready to transition.",
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

      {/* What to Expect */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <h2 className="font-serif text-3xl font-bold text-foreground">
              What to Expect
            </h2>
          </FadeIn>
          <div className="mt-8 space-y-6 text-muted-foreground">
            <FadeIn delay={0.1}>
              <p>
                During a lactation consultation, I'll take time to understand
                your unique situation and goals. Together we'll:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Review your medical and feeding history</li>
                <li>Observe a full feeding session</li>
                <li>Assess baby's latch, suck, and swallow</li>
                <li>Evaluate your milk supply and transfer</li>
                <li>Create a personalized feeding plan</li>
                <li>Address any immediate concerns or pain</li>
              </ul>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p>
                Most consultations last 60-90 minutes, giving us plenty of time
                to address your questions. I also provide follow-up support via
                phone, text, or additional visits as needed.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <p>
                Remember: every breastfeeding journey is unique. Whether your
                goal is exclusive breastfeeding, combination feeding, or
                something else, I support your informed choices without
                judgment.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn direction="down">
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Feeding Your Baby Shouldn't Hurt
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-4 text-lg text-muted-foreground">
              Let's work together to make breastfeeding comfortable and
              sustainable.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Schedule a Consultation</Link>
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

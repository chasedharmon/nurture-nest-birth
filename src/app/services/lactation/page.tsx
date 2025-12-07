import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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
        <div className="mx-auto max-w-4xl">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Lactation Consulting
          </h1>
          <p className="mt-6 text-xl text-muted-foreground">
            Expert, compassionate guidance to establish and maintain your
            breastfeeding journey.
          </p>
        </div>
      </section>

      {/* Common Concerns */}
      <section className="bg-card px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            I Can Help With
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">Latch Issues</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pain during nursing, shallow latch, or difficulty getting baby
                  to latch effectively.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Low Milk Supply
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Concerns about milk production and strategies to increase
                  supply safely.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Oversupply Management
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Too much milk causing issues like engorgement, forceful
                  letdown, or green stools.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Pumping & Storage
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Building a freezer stash, exclusive pumping, or returning to
                  work strategies.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Tongue & Lip Ties
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Assessment and referrals for oral restrictions affecting
                  feeding.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">Weaning</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Gentle weaning strategies when you&apos;re ready to
                  transition.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            What to Expect
          </h2>
          <div className="mt-8 space-y-6 text-muted-foreground">
            <p>
              During a lactation consultation, I&apos;ll take time to understand
              your unique situation and goals. Together we&apos;ll:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Review your medical and feeding history</li>
              <li>Observe a full feeding session</li>
              <li>Assess baby&apos;s latch, suck, and swallow</li>
              <li>Evaluate your milk supply and transfer</li>
              <li>Create a personalized feeding plan</li>
              <li>Address any immediate concerns or pain</li>
            </ul>
            <p>
              Most consultations last 60-90 minutes, giving us plenty of time to
              address your questions. I also provide follow-up support via
              phone, text, or additional visits as needed.
            </p>
            <p>
              Remember: every breastfeeding journey is unique. Whether your goal
              is exclusive breastfeeding, combination feeding, or something
              else, I support your informed choices without judgment.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            Feeding Your Baby Shouldn&apos;t Hurt
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Let&apos;s work together to make breastfeeding comfortable and
            sustainable.
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

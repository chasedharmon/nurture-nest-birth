import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Postpartum Doula Care | Nurture Nest Birth | Kearney, NE',
  description:
    'Postpartum doula services in Kearney, Nebraska. Expert support for newborn care, recovery, and adjusting to life with baby. Fourth trimester support.',
  keywords:
    'postpartum doula Kearney NE, newborn care, postpartum support Nebraska, fourth trimester',
}

export default function PostpartumCarePage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Postpartum Care
          </h1>
          <p className="mt-6 text-xl text-muted-foreground">
            Nurturing support during the fourth trimester as your family adjusts
            to life with your new baby.
          </p>
        </div>
      </section>

      {/* What's Included */}
      <section className="bg-card px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            How I Support You
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Newborn Care Education
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Learn bathing, diapering, swaddling, and understanding your
                  baby&apos;s cues.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Feeding Support
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Breastfeeding assistance, bottle feeding guidance, and
                  combination feeding strategies.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Emotional Support
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  A listening ear as you process your birth and adjust to
                  parenthood.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Light Household Help
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Meal prep, laundry, and tidying so you can focus on recovery
                  and bonding.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Sibling Support
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Help older children adjust and bond with their new sibling.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Flexible Scheduling
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Daytime, overnight, or weekend visits based on your
                  family&apos;s needs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The Fourth Trimester */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            The Fourth Trimester
          </h2>
          <div className="mt-8 space-y-6 text-muted-foreground">
            <p>
              The weeks and months after birth are a time of profound adjustment
              for the entire family. Your body is healing, your baby is learning
              to be earthside, and you&apos;re navigating new rhythms together.
            </p>
            <p>
              As your postpartum doula, I provide non-judgmental support while
              you find your unique parenting style. Whether this is your first
              baby or your fifth, every postpartum experience is different, and
              you deserve knowledgeable, compassionate care.
            </p>
            <p>I can help you:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Establish feeding routines that work for your family</li>
              <li>Understand newborn sleep patterns</li>
              <li>Recognize signs of postpartum mood changes</li>
              <li>Process your birth experience</li>
              <li>Care for yourself while caring for baby</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            You Don&apos;t Have to Do This Alone
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Let&apos;s create a postpartum plan that supports your whole family.
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

import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Sibling Preparation | Nurture Nest Birth | Kearney, NE',
  description:
    'Sibling preparation classes in Kearney, Nebraska. Help your older children feel excited and ready for their new baby brother or sister.',
  keywords:
    'sibling preparation Kearney NE, big brother class, big sister class Nebraska, sibling class',
}

export default function SiblingPrepPage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Sibling Preparation
          </h1>
          <p className="mt-6 text-xl text-muted-foreground">
            Help your children feel excited, prepared, and included as they
            welcome their new sibling.
          </p>
        </div>
      </section>

      {/* What We Cover */}
      <section className="bg-card px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            What We&apos;ll Explore Together
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">Baby Basics</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Age-appropriate information about how babies eat, sleep, and
                  communicate.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Big Sibling Role
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  How they can help and be an important part of baby&apos;s care
                  team.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Feelings & Changes
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Discussing mixed emotions about sharing parents and their
                  home.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Hands-On Practice
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Gentle handling, diapering dolls, and learning how to be
                  around newborns safely.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">Birth Story</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sharing their own birth story and what to expect when baby
                  arrives.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">
                  Special Activities
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Books, crafts, and games that make learning fun and engaging.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Session Details */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            Session Details
          </h2>
          <div className="mt-8 space-y-6 text-muted-foreground">
            <p>
              Sibling preparation sessions are tailored to your child&apos;s
              age, personality, and your family&apos;s unique situation. We can
              meet one-on-one or include multiple siblings together.
            </p>
            <p>
              <strong className="text-foreground">Ages 2-4:</strong> Focus on
              very basic concepts through play, stories, and hands-on activities
              with baby dolls.
            </p>
            <p>
              <strong className="text-foreground">Ages 5-8:</strong> More
              detailed information about pregnancy, birth, and newborn care,
              with opportunities for questions and discussion.
            </p>
            <p>
              <strong className="text-foreground">Ages 9+:</strong>{' '}
              Age-appropriate education that can include birth videos, detailed
              anatomy, and deeper conversations about the postpartum period.
            </p>
            <p>
              Sessions typically last 60-90 minutes and can take place in your
              home where children feel most comfortable. I bring age-appropriate
              books, dolls, and activities to make learning interactive and fun.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            Help Your Child Feel Included
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Let&apos;s prepare your whole family for this exciting transition.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/contact">Schedule a Session</Link>
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

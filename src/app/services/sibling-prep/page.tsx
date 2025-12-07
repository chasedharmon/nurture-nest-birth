/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/fade-in'

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
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Sibling Preparation
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Preparing Big Brothers & Sisters
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-6 text-xl text-muted-foreground">
              Help your children feel excited, prepared, and included as they
              welcome their new sibling.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* What We Cover */}
      <section className="bg-card px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn direction="down">
            <h2 className="text-center font-serif text-3xl font-bold text-foreground">
              What We'll Explore Together
            </h2>
          </FadeIn>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {[
              {
                title: 'Baby Basics',
                desc: 'Age-appropriate information about how babies eat, sleep, and communicate.',
              },
              {
                title: 'Big Sibling Role',
                desc: "How they can help and be an important part of baby's care team.",
              },
              {
                title: 'Feelings & Changes',
                desc: 'Discussing mixed emotions about sharing parents and their home.',
              },
              {
                title: 'Hands-On Practice',
                desc: 'Gentle handling, diapering dolls, and learning how to be around newborns safely.',
              },
              {
                title: 'Birth Story',
                desc: 'Sharing their own birth story and what to expect when baby arrives.',
              },
              {
                title: 'Special Activities',
                desc: 'Books, crafts, and games that make learning fun and engaging.',
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

      {/* Session Details */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Session Details
            </h2>
          </FadeIn>
          <div className="mt-8 space-y-6 text-muted-foreground">
            <FadeIn delay={0.1}>
              <p>
                Sibling preparation sessions are tailored to your child's age,
                personality, and your family's unique situation. We can meet
                one-on-one or include multiple siblings together.
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p>
                <strong className="text-foreground">Ages 2-4:</strong> Focus on
                very basic concepts through play, stories, and hands-on
                activities with baby dolls.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <p>
                <strong className="text-foreground">Ages 5-8:</strong> More
                detailed information about pregnancy, birth, and newborn care,
                with opportunities for questions and discussion.
              </p>
            </FadeIn>
            <FadeIn delay={0.4}>
              <p>
                <strong className="text-foreground">Ages 9+:</strong>{' '}
                Age-appropriate education that can include birth videos,
                detailed anatomy, and deeper conversations about the postpartum
                period.
              </p>
            </FadeIn>
            <FadeIn delay={0.5}>
              <p>
                Sessions typically last 60-90 minutes and can take place in your
                home where children feel most comfortable. I bring
                age-appropriate books, dolls, and activities to make learning
                interactive and fun.
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
              Help Your Child Feel Included
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-4 text-lg text-muted-foreground">
              Let's prepare your whole family for this exciting transition.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Schedule a Session</Link>
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

/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/ui/fade-in'

export const metadata: Metadata = {
  title: 'What Does a Doula Do? Complete Guide to Doula Support | Kearney, NE',
  description:
    'Wondering what a doula actually does? Learn about doula support during pregnancy, labor, birth, and postpartum. Includes how doulas differ from midwives and nurses.',
  keywords:
    'what does a doula do, doula vs midwife, birth doula role, postpartum doula, doula support Kearney NE',
}

export default function WhatDoesDoulaDoPost() {
  return (
    <article className="bg-background">
      {/* Header */}
      <header className="px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Blog
            </Link>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                Birth Support
              </span>
              <time>December 6, 2025</time>
              <span>8 min read</span>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              What Does a Doula Actually Do? A Complete Guide
            </h1>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="mt-6 text-xl text-muted-foreground">
              If you're pregnant and researching your options, you've probably
              heard the word "doula" thrown around. But what does a doula
              actually do? And how is it different from a midwife, doctor, or
              nurse?
            </p>
          </FadeIn>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-8 lg:px-8">
        <div className="prose prose-lg mx-auto max-w-3xl prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            The Simple Answer
          </h2>
          <p>
            A <strong>doula</strong> is a trained professional who provides
            continuous physical, emotional, and informational support to you
            before, during, and after birth. Unlike medical providers, doulas
            don't deliver babies or make clinical decisions—we focus entirely on
            YOUR comfort, confidence, and informed decision-making.
          </p>

          <p>
            Think of a doula as your dedicated support person, advocate, and
            guide through one of life's most transformative experiences.
          </p>

          <h2 className="mt-12 font-serif text-3xl font-bold text-foreground">
            What Doulas Do: The Real Work
          </h2>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            Before Birth (Prenatal Support)
          </h3>
          <p>
            Doula support starts long before you go into labor. During our
            prenatal visits, I help you:
          </p>
          <ul>
            <li>
              <strong>Understand your options</strong> for birth location, pain
              management, interventions, and more
            </li>
            <li>
              <strong>Create a birth plan</strong> that reflects your
              preferences while staying flexible
            </li>
            <li>
              <strong>Learn comfort techniques</strong> like breathing,
              positioning, and massage
            </li>
            <li>
              <strong>Address fears and questions</strong> in a non-judgmental
              space
            </li>
            <li>
              <strong>Coordinate with your partner</strong> about how they can
              best support you
            </li>
          </ul>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            During Labor and Birth
          </h3>
          <p>
            This is where doulas really shine. I'm with you from active labor
            through the first hours after birth, providing:
          </p>

          <p>
            <strong>Physical Support:</strong>
          </p>
          <ul>
            <li>Suggesting position changes to help labor progress</li>
            <li>Counter-pressure, hip squeezes, and massage</li>
            <li>Helping you move and change positions</li>
            <li>Offering comfort measures like cool cloths or water</li>
            <li>Reminding you to eat, drink, and use the bathroom</li>
          </ul>

          <p>
            <strong>Emotional Support:</strong>
          </p>
          <ul>
            <li>Reassurance during difficult moments</li>
            <li>Helping you stay calm and focused</li>
            <li>Celebrating your strength and progress</li>
            <li>Creating a peaceful environment</li>
          </ul>

          <p>
            <strong>Informational Support:</strong>
          </p>
          <ul>
            <li>
              Explaining what's happening in your body (without giving medical
              advice)
            </li>
            <li>
              Helping you understand your options when decisions need to be made
            </li>
            <li>Facilitating communication with your medical team</li>
            <li>Advocating for your preferences</li>
          </ul>

          <p>
            <strong>Partner Support:</strong>
          </p>
          <ul>
            <li>
              Suggesting ways your partner can help (they're not
              replaced—they're empowered!)
            </li>
            <li>Taking over when your partner needs a break</li>
            <li>Capturing special moments so they can be present</li>
          </ul>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            After Birth (Postpartum Support)
          </h3>
          <p>
            <strong>Birth doulas</strong> typically include one postpartum visit
            to:
          </p>
          <ul>
            <li>Process your birth experience</li>
            <li>Answer questions about recovery and newborn care</li>
            <li>Provide initial breastfeeding support</li>
            <li>Check in on your emotional wellbeing</li>
          </ul>

          <p>
            <strong>Postpartum doulas</strong> offer more extensive support in
            the weeks and months after birth:
          </p>
          <ul>
            <li>In-home help with newborn care and feeding</li>
            <li>
              Light household tasks so you can rest and bond with your baby
            </li>
            <li>Emotional support as you adjust to parenthood</li>
            <li>Sibling care and family adjustment support</li>
            <li>
              Evidence-based information about infant care and development
            </li>
          </ul>

          <h2 className="mt-12 font-serif text-3xl font-bold text-foreground">
            How Doulas Are Different From...
          </h2>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            Midwives
          </h3>
          <p>
            <strong>Midwives</strong> are medical professionals who provide
            prenatal care, deliver babies, and manage clinical aspects of birth.
            Doulas provide non-medical support and work alongside your midwife
            (or OB).
          </p>
          <p>
            Many people have both a midwife AND a doula—they complement each
            other beautifully. Your midwife handles the medical care while your
            doula focuses entirely on your comfort and emotional support.
          </p>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            Nurses
          </h3>
          <p>
            Hospital nurses are amazing, but they have multiple patients,
            charting responsibilities, and shift changes. A doula stays with YOU
            the entire time, never leaves for a shift change, and isn't pulled
            away to care for other patients.
          </p>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            Your Partner
          </h3>
          <p>
            Doulas don't replace partners—we support them! Many partners feel
            relieved to have an experienced professional there to guide them.
            After the birth, partners often tell me they couldn't have imagined
            going through it without a doula.
          </p>

          <h2 className="mt-12 font-serif text-3xl font-bold text-foreground">
            What Doulas DON'T Do
          </h2>
          <p>To be clear, doulas:</p>
          <ul>
            <li>
              <strong>Don't perform medical tasks</strong> like checking
              dilation, monitoring fetal heart rate, or delivering babies
            </li>
            <li>
              <strong>Don't make decisions for you</strong>—we help you
              understand options so YOU can make informed choices
            </li>
            <li>
              <strong>Don't speak for you</strong> to medical staff—we help you
              communicate your own preferences
            </li>
            <li>
              <strong>Don't judge your choices</strong>—whether you want
              medication or not, hospital or home birth, we support YOUR
              decisions
            </li>
          </ul>

          <h2 className="mt-12 font-serif text-3xl font-bold text-foreground">
            Does Research Support Doula Care?
          </h2>
          <p>
            Absolutely. Multiple studies show that continuous labor support from
            a doula leads to:
          </p>
          <ul>
            <li>Shorter labors (by an average of 41 minutes)</li>
            <li>31% lower risk of needing Pitocin</li>
            <li>15% higher chance of spontaneous vaginal birth</li>
            <li>10% decrease in pain medication use</li>
            <li>38% lower risk of having a low Apgar score</li>
            <li>Higher satisfaction with the birth experience overall</li>
          </ul>
          <p className="text-sm italic">
            (Source: Cochrane Review, "Continuous support for women during
            childbirth")
          </p>

          <h2 className="mt-12 font-serif text-3xl font-bold text-foreground">
            Who Benefits From a Doula?
          </h2>
          <p>
            <strong>Everyone.</strong> Seriously. Doulas support:
          </p>
          <ul>
            <li>First-time parents who want education and reassurance</li>
            <li>
              Experienced parents who want support for a different birth
              experience
            </li>
            <li>
              People planning unmedicated births who want comfort techniques
            </li>
            <li>
              People planning epidurals who want support during early labor
            </li>
            <li>
              Families facing high-risk pregnancies who need extra emotional
              support
            </li>
            <li>Single parents or those without a dedicated support person</li>
            <li>Cesarean births (both planned and unplanned)</li>
            <li>LGBTQ+ families</li>
          </ul>

          <h2 className="mt-12 font-serif text-3xl font-bold text-foreground">
            The Bottom Line
          </h2>
          <p>
            A doula is your dedicated support person—someone who's been trained
            to help you feel informed, empowered, and cared for during
            pregnancy, birth, and postpartum. We bring evidence-based knowledge,
            practical hands-on support, and genuine empathy to one of life's
            biggest moments.
          </p>
          <p>
            Whether you're planning a medicated hospital birth, an unmedicated
            home birth, or anything in between, a doula can help you feel more
            confident and supported every step of the way.
          </p>
        </div>
      </div>

      {/* CTA */}
      <section className="bg-primary/5 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn direction="down">
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Interested in Doula Support in Kearney, NE?
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-4 text-lg text-muted-foreground">
              I'd love to chat about how I can support your birth and postpartum
              journey.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Schedule a Free Consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/services">View My Services</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </article>
  )
}

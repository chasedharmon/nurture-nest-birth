/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/ui/fade-in'
import { ReadingTimeBadge } from '@/components/blog/reading-time-badge'
import { SocialShare } from '@/components/blog/social-share'
import { RelatedPosts } from '@/components/blog/related-posts'
import { NewsletterSignup } from '@/components/newsletter/newsletter-signup'
import { JSONLDScript, getArticleSchema } from '@/lib/schema'
import { siteConfig } from '@/config/site'
import { getRelatedPosts } from '@/lib/blog/posts'

export const metadata: Metadata = {
  title:
    'Car Seat Safety: What Every New Parent Needs to Know | Nurture Nest Birth',
  description:
    'Essential car seat safety guide from a certified CPST. Learn about common installation mistakes, when to schedule a car seat check, and how to keep your baby safe.',
  keywords:
    'car seat safety, CPST, car seat installation, infant car seat, car seat check Kearney NE',
}

export default function CarSeatSafetyPost() {
  const articleSchema = getArticleSchema({
    title: 'Car Seat Safety: What Every New Parent Needs to Know',
    description:
      'Essential car seat safety guide from a certified CPST covering common mistakes, installation tips, and when to get a professional check.',
    datePublished: '2025-12-07',
    slug: 'car-seat-safety-guide',
  })

  const relatedPosts = getRelatedPosts('car-seat-safety-guide')

  return (
    <article className="bg-background">
      <JSONLDScript data={articleSchema} />

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
              <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                Safety
              </span>
              <time>December 7, 2025</time>
              <ReadingTimeBadge minutes={8} />
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Car Seat Safety: What Every New Parent Needs to Know
            </h1>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="mt-6 text-xl text-muted-foreground">
              You've probably spent hours researching the "best" car seat. But
              here's the truth: even the safest car seat won't protect your baby
              if it's installed incorrectly. And the statistics are sobering.
            </p>
          </FadeIn>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-8 lg:px-8">
        <div className="prose prose-lg mx-auto max-w-3xl prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            The Alarming Reality
          </h2>
          <p>
            According to the National Highway Traffic Safety Administration
            (NHTSA), <strong>73% of car seats are installed incorrectly</strong>
            . That means nearly 3 out of every 4 babies aren't getting the
            protection their car seat was designed to provide.
          </p>

          <p>
            Car crashes are the <strong>leading cause of death</strong> for
            children ages 1-13 in the United States. When used correctly, car
            seats reduce the risk of fatal injury by:
          </p>
          <ul>
            <li>
              <strong>71%</strong> for infants
            </li>
            <li>
              <strong>54%</strong> for toddlers
            </li>
          </ul>

          <p>
            But those statistics only hold true when the car seat is installed
            and used correctly. Even small errors can dramatically reduce
            protection.
          </p>

          <h2 className="mt-12 font-serif text-3xl font-bold text-foreground">
            Common Car Seat Mistakes
          </h2>
          <p>
            As a certified Child Passenger Safety Technician (CPST), I see the
            same mistakes over and over. Most parents have no idea they're doing
            anything wrong.
          </p>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            1. Loose Installation
          </h3>
          <p>
            <strong>The #1 mistake.</strong> A properly installed car seat
            should move less than 1 inch side-to-side or front-to-back at the
            belt path. Most parents don't realize how tight it needs to be—they
            stop when it "feels" secure, but that's rarely secure enough.
          </p>
          <p className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 text-sm dark:bg-blue-950/30">
            <strong>Quick test:</strong> Grab the car seat at the belt path (not
            the top) and try to move it. If it moves more than an inch in any
            direction, it's too loose.
          </p>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            2. Incorrect Recline Angle
          </h3>
          <p>
            Rear-facing car seats need to be at a specific angle (usually 30-45
            degrees) to keep your baby's airway open. Too upright and their head
            can fall forward, restricting breathing. Too reclined and they won't
            be protected in a crash.
          </p>
          <p>
            Most car seats have a level indicator—but many parents don't know to
            check it or adjust accordingly.
          </p>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            3. Harness Problems
          </h3>
          <p>Common harness mistakes include:</p>
          <ul>
            <li>
              <strong>Too loose:</strong> You shouldn't be able to pinch any
              slack at the shoulder
            </li>
            <li>
              <strong>Wrong height:</strong> For rear-facing, straps should be
              at or below shoulders; for forward-facing, at or above
            </li>
            <li>
              <strong>Chest clip placement:</strong> Should be at armpit level,
              not on the belly or neck
            </li>
            <li>
              <strong>Twisted straps:</strong> Reduce the harness's
              effectiveness
            </li>
          </ul>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            4. Using LATCH and Seatbelt Together
          </h3>
          <p>
            Unless your car seat manual specifically says otherwise, you should
            use <strong>either</strong> the LATCH system <strong>or</strong> the
            seatbelt to install—not both. Using both doesn't make it safer and
            can actually cause problems.
          </p>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            5. Aftermarket Accessories
          </h3>
          <p>
            Those cute strap covers, head supports, and seat protectors you see
            online? If they didn't come in the box with your car seat,{' '}
            <strong>they're not crash-tested with it</strong>. Some aftermarket
            products can actually interfere with the car seat's safety features.
          </p>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            6. Winter Coat Danger
          </h3>
          <p>
            Puffy winter coats compress in a crash, creating slack in the
            harness. This extra space can allow your baby to be ejected from the
            seat. Instead: strap baby in without the coat, then put a blanket
            over them.
          </p>

          <h2 className="mt-12 font-serif text-3xl font-bold text-foreground">
            When to Get a Professional Car Seat Check
          </h2>
          <p>I recommend scheduling a car seat check:</p>
          <ul>
            <li>
              <strong>Before baby is born</strong> — Practice installing without
              a squirming newborn!
            </li>
            <li>
              <strong>After hospital discharge</strong> — Confirm everything is
              still correct
            </li>
            <li>
              <strong>When you switch car seats</strong> — Moving from infant to
              convertible seat
            </li>
            <li>
              <strong>After a crash</strong> — Even minor fender-benders
            </li>
            <li>
              <strong>When moving to a new vehicle</strong> — Different cars
              require different techniques
            </li>
            <li>
              <strong>If anything feels "off"</strong> — Trust your instincts!
            </li>
          </ul>

          <h2 className="mt-12 font-serif text-3xl font-bold text-foreground">
            What Happens at a Car Seat Check?
          </h2>
          <p>A professional car seat check with a CPST includes:</p>
          <ul>
            <li>
              <strong>Review of your specific car seat</strong> — Every model is
              different
            </li>
            <li>
              <strong>Hands-on installation</strong> — You'll do the
              installation while I guide you
            </li>
            <li>
              <strong>Harness fitting with baby</strong> — Teaching you proper
              strap adjustments
            </li>
            <li>
              <strong>Vehicle-specific tips</strong> — Working around your car's
              unique features
            </li>
            <li>
              <strong>Question time</strong> — No question is too small
            </li>
            <li>
              <strong>Reference materials</strong> — So you can do it right
              every time
            </li>
          </ul>
          <p>
            The goal isn't to install it for you—it's to{' '}
            <strong>teach you</strong> so you can confidently install and adjust
            the seat whenever needed.
          </p>

          <h2 className="mt-12 font-serif text-3xl font-bold text-foreground">
            Quick Safety Checklist
          </h2>
          <p>
            Before every trip, do a quick check. It takes less than a minute:
          </p>
          <ol>
            <li>
              <strong>Installation:</strong> Does the seat move less than 1 inch
              at the belt path?
            </li>
            <li>
              <strong>Angle:</strong> Is the recline indicator in the correct
              zone?
            </li>
            <li>
              <strong>Harness:</strong> Can you pinch any slack at the shoulder?
              (You shouldn't be able to)
            </li>
            <li>
              <strong>Chest clip:</strong> Is it at armpit level?
            </li>
            <li>
              <strong>Straps:</strong> Are they flat, not twisted?
            </li>
            <li>
              <strong>Clothing:</strong> Is baby in light layers, no puffy coat?
            </li>
          </ol>

          <h2 className="mt-12 font-serif text-3xl font-bold text-foreground">
            Why I Got CPST Certified
          </h2>
          <p>
            Most doulas don't offer car seat safety checks. So why did I pursue
            this certification?
          </p>
          <p>
            Because I watched too many new parents drive away from the hospital
            with incorrectly installed car seats. Because 73% is an unacceptable
            number. Because a car seat check is one of the most impactful things
            I can offer a family—it takes 30 minutes and could save a life.
          </p>
          <p>
            For my doula clients, I include a car seat check as part of our
            prenatal visits. It's just one more way I help families prepare for
            baby's safe arrival.
          </p>

          <h2 className="mt-12 font-serif text-3xl font-bold text-foreground">
            Find a Certified Technician
          </h2>
          <p>
            If you're not in my service area, you can find a certified CPST near
            you at{' '}
            <a
              href="https://cert.safekids.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              cert.safekids.org
            </a>
            . Many fire stations, hospitals, and baby stores also offer free or
            low-cost car seat checks.
          </p>

          <p>
            <strong>Please</strong>—whether it's with me or another CPST—get
            your car seat checked. Your baby's safety is worth the extra step.
          </p>
        </div>
      </div>

      {/* Social Share */}
      <div className="border-y border-border bg-muted/30 px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <SocialShare
            title="Car Seat Safety: What Every New Parent Needs to Know"
            url={`${siteConfig.url.canonical}/blog/car-seat-safety-guide`}
            description="Essential car seat safety guide from a certified CPST. 73% of car seats are installed incorrectly—don't let yours be one of them."
            className="justify-center"
          />
        </div>
      </div>

      {/* CTA */}
      <section className="bg-blue-50 px-6 py-16 dark:bg-blue-950/20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn direction="down">
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Schedule a Car Seat Safety Check
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-4 text-lg text-muted-foreground">
              As a certified CPST, I'll teach you to install your car seat
              correctly—giving you peace of mind every time you drive.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Book a Car Seat Check</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/services/car-seat-safety">Learn More</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="border-y border-border bg-card px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <NewsletterSignup
            variant="card"
            title="More Safety Tips for New Parents"
            description="Get practical, evidence-based tips for keeping your baby safe and healthy."
          />
        </div>
      </section>

      {/* Related Posts */}
      <RelatedPosts posts={relatedPosts} currentSlug="car-seat-safety-guide" />
    </article>
  )
}

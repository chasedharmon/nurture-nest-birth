/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Creating a Birth Plan That Actually Works | Doula Tips',
  description:
    'Learn how to write a realistic, flexible birth plan that helps you communicate preferences without rigid expectations. Includes free template and doula advice.',
  keywords:
    'birth plan template, how to write birth plan, flexible birth plan, birth preferences, doula birth plan help',
}

export default function BirthPlanTipsPost() {
  return (
    <article className="bg-background">
      <header className="px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
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
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
              Birth Preparation
            </span>
            <time>December 4, 2025</time>
            <span>10 min read</span>
          </div>
          <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Creating a Birth Plan That Actually Works
          </h1>
        </div>
      </header>

      <div className="px-6 py-8 lg:px-8">
        <div className="prose prose-lg mx-auto max-w-3xl text-muted-foreground">
          <p className="text-xl">
            Birth plans can be powerful communication tools—or sources of stress
            and disappointment. The difference? Approaching your birth plan as a
            flexible guide, not a rigid script.
          </p>

          <h2 className="font-serif text-3xl font-bold text-foreground">
            What a Birth Plan Is (And Isn't)
          </h2>
          <p>
            <strong>A birth plan IS:</strong>
          </p>
          <ul>
            <li>
              A communication tool to share your preferences with your care team
            </li>
            <li>A way to think through your values and priorities for birth</li>
            <li>
              A starting point for conversations with your provider and doula
            </li>
            <li>A reminder of what matters most to you during labor</li>
          </ul>

          <p>
            <strong>A birth plan is NOT:</strong>
          </p>
          <ul>
            <li>A guarantee of how your birth will go</li>
            <li>A contract your medical team must follow</li>
            <li>Set in stone—it can (and often should) adapt</li>
            <li>A measure of success or failure</li>
          </ul>

          <h2 className="font-serif text-3xl font-bold text-foreground">
            Keep It Short and Clear
          </h2>
          <p>
            Your nurse, midwife, or OB should be able to read your birth plan in
            under 2 minutes. Aim for <strong>one page, bullet points</strong>,
            organized by topic.
          </p>

          <p>
            <strong>Effective structure:</strong>
          </p>
          <ul>
            <li>Labor preferences (movement, positions, atmosphere)</li>
            <li>Pain management preferences</li>
            <li>Delivery preferences</li>
            <li>Immediate postpartum/newborn care preferences</li>
            <li>Special circumstances (if applicable)</li>
          </ul>

          <h2 className="font-serif text-3xl font-bold text-foreground">
            Use "I Prefer" Language
          </h2>
          <p>
            Phrasing matters. Instead of rigid demands, use collaborative
            language:
          </p>

          <p>
            <strong>Instead of:</strong> "I do NOT want an epidural."
          </p>
          <p>
            <strong>Try:</strong> "I'd like to try unmedicated pain management
            first. If I request an epidural during labor, please take me
            seriously."
          </p>

          <p>
            <strong>Instead of:</strong> "No unnecessary interventions."
          </p>
          <p>
            <strong>Try:</strong> "I'd like to discuss the benefits and risks
            before any interventions are recommended."
          </p>

          <h2 className="font-serif text-3xl font-bold text-foreground">
            Sample Birth Plan Framework
          </h2>

          <h3 className="font-serif text-2xl font-semibold text-foreground">
            Labor Environment
          </h3>
          <ul>
            <li>I'd like the room kept dim/quiet</li>
            <li>I prefer minimal interruptions</li>
            <li>I'd like to play my own music</li>
            <li>I want [partner/doula] present at all times</li>
          </ul>

          <h3 className="font-serif text-2xl font-semibold text-foreground">
            Movement & Positioning
          </h3>
          <ul>
            <li>I'd like freedom to move and change positions</li>
            <li>I prefer intermittent monitoring (if low-risk)</li>
            <li>I'd like access to birthing ball, peanut ball, squat bar</li>
          </ul>

          <h3 className="font-serif text-2xl font-semibold text-foreground">
            Pain Management
          </h3>
          <ul>
            <li>
              I plan to use breathing, positioning, and hydrotherapy first
            </li>
            <li>I'm open to an epidural if I request one</li>
            <li>
              Please offer alternative comfort measures before suggesting
              medication
            </li>
          </ul>

          <h3 className="font-serif text-2xl font-semibold text-foreground">
            Pushing & Delivery
          </h3>
          <ul>
            <li>I'd like to push in positions that feel right to me</li>
            <li>I prefer spontaneous pushing (not directed/coached)</li>
            <li>I'd like to avoid an episiotomy unless medically necessary</li>
            <li>I'd like my partner to help catch the baby (if possible)</li>
          </ul>

          <h3 className="font-serif text-2xl font-semibold text-foreground">
            Immediate Postpartum
          </h3>
          <ul>
            <li>
              Immediate skin-to-skin (unless baby needs medical attention)
            </li>
            <li>Delay cord clamping for at least 1–3 minutes</li>
            <li>I plan to breastfeed and would like lactation support</li>
            <li>
              Delay newborn procedures until after first hour (if possible)
            </li>
          </ul>

          <h2 className="font-serif text-3xl font-bold text-foreground">
            Plan for Different Scenarios
          </h2>
          <p>
            Birth rarely goes exactly as planned. Consider adding a section
            like:
          </p>

          <p>
            <strong>"If labor doesn't progress as expected:"</strong>
          </p>
          <ul>
            <li>I'm open to Pitocin after discussing risks/benefits</li>
            <li>I'd like to try position changes and movement first</li>
            <li>
              Please give me time to rest and regroup before interventions
            </li>
          </ul>

          <p>
            <strong>"If a cesarean becomes necessary:"</strong>
          </p>
          <ul>
            <li>I'd like my partner present</li>
            <li>I'd like the drape lowered so I can see baby's birth</li>
            <li>I want skin-to-skin in the OR or recovery</li>
            <li>I'd like to breastfeed as soon as possible</li>
          </ul>

          <h2 className="font-serif text-3xl font-bold text-foreground">
            Share Your Birth Plan Early
          </h2>
          <p>Don't wait until labor! Share your birth plan with:</p>
          <ul>
            <li>
              <strong>Your provider</strong> at a prenatal visit (ideally 36
              weeks)
            </li>
            <li>
              <strong>Your doula</strong> so they can advocate for your
              preferences
            </li>
            <li>
              <strong>Your partner/support people</strong> so everyone's on the
              same page
            </li>
            <li>
              <strong>Your hospital</strong> by including it in your admission
              paperwork
            </li>
          </ul>

          <h2 className="font-serif text-3xl font-bold text-foreground">
            Be Ready to Adapt
          </h2>
          <p>The best birth plan is a flexible one. Remember:</p>
          <ul>
            <li>Your safety and your baby's safety come first</li>
            <li>You can change your mind—that's not "failing"</li>
            <li>Medical necessity might require different choices</li>
            <li>
              A positive birth isn't about following a plan—it's about feeling
              informed, respected, and supported
            </li>
          </ul>

          <h2 className="font-serif text-3xl font-bold text-foreground">
            How a Doula Helps With Your Birth Plan
          </h2>
          <p>This is where doulas really shine. I help you:</p>
          <ul>
            <li>Think through what matters most to you</li>
            <li>
              Write a clear, concise plan that medical teams will actually read
            </li>
            <li>
              Understand which preferences are realistic for your birth location
            </li>
            <li>Communicate your preferences effectively during labor</li>
            <li>Stay flexible when circumstances change</li>
          </ul>

          <h2 className="font-serif text-3xl font-bold text-foreground">
            The Bottom Line
          </h2>
          <p>
            A good birth plan helps you feel prepared and empowered. A great
            birth plan also acknowledges that birth is unpredictable—and that's
            okay.
          </p>
          <p>
            Focus on your top 3–5 priorities, stay flexible, and remember: the
            goal isn't a perfect birth, it's feeling informed and supported
            through whatever unfolds.
          </p>
        </div>
      </div>

      <section className="bg-primary/5 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            Need Help Creating Your Birth Plan?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            As your doula, I'll help you think through your preferences and
            create a birth plan that works for you.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/contact">Let's Talk</Link>
            </Button>
          </div>
        </div>
      </section>
    </article>
  )
}

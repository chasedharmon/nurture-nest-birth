import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export const metadata: Metadata = {
  title: 'Contact | Nurture Nest Birth | Kearney, NE',
  description:
    'Contact Nurture Nest Birth for doula services in Kearney, Nebraska. Schedule a free consultation to discuss your birth and postpartum needs.',
  keywords:
    'contact doula Kearney NE, schedule consultation, birth doula contact Nebraska',
}

export default function ContactPage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Let&apos;s Connect
          </h1>
          <p className="mt-6 text-xl text-muted-foreground">
            I&apos;d love to hear about your journey and how I can support you.
            Reach out to schedule a free consultation.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">
                  Send Me a Message
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  I typically respond within 24 hours.
                </p>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(308) 555-1234"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date (if applicable)</Label>
                    <Input id="dueDate" name="dueDate" type="date" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service">Service Interest</Label>
                    <select
                      id="service"
                      name="service"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    >
                      <option value="">Select a service...</option>
                      <option value="birth-doula">Birth Doula Support</option>
                      <option value="postpartum-care">Postpartum Care</option>
                      <option value="lactation">Lactation Consulting</option>
                      <option value="sibling-prep">Sibling Preparation</option>
                      <option value="multiple">Multiple Services</option>
                      <option value="not-sure">Not Sure Yet</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell me a bit about what you're looking for..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Send Message
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    By submitting this form, you agree to be contacted about
                    doula services.
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info & Calendly Placeholder */}
            <div className="space-y-8">
              {/* Direct Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">
                    Get In Touch
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground">Email</h3>
                    <a
                      href="mailto:hello@nurturenestbirth.com"
                      className="text-primary hover:underline"
                    >
                      hello@nurturenestbirth.com
                    </a>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground">Phone</h3>
                    <a
                      href="tel:+13084405153"
                      className="text-primary hover:underline"
                    >
                      (308) 440-5153
                    </a>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground">
                      Service Area
                    </h3>
                    <p className="text-muted-foreground">
                      Kearney, Grand Island, Hastings, and surrounding
                      communities in central Nebraska
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground">
                      Response Time
                    </h3>
                    <p className="text-muted-foreground">
                      I typically respond within 24 hours. If you&apos;re in
                      active labor and I&apos;m your doula, call or text
                      immediately.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Calendly Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">
                    Schedule a Consultation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10">
                    <div className="text-center">
                      <p className="text-muted-foreground">
                        Calendly scheduling widget will appear here
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Coming soon
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="bg-primary/5 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            Have Questions First?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Check out my frequently asked questions or feel free to reach out
            directly.
          </p>
          <div className="mt-8">
            <Button asChild variant="outline" size="lg">
              <a href="/faq">View FAQ</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

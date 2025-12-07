import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <h3 className="font-serif text-lg font-bold text-foreground">
              Nurture Nest Birth
            </h3>
            <p className="mt-4 text-sm text-muted-foreground">
              Compassionate, evidence-based doula care serving Kearney and
              Central Nebraska. Supporting families through pregnancy, birth,
              and postpartum.
            </p>
            <div className="mt-6">
              <p className="text-sm font-medium text-foreground">
                DONA Certified Doula
              </p>
              <p className="text-sm text-muted-foreground">
                Lactation Consultant
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Services</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/services/birth-doula"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Birth Doula
                </Link>
              </li>
              <li>
                <Link
                  href="/services/postpartum-care"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Postpartum Care
                </Link>
              </li>
              <li>
                <Link
                  href="/services/lactation"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Lactation Consulting
                </Link>
              </li>
              <li>
                <Link
                  href="/services/sibling-prep"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sibling Preparation
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Contact</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="mailto:hello@nurturenestbirth.com"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  hello@nurturenestbirth.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+13084405153"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  (308) 440-5153
                </a>
              </li>
              <li className="text-sm text-muted-foreground">
                Kearney, Nebraska 68847
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Schedule Consultation
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {currentYear} Nurture Nest Birth. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

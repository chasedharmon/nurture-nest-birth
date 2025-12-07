import Link from 'next/link'
import { siteConfig } from '@/config/site'

/**
 * Footer Component
 *
 * Site footer with links and business info
 * All data comes from site config for easy maintenance
 */

const footerNavigation = {
  services: [
    { name: 'Birth Doula', href: '/services/birth-doula' },
    { name: 'Postpartum Care', href: '/services/postpartum-care' },
    { name: 'Lactation Consulting', href: '/services/lactation' },
    { name: 'Sibling Preparation', href: '/services/sibling-prep' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Testimonials', href: '/testimonials' },
    { name: 'FAQ', href: '/faq' },
  ],
  resources: [
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand Section */}
          <div className="space-y-6">
            <div>
              <Link
                href="/"
                className="font-serif text-2xl font-bold text-primary"
              >
                {siteConfig.business.name}
              </Link>
              <p className="mt-2 text-sm text-muted-foreground">
                {siteConfig.business.tagline}
              </p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Serving:</p>
              <p>{siteConfig.location.serviceArea.slice(0, 3).join(', ')}</p>
              <p>
                {siteConfig.location.city}, {siteConfig.location.stateAbbr}{' '}
                {siteConfig.location.zipCode}
              </p>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <a
                  href={`tel:${siteConfig.contact.phoneFormatted}`}
                  className="hover:text-primary"
                >
                  {siteConfig.contact.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="hover:text-primary"
                >
                  {siteConfig.contact.email}
                </a>
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="mt-10 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Services
                </h3>
                <ul role="list" className="mt-4 space-y-3">
                  {footerNavigation.services.map(item => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold text-foreground">
                  Company
                </h3>
                <ul role="list" className="mt-4 space-y-3">
                  {footerNavigation.company.map(item => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Resources
              </h3>
              <ul role="list" className="mt-4 space-y-3">
                {footerNavigation.resources.map(item => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Credentials */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-foreground">
                  Credentials
                </h3>
                <ul role="list" className="mt-4 space-y-1">
                  {siteConfig.credentials.slice(0, 3).map((credential, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      {credential}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {siteConfig.business.name}. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

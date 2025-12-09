'use client'

import dynamic from 'next/dynamic'

// Dynamically import Header and Footer with no SSR to avoid hydration mismatch
// when using usePathname for conditional rendering
const Header = dynamic(
  () => import('./header').then(mod => ({ default: mod.Header })),
  { ssr: false }
)

const Footer = dynamic(
  () => import('./footer').then(mod => ({ default: mod.Footer })),
  { ssr: false }
)

export function ConditionalHeader() {
  return <Header />
}

export function ConditionalFooter() {
  return <Footer />
}

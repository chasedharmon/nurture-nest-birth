import type { Metadata } from 'next'
import { Inter, Lora } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Nurture Nest Birth | DONA-Certified Doula in Kearney, Nebraska',
  description:
    'Compassionate, evidence-based doula care in Kearney, Nebraska. Birth support, postpartum care, lactation consulting, and sibling preparation. DONA-certified with over 3 years experience.',
  keywords:
    'doula Kearney Nebraska, birth doula, postpartum doula, lactation consultant, Kearney NE, DONA certified',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${lora.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}

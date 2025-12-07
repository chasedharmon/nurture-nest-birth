import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Client Portal - Nurture Nest Birth',
  description: 'Your personal doula care portal',
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className={inter.className}>{children}</div>
}

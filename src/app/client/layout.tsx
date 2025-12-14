import { Inter } from 'next/font/google'
import { PWAProvider } from '@/components/pwa'

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
  return (
    <PWAProvider showInstallPrompt={true} showUpdateBanner={true}>
      <div className={inter.className}>{children}</div>
    </PWAProvider>
  )
}

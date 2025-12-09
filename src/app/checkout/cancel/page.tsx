import Link from 'next/link'
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CheckoutCancelPageProps {
  searchParams: Promise<{
    invoice_id?: string
  }>
}

export default async function CheckoutCancelPage({
  searchParams,
}: CheckoutCancelPageProps) {
  // Invoice ID available for potential future use (e.g., retry payment link)
  void searchParams

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20 dark:to-background">
      <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <XCircle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              Payment Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              Your payment was cancelled. Don&apos;t worry - no charges were
              made to your account.
            </p>

            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="mb-2 font-medium">What happens now?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  Your invoice remains unpaid and can be accessed anytime
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  You can return to pay when you&apos;re ready
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  Contact us if you need to discuss payment options
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Link href="/client/payments" className="w-full">
                <Button className="w-full" size="lg">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Payments
                </Button>
              </Link>

              <Link href="/contact" className="w-full">
                <Button variant="outline" className="w-full">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Need Help?
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Having trouble with the payment process?{' '}
          <Link href="/contact" className="text-primary hover:underline">
            Let us know
          </Link>
        </p>
      </div>
    </div>
  )
}

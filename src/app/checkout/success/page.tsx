import Link from 'next/link'
import { CheckCircle2, FileText, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CheckoutSuccessPageProps {
  searchParams: Promise<{
    session_id?: string
    invoice_id?: string
    demo?: string
  }>
}

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const params = await searchParams
  const isDemo = params.demo === 'true'

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background dark:from-green-950/20 dark:to-background">
      <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-300">
              Payment Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              Thank you for your payment. Your invoice has been marked as paid
              and a receipt has been sent to your email.
            </p>

            {isDemo && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                <p className="font-medium">Demo Mode</p>
                <p className="mt-1">
                  This is a demonstration. In production, this page would
                  display actual payment confirmation details from Stripe.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  Paid
                </span>
              </div>

              {params.session_id && (
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">
                    Reference
                  </span>
                  <span className="font-mono text-sm">
                    {params.session_id.slice(-12)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Link href="/client" className="w-full">
                <Button className="w-full" size="lg">
                  <FileText className="mr-2 h-4 w-4" />
                  View My Portal
                </Button>
              </Link>

              <Link href="/client/payments" className="w-full">
                <Button variant="outline" className="w-full">
                  View Payment History
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Questions about your payment?{' '}
          <Link href="/contact" className="text-primary hover:underline">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  )
}

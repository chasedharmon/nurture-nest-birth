import { getSurveyByToken, markInvitationOpened } from '@/app/actions/surveys'
import { SurveyResponseForm } from './survey-response-form'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface SurveyPageProps {
  params: Promise<{ token: string }>
}

export default async function SurveyPage({ params }: SurveyPageProps) {
  const { token } = await params
  const result = await getSurveyByToken(token)

  // Mark as opened
  if (result.success) {
    await markInvitationOpened(token)
  }

  // Error states
  if (!result.success) {
    if (result.alreadyCompleted) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mb-4 mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h1 className="text-xl font-semibold mb-2">
                Survey Already Completed
              </h1>
              <p className="text-muted-foreground mb-6">
                Thank you! You have already submitted your feedback for this
                survey.
              </p>
              <Link href="/">
                <Button variant="outline">Return Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mb-4 mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Survey Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {result.error ||
                'This survey link is invalid or has expired. Please contact us if you believe this is an error.'}
            </p>
            <Link href="/">
              <Button variant="outline">Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { invitation } = result
  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mb-4 mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Survey Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This survey link is invalid or has expired.
            </p>
            <Link href="/">
              <Button variant="outline">Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  const { survey, client } = invitation

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
            {survey.name}
          </h1>
          {survey.description && (
            <p className="text-muted-foreground">{survey.description}</p>
          )}
          {client && (
            <p className="text-sm text-muted-foreground mt-2">
              Hi {client.name.split(' ')[0]}, we&apos;d love to hear your
              feedback!
            </p>
          )}
        </div>

        {/* Survey Form */}
        <Card>
          <CardContent className="pt-6">
            <SurveyResponseForm
              token={token}
              survey={survey}
              thankYouMessage={
                survey.thank_you_message || 'Thank you for your feedback!'
              }
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Your feedback is confidential and helps us improve our services.
        </p>
      </div>
    </div>
  )
}

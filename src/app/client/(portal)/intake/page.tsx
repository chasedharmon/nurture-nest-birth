import { redirect } from 'next/navigation'
import { getClientSession } from '@/app/actions/client-auth'
import {
  getDefaultIntakeTemplate,
  getClientDraft,
  getClientIntakeSubmissions,
} from '@/app/actions/intake-forms'
import { IntakeForm } from '@/components/client/intake-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default async function ClientIntakePage() {
  const session = await getClientSession()

  if (!session) {
    redirect('/client/login')
  }

  // Check if they've already submitted
  const submissions = await getClientIntakeSubmissions(session.clientId)
  const hasSubmitted = submissions.some(
    s => s.status === 'submitted' || s.status === 'reviewed'
  )

  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/80 backdrop-blur-sm border-[#e8ddd4] shadow-xl">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2
              className="text-2xl font-light text-[#5c4a3d] mb-2"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Form Already Submitted
            </h2>
            <p className="text-[#8b7355] mb-6">
              You&apos;ve already completed your intake form. Thank you!
            </p>
            <div className="space-y-3">
              <Button
                asChild
                className="w-full bg-[#8b7355] hover:bg-[#7a6347]"
              >
                <Link href="/client/dashboard">Go to Dashboard</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full border-[#e0d5c9] text-[#8b7355]"
              >
                <Link href="/client/profile">View Your Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get the default template
  const template = await getDefaultIntakeTemplate()

  if (!template) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/80 backdrop-blur-sm border-[#e8ddd4]">
          <CardContent className="pt-8 pb-6 text-center">
            <p className="text-[#8b7355]">
              No intake form is currently available. Please contact your doula.
            </p>
            <Button asChild className="mt-4 bg-[#8b7355] hover:bg-[#7a6347]">
              <Link href="/client/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check for existing draft
  const draft = await getClientDraft(session.clientId)

  return (
    <IntakeForm
      templateId={template.id}
      initialData={draft?.form_data as Record<string, string> | undefined}
      draftId={draft?.id}
    />
  )
}

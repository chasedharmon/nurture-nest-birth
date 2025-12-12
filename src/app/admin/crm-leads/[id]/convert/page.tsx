import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ChevronLeft, AlertTriangle } from 'lucide-react'

import { getConversionPreview } from '@/app/actions/lead-conversion'
import { LeadConversionWizard } from '@/components/admin/crm/lead-conversion-wizard'

export default async function ConvertLeadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get conversion preview data
  const previewResult = await getConversionPreview(id)

  if (previewResult.error || !previewResult.data) {
    // Check if lead exists but is already converted
    const { data: lead } = await supabase
      .from('crm_leads')
      .select('id, first_name, last_name, is_converted, converted_contact_id')
      .eq('id', id)
      .single()

    if (!lead) {
      notFound()
    }

    // Lead is already converted - show message with link to contact
    if (lead.is_converted) {
      return (
        <div className="min-h-screen bg-background">
          <div className="mx-auto max-w-3xl px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                href={`/admin/crm-leads/${id}`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Lead
              </Link>
              <h1 className="text-2xl font-bold text-foreground">
                Lead Already Converted
              </h1>
            </div>

            {/* Already converted message */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <h3 className="font-medium text-amber-800 dark:text-amber-300">
                    This lead has already been converted
                  </h3>
                  <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                    {lead.first_name} {lead.last_name} was previously converted
                    to a Contact. You cannot convert a lead more than once.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <Link href={`/admin/crm-leads/${id}`}>
                      <Button variant="outline" size="sm">
                        View Lead Record
                      </Button>
                    </Link>
                    {lead.converted_contact_id && (
                      <Link
                        href={`/admin/contacts/${lead.converted_contact_id}`}
                      >
                        <Button size="sm">View Contact</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Some other error
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-8">
            <Link
              href="/admin/crm-leads"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Leads
            </Link>
            <h1 className="text-2xl font-bold text-foreground">
              Error Loading Lead
            </h1>
          </div>

          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
            <p className="text-destructive">
              {previewResult.error || 'Unable to load lead for conversion'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const {
    lead,
    mappedContactData,
    mappedAccountData,
    suggestedOpportunityName,
  } = previewResult.data

  const leadName = `${lead.first_name} ${lead.last_name}`.trim()

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/admin/crm-leads/${id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Lead
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Convert Lead: {leadName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Convert this lead into a Contact, Account, and optionally an
            Opportunity
          </p>
        </div>

        {/* Wizard */}
        <LeadConversionWizard
          lead={lead}
          mappedContactData={mappedContactData}
          mappedAccountData={mappedAccountData}
          suggestedOpportunityName={suggestedOpportunityName}
        />
      </div>
    </div>
  )
}

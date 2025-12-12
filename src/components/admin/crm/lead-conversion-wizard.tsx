'use client'

/**
 * Lead Conversion Wizard
 *
 * A multi-step wizard that guides users through converting a Lead into:
 * - Contact (always created)
 * - Account (create new or select existing)
 * - Opportunity (optional)
 *
 * Steps:
 * 1. Account - Choose to create new or select existing
 * 2. Contact - Review/customize contact data
 * 3. Opportunity - Optionally create an opportunity
 * 4. Review - Confirm all details before conversion
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  Building2,
  User,
  Target,
  ClipboardCheck,
  Search,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import {
  convertLead,
  searchAccountsForConversion,
  type ConvertLeadOptions,
} from '@/app/actions/lead-conversion'
import type {
  CrmLead,
  CrmContact,
  CrmAccount,
  OpportunityStage,
} from '@/lib/crm/types'

// =====================================================
// TYPES
// =====================================================

interface LeadConversionWizardProps {
  lead: CrmLead
  mappedContactData: Partial<CrmContact>
  mappedAccountData: Partial<CrmAccount>
  suggestedOpportunityName: string
}

interface WizardFormData {
  // Account step
  accountOption: 'create' | 'existing'
  existingAccountId?: string
  existingAccountName?: string
  accountName: string

  // Contact step
  firstName: string
  lastName: string
  email: string
  phone: string
  expectedDueDate: string

  // Opportunity step
  createOpportunity: boolean
  opportunityName: string
  opportunityStage: OpportunityStage
  opportunityAmount: string
  opportunityCloseDate: string
  serviceType: string
}

interface SearchedAccount {
  id: string
  name: string
  account_type: string
  account_status: string
  primary_contact_name?: string
}

// =====================================================
// STEP DEFINITIONS
// =====================================================

const STEPS = [
  { id: 'account', label: 'Account', icon: Building2 },
  { id: 'contact', label: 'Contact', icon: User },
  { id: 'opportunity', label: 'Opportunity', icon: Target },
  { id: 'review', label: 'Review', icon: ClipboardCheck },
] as const

// =====================================================
// MAIN COMPONENT
// =====================================================

export function LeadConversionWizard({
  lead,
  mappedContactData,
  mappedAccountData,
  suggestedOpportunityName,
}: LeadConversionWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Account search state
  const [accountSearchTerm, setAccountSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchedAccount[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Form data
  const [formData, setFormData] = useState<WizardFormData>({
    // Account
    accountOption: 'create',
    accountName: mappedAccountData.name || '',

    // Contact
    firstName: mappedContactData.first_name || '',
    lastName: mappedContactData.last_name || '',
    email: mappedContactData.email || '',
    phone: mappedContactData.phone || '',
    expectedDueDate: mappedContactData.expected_due_date || '',

    // Opportunity
    createOpportunity: true,
    opportunityName: suggestedOpportunityName,
    opportunityStage: 'qualification',
    opportunityAmount: lead.estimated_value?.toString() || '',
    opportunityCloseDate: lead.expected_close_date || '',
    serviceType: lead.service_interest || '',
  })

  // Handle account search
  const handleAccountSearch = useCallback(async (term: string) => {
    setAccountSearchTerm(term)

    if (!term.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const result = await searchAccountsForConversion(term)
    setIsSearching(false)

    if (result.data) {
      setSearchResults(result.data)
    }
  }, [])

  // Select existing account
  const handleSelectAccount = (account: SearchedAccount) => {
    setFormData(prev => ({
      ...prev,
      existingAccountId: account.id,
      existingAccountName: account.name,
    }))
    setSearchResults([])
    setAccountSearchTerm('')
  }

  // Clear selected account
  const handleClearAccount = () => {
    setFormData(prev => ({
      ...prev,
      existingAccountId: undefined,
      existingAccountName: undefined,
    }))
  }

  // Navigation
  const goToNextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  // Validate current step
  const isStepValid = (): boolean => {
    const currentStepData = STEPS[currentStep]
    if (!currentStepData) return false
    const step = currentStepData.id

    switch (step) {
      case 'account':
        if (formData.accountOption === 'create') {
          return formData.accountName.trim().length > 0
        }
        return !!formData.existingAccountId
      case 'contact':
        return (
          formData.firstName.trim().length > 0 &&
          formData.lastName.trim().length > 0
        )
      case 'opportunity':
        if (!formData.createOpportunity) return true
        return formData.opportunityName.trim().length > 0
      case 'review':
        return true
      default:
        return true
    }
  }

  // Handle conversion submission
  const handleConvert = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    const options: ConvertLeadOptions = {
      leadId: lead.id,
      accountOption: formData.accountOption,
      existingAccountId: formData.existingAccountId,
      accountData:
        formData.accountOption === 'create'
          ? {
              name: formData.accountName,
              account_type: 'household',
              account_status: 'prospect',
            }
          : undefined,
      contactData: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email || null,
        phone: formData.phone || null,
        expected_due_date: formData.expectedDueDate || null,
        lead_source: lead.lead_source,
        utm_source: lead.utm_source,
        utm_medium: lead.utm_medium,
        utm_campaign: lead.utm_campaign,
        referral_partner_id: lead.referral_partner_id,
      },
      createOpportunity: formData.createOpportunity,
      opportunityData: formData.createOpportunity
        ? {
            name: formData.opportunityName,
            stage: formData.opportunityStage,
            amount: formData.opportunityAmount
              ? parseFloat(formData.opportunityAmount)
              : undefined,
            close_date: formData.opportunityCloseDate || undefined,
            service_type: formData.serviceType || undefined,
          }
        : undefined,
    }

    const result = await convertLead(options)

    if (result.success && result.contactId) {
      router.push(`/admin/contacts/${result.contactId}`)
    } else {
      setSubmitError(result.error || 'Conversion failed')
      setIsSubmitting(false)
    }
  }

  // Render step content
  const renderStepContent = () => {
    const currentStepData = STEPS[currentStep]
    if (!currentStepData) return null
    const step = currentStepData.id

    switch (step) {
      case 'account':
        return (
          <AccountStep
            formData={formData}
            setFormData={setFormData}
            accountSearchTerm={accountSearchTerm}
            searchResults={searchResults}
            isSearching={isSearching}
            onSearch={handleAccountSearch}
            onSelectAccount={handleSelectAccount}
            onClearAccount={handleClearAccount}
          />
        )
      case 'contact':
        return <ContactStep formData={formData} setFormData={setFormData} />
      case 'opportunity':
        return <OpportunityStep formData={formData} setFormData={setFormData} />
      case 'review':
        return <ReviewStep formData={formData} lead={lead} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isCompleted = index < currentStep
            const isCurrent = index === currentStep

            return (
              <li
                key={step.id}
                className={cn(
                  'relative flex-1',
                  index !== STEPS.length - 1 && 'pr-8'
                )}
              >
                <div className="flex items-center">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                      isCompleted &&
                        'border-primary bg-primary text-primary-foreground',
                      isCurrent && 'border-primary bg-background text-primary',
                      !isCompleted &&
                        !isCurrent &&
                        'border-muted-foreground/30 bg-background text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'ml-3 text-sm font-medium',
                      isCurrent && 'text-primary',
                      !isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {index !== STEPS.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-10 top-5 -ml-px h-0.5 w-full',
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    )}
                    style={{ width: 'calc(100% - 2.5rem)' }}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Error message */}
      {submitError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Conversion failed
            </p>
            <p className="text-sm text-destructive/80">{submitError}</p>
          </div>
        </div>
      )}

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep]?.label ?? 'Step'}</CardTitle>
          <CardDescription>
            {STEPS[currentStep]?.id === 'account' &&
              'Choose to create a new account or link to an existing one'}
            {STEPS[currentStep]?.id === 'contact' &&
              'Review and customize the contact information'}
            {STEPS[currentStep]?.id === 'opportunity' &&
              'Optionally create an opportunity for this conversion'}
            {STEPS[currentStep]?.id === 'review' &&
              'Review all details before completing the conversion'}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStep === 0 || isSubmitting}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button onClick={goToNextStep} disabled={!isStepValid()}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleConvert}
            disabled={isSubmitting || !isStepValid()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Convert Lead
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

// =====================================================
// STEP: ACCOUNT
// =====================================================

interface AccountStepProps {
  formData: WizardFormData
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>
  accountSearchTerm: string
  searchResults: SearchedAccount[]
  isSearching: boolean
  onSearch: (term: string) => void
  onSelectAccount: (account: SearchedAccount) => void
  onClearAccount: () => void
}

function AccountStep({
  formData,
  setFormData,
  accountSearchTerm,
  searchResults,
  isSearching,
  onSearch,
  onSelectAccount,
  onClearAccount,
}: AccountStepProps) {
  return (
    <div className="space-y-6">
      <RadioGroup
        value={formData.accountOption}
        onValueChange={value =>
          setFormData(prev => ({
            ...prev,
            accountOption: value as 'create' | 'existing',
            existingAccountId:
              value === 'create' ? undefined : prev.existingAccountId,
            existingAccountName:
              value === 'create' ? undefined : prev.existingAccountName,
          }))
        }
      >
        {/* Create new account option */}
        <div className="flex items-start space-x-3 rounded-lg border p-4">
          <RadioGroupItem value="create" id="create" className="mt-1" />
          <div className="flex-1">
            <Label
              htmlFor="create"
              className="text-base font-medium cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create new account
              </div>
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              A new household account will be created for this client
            </p>

            {formData.accountOption === 'create' && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  value={formData.accountName}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      accountName: e.target.value,
                    }))
                  }
                  placeholder="e.g., The Smith Family"
                />
              </div>
            )}
          </div>
        </div>

        {/* Select existing account option */}
        <div className="flex items-start space-x-3 rounded-lg border p-4">
          <RadioGroupItem value="existing" id="existing" className="mt-1" />
          <div className="flex-1">
            <Label
              htmlFor="existing"
              className="text-base font-medium cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Link to existing account
              </div>
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Select an existing account (e.g., if this is a family member)
            </p>

            {formData.accountOption === 'existing' && (
              <div className="mt-4 space-y-3">
                {formData.existingAccountId ? (
                  <div className="flex items-center justify-between rounded-md border bg-muted/50 p-3">
                    <div>
                      <p className="font-medium">
                        {formData.existingAccountName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Selected account
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClearAccount}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={accountSearchTerm}
                        onChange={e => onSearch(e.target.value)}
                        placeholder="Search accounts by name..."
                        className="pl-9"
                      />
                    </div>

                    {isSearching && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    )}

                    {!isSearching && searchResults.length > 0 && (
                      <div className="max-h-48 overflow-auto rounded-md border">
                        {searchResults.map(account => (
                          <button
                            key={account.id}
                            type="button"
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 border-b last:border-b-0"
                            onClick={() => onSelectAccount(account)}
                          >
                            <div>
                              <p className="font-medium">{account.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {account.account_type} •{' '}
                                {account.account_status}
                                {account.primary_contact_name &&
                                  ` • ${account.primary_contact_name}`}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    )}

                    {!isSearching &&
                      accountSearchTerm &&
                      searchResults.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No accounts found matching &quot;{accountSearchTerm}
                          &quot;
                        </p>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </RadioGroup>
    </div>
  )
}

// =====================================================
// STEP: CONTACT
// =====================================================

interface ContactStepProps {
  formData: WizardFormData
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>
}

function ContactStep({ formData, setFormData }: ContactStepProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="firstName">
          First Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="firstName"
          value={formData.firstName}
          onChange={e =>
            setFormData(prev => ({ ...prev, firstName: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">
          Last Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="lastName"
          value={formData.lastName}
          onChange={e =>
            setFormData(prev => ({ ...prev, lastName: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={e =>
            setFormData(prev => ({ ...prev, email: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={e =>
            setFormData(prev => ({ ...prev, phone: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="expectedDueDate">Expected Due Date</Label>
        <Input
          id="expectedDueDate"
          type="date"
          value={formData.expectedDueDate}
          onChange={e =>
            setFormData(prev => ({ ...prev, expectedDueDate: e.target.value }))
          }
        />
      </div>
    </div>
  )
}

// =====================================================
// STEP: OPPORTUNITY
// =====================================================

interface OpportunityStepProps {
  formData: WizardFormData
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>
}

function OpportunityStep({ formData, setFormData }: OpportunityStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="createOpportunity"
          checked={formData.createOpportunity}
          onCheckedChange={checked =>
            setFormData(prev => ({
              ...prev,
              createOpportunity: checked === true,
            }))
          }
        />
        <Label htmlFor="createOpportunity" className="cursor-pointer">
          Create an opportunity for this conversion
        </Label>
      </div>

      {formData.createOpportunity && (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="space-y-2">
            <Label htmlFor="opportunityName">
              Opportunity Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="opportunityName"
              value={formData.opportunityName}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  opportunityName: e.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="opportunityStage">Stage</Label>
              <Select
                value={formData.opportunityStage}
                onValueChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    opportunityStage: value as OpportunityStage,
                  }))
                }
              >
                <SelectTrigger id="opportunityStage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualification">Qualification</SelectItem>
                  <SelectItem value="needs_analysis">Needs Analysis</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opportunityAmount">Amount</Label>
              <Input
                id="opportunityAmount"
                type="number"
                value={formData.opportunityAmount}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    opportunityAmount: e.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Input
                id="serviceType"
                value={formData.serviceType}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    serviceType: e.target.value,
                  }))
                }
                placeholder="e.g., Birth Doula, Postpartum"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="opportunityCloseDate">Expected Close Date</Label>
              <Input
                id="opportunityCloseDate"
                type="date"
                value={formData.opportunityCloseDate}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    opportunityCloseDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================
// STEP: REVIEW
// =====================================================

interface ReviewStepProps {
  formData: WizardFormData
  lead: CrmLead
}

function ReviewStep({ formData, lead }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Please review the following information before converting the lead.
      </p>

      {/* Lead info */}
      <div className="rounded-lg border p-4 bg-muted/30">
        <h4 className="font-medium flex items-center gap-2 mb-3">
          <User className="h-4 w-4" />
          Converting Lead
        </h4>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span>
              {lead.first_name} {lead.last_name}
            </span>
          </div>
          {lead.email && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{lead.email}</span>
            </div>
          )}
          {lead.lead_source && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source</span>
              <Badge variant="secondary">{lead.lead_source}</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Account */}
      <div className="rounded-lg border p-4">
        <h4 className="font-medium flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4" />
          Account
        </h4>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Action</span>
            <Badge variant="outline">
              {formData.accountOption === 'create'
                ? 'Create New'
                : 'Link Existing'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span>
              {formData.accountOption === 'create'
                ? formData.accountName
                : formData.existingAccountName}
            </span>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-lg border p-4">
        <h4 className="font-medium flex items-center gap-2 mb-3">
          <User className="h-4 w-4" />
          Contact
          <Badge variant="outline" className="ml-auto">
            Create New
          </Badge>
        </h4>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span>
              {formData.firstName} {formData.lastName}
            </span>
          </div>
          {formData.email && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{formData.email}</span>
            </div>
          )}
          {formData.phone && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{formData.phone}</span>
            </div>
          )}
          {formData.expectedDueDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date</span>
              <span>
                {new Date(formData.expectedDueDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Opportunity */}
      {formData.createOpportunity ? (
        <div className="rounded-lg border p-4">
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <Target className="h-4 w-4" />
            Opportunity
            <Badge variant="outline" className="ml-auto">
              Create New
            </Badge>
          </h4>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{formData.opportunityName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stage</span>
              <Badge variant="secondary">{formData.opportunityStage}</Badge>
            </div>
            {formData.opportunityAmount && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span>
                  ${parseFloat(formData.opportunityAmount).toLocaleString()}
                </span>
              </div>
            )}
            {formData.serviceType && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span>{formData.serviceType}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
          <Target className="h-5 w-5 mx-auto mb-2" />
          <p className="text-sm">No opportunity will be created</p>
        </div>
      )}
    </div>
  )
}

export type { LeadConversionWizardProps }

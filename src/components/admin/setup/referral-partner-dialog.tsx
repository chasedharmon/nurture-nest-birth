'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select-native'
import {
  createReferralPartner,
  updateReferralPartner,
} from '@/app/actions/referral-partners'
import type { ReferralPartner, ReferralPartnerType } from '@/lib/supabase/types'

const PARTNER_TYPE_OPTIONS: { value: ReferralPartnerType; label: string }[] = [
  { value: 'healthcare', label: 'Healthcare Provider' },
  { value: 'business', label: 'Business' },
  { value: 'individual', label: 'Individual' },
  { value: 'organization', label: 'Organization' },
  { value: 'other', label: 'Other' },
]

interface ReferralPartnerDialogProps {
  mode: 'create' | 'edit'
  partner?: ReferralPartner
  children: React.ReactNode
}

export function ReferralPartnerDialog({
  mode,
  partner,
  children,
}: ReferralPartnerDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Form state
  const [name, setName] = useState(partner?.name || '')
  const [email, setEmail] = useState(partner?.email || '')
  const [phone, setPhone] = useState(partner?.phone || '')
  const [businessName, setBusinessName] = useState(partner?.business_name || '')
  const [partnerType, setPartnerType] = useState<ReferralPartnerType>(
    partner?.partner_type || 'healthcare'
  )
  const [referralCode, setReferralCode] = useState(partner?.referral_code || '')
  const [specialization, setSpecialization] = useState(
    partner?.specialization || ''
  )
  const [notes, setNotes] = useState(partner?.notes || '')
  const [commissionPercent, setCommissionPercent] = useState(
    partner?.commission_percent?.toString() || ''
  )

  const resetForm = () => {
    if (mode === 'create') {
      setName('')
      setEmail('')
      setPhone('')
      setBusinessName('')
      setPartnerType('healthcare')
      setReferralCode('')
      setSpecialization('')
      setNotes('')
      setCommissionPercent('')
    } else if (partner) {
      setName(partner.name)
      setEmail(partner.email || '')
      setPhone(partner.phone || '')
      setBusinessName(partner.business_name || '')
      setPartnerType(partner.partner_type)
      setReferralCode(partner.referral_code || '')
      setSpecialization(partner.specialization || '')
      setNotes(partner.notes || '')
      setCommissionPercent(partner.commission_percent?.toString() || '')
    }
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Partner name is required')
      return
    }

    startTransition(async () => {
      try {
        const formData = {
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          business_name: businessName.trim() || undefined,
          partner_type: partnerType,
          referral_code: referralCode.trim() || undefined,
          specialization: specialization.trim() || undefined,
          notes: notes.trim() || undefined,
          commission_percent: commissionPercent
            ? parseFloat(commissionPercent)
            : undefined,
        }

        const result =
          mode === 'create'
            ? await createReferralPartner(formData)
            : await updateReferralPartner(partner!.id, formData)

        if (result.success) {
          setOpen(false)
          resetForm()
          router.refresh()
        } else {
          setError(result.error || 'Failed to save partner')
        }
      } catch {
        setError('An unexpected error occurred')
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        setOpen(isOpen)
        if (isOpen) resetForm()
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add Referral Partner' : 'Edit Partner'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new referral partner to track where your clients come from.'
              : 'Update the referral partner details.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Dr. Jane Smith"
              disabled={isPending}
            />
          </div>

          {/* Partner Type */}
          <div className="space-y-2">
            <Label htmlFor="partnerType">Partner Type</Label>
            <Select
              id="partnerType"
              value={partnerType}
              onChange={e =>
                setPartnerType(e.target.value as ReferralPartnerType)
              }
              disabled={isPending}
            >
              {PARTNER_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName">Business / Practice Name</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Kearney Women's Health"
              disabled={isPending}
            />
          </div>

          {/* Email & Phone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@example.com"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(308) 555-1234"
                disabled={isPending}
              />
            </div>
          </div>

          {/* Specialization */}
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              value={specialization}
              onChange={e => setSpecialization(e.target.value)}
              placeholder="OB/GYN, Midwifery, etc."
              disabled={isPending}
            />
          </div>

          {/* Referral Code & Commission */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="referralCode">Referral Code</Label>
              <Input
                id="referralCode"
                value={referralCode}
                onChange={e =>
                  setReferralCode(e.target.value.toUpperCase().slice(0, 10))
                }
                placeholder="DRSMITH"
                className="font-mono uppercase"
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated if left blank
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission">Commission %</Label>
              <Input
                id="commission"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={commissionPercent}
                onChange={e => setCommissionPercent(e.target.value)}
                placeholder="10"
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">For tracking only</p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes about this partner..."
              rows={3}
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Saving...'
                : mode === 'create'
                  ? 'Add Partner'
                  : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

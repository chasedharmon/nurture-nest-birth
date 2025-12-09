'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateCompanySettings } from '@/app/actions/setup'
import type { CompanySettings } from '@/lib/supabase/types'
import {
  Loader2,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Palette,
  Receipt,
  Clock,
  Save,
} from 'lucide-react'

interface CompanySettingsFormProps {
  settings: CompanySettings
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
]

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'CAD', label: 'Canadian Dollar (CA$)' },
  { value: 'EUR', label: 'Euro' },
  { value: 'GBP', label: 'British Pound' },
  { value: 'AUD', label: 'Australian Dollar' },
]

export function CompanySettingsForm({ settings }: CompanySettingsFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    // Basic Info
    company_name: settings.company_name,
    tagline: settings.tagline || '',
    legal_name: settings.legal_name || '',
    // Contact
    email: settings.email || '',
    phone: settings.phone || '',
    website: settings.website || '',
    // Address
    address_line1: settings.address_line1 || '',
    address_line2: settings.address_line2 || '',
    city: settings.city || '',
    state: settings.state || '',
    postal_code: settings.postal_code || '',
    country: settings.country,
    // Branding
    primary_color: settings.primary_color,
    secondary_color: settings.secondary_color,
    // Business
    timezone: settings.timezone,
    currency: settings.currency,
    // Invoice
    invoice_prefix: settings.invoice_prefix,
    invoice_footer: settings.invoice_footer || '',
    tax_rate: settings.tax_rate,
    tax_id: settings.tax_id || '',
    payment_terms: settings.payment_terms,
    // Portal
    portal_welcome_message: settings.portal_welcome_message || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updateCompanySettings({
        company_name: formData.company_name,
        tagline: formData.tagline || null,
        legal_name: formData.legal_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        website: formData.website || null,
        address_line1: formData.address_line1 || null,
        address_line2: formData.address_line2 || null,
        city: formData.city || null,
        state: formData.state || null,
        postal_code: formData.postal_code || null,
        country: formData.country,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        timezone: formData.timezone,
        currency: formData.currency,
        invoice_prefix: formData.invoice_prefix,
        invoice_footer: formData.invoice_footer || null,
        tax_rate: formData.tax_rate,
        tax_id: formData.tax_id || null,
        payment_terms: formData.payment_terms,
        portal_welcome_message: formData.portal_welcome_message || null,
      })

      if (result.success) {
        setSuccess(true)
        router.refresh()
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Failed to update settings')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-100 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
          Settings saved successfully!
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your business name and identity</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name *</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={e => updateField('company_name', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="legal_name">Legal Name</Label>
            <Input
              id="legal_name"
              placeholder="If different from company name"
              value={formData.legal_name}
              onChange={e => updateField('legal_name', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              placeholder="A short description of your business"
              value={formData.tagline}
              onChange={e => updateField('tagline', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How clients can reach you</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                Email
              </span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="hello@example.com"
              value={formData.email}
              onChange={e => updateField('email', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                Phone
              </span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={e => updateField('phone', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="website">
              <span className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                Website
              </span>
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://www.example.com"
              value={formData.website}
              onChange={e => updateField('website', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Business Address</CardTitle>
              <CardDescription>
                Appears on invoices and contracts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address_line1">Street Address</Label>
            <Input
              id="address_line1"
              placeholder="123 Main St"
              value={formData.address_line1}
              onChange={e => updateField('address_line1', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address_line2">Address Line 2</Label>
            <Input
              id="address_line2"
              placeholder="Suite 100"
              value={formData.address_line2}
              onChange={e => updateField('address_line2', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="City"
              value={formData.city}
              onChange={e => updateField('city', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State / Province</Label>
            <Input
              id="state"
              placeholder="State"
              value={formData.state}
              onChange={e => updateField('state', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input
              id="postal_code"
              placeholder="12345"
              value={formData.postal_code}
              onChange={e => updateField('postal_code', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={e => updateField('country', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Colors used throughout the app</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primary_color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary_color"
                value={formData.primary_color}
                onChange={e => updateField('primary_color', e.target.value)}
                className="flex-1"
              />
              <input
                type="color"
                value={formData.primary_color}
                onChange={e => updateField('primary_color', e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border border-input"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary_color">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondary_color"
                value={formData.secondary_color}
                onChange={e => updateField('secondary_color', e.target.value)}
                className="flex-1"
              />
              <input
                type="color"
                value={formData.secondary_color}
                onChange={e => updateField('secondary_color', e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border border-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Business Settings</CardTitle>
              <CardDescription>
                Timezone and currency preferences
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={value => updateField('timezone', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={value => updateField('currency', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(curr => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Invoice Settings</CardTitle>
              <CardDescription>Customize your invoice defaults</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invoice_prefix">Invoice Number Prefix</Label>
            <Input
              id="invoice_prefix"
              placeholder="INV"
              value={formData.invoice_prefix}
              onChange={e => updateField('invoice_prefix', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <Input
              id="payment_terms"
              placeholder="Net 30"
              value={formData.payment_terms}
              onChange={e => updateField('payment_terms', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_rate">Default Tax Rate (%)</Label>
            <Input
              id="tax_rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.tax_rate}
              onChange={e =>
                updateField('tax_rate', parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_id">Tax ID / EIN</Label>
            <Input
              id="tax_id"
              placeholder="XX-XXXXXXX"
              value={formData.tax_id}
              onChange={e => updateField('tax_id', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="invoice_footer">Invoice Footer</Label>
            <Textarea
              id="invoice_footer"
              placeholder="Thank you for your business!"
              rows={2}
              value={formData.invoice_footer}
              onChange={e => updateField('invoice_footer', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Client Portal */}
      <Card>
        <CardHeader>
          <CardTitle>Client Portal</CardTitle>
          <CardDescription>
            Customize the client portal experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="portal_welcome_message">Welcome Message</Label>
            <Textarea
              id="portal_welcome_message"
              placeholder="Welcome to your client portal! Here you can view your appointments, documents, and more."
              rows={3}
              value={formData.portal_welcome_message}
              onChange={e =>
                updateField('portal_welcome_message', e.target.value)
              }
            />
            <p className="text-xs text-muted-foreground">
              This message appears on the client portal dashboard
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  )
}

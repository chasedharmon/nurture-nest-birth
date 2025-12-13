'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Loader2 } from 'lucide-react'

import { createTenant } from '@/app/actions/super-admin'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * Create New Tenant Page
 *
 * Form for manually provisioning a new organization:
 * - Organization name
 * - URL slug
 * - Owner email
 * - Owner name (optional)
 * - Subscription tier
 */
export default function NewTenantPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [orgName, setOrgName] = useState('')
  const [slug, setSlug] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [tier, setTier] = useState<
    'starter' | 'professional' | 'business' | 'enterprise'
  >('starter')

  // Auto-generate slug from org name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 63)
  }

  const handleOrgNameChange = (value: string) => {
    setOrgName(value)
    // Only auto-generate if slug hasn't been manually edited
    if (!slug || slug === generateSlug(orgName)) {
      setSlug(generateSlug(value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await createTenant({
        orgName,
        slug,
        ownerEmail,
        ownerName: ownerName || undefined,
        tier,
      })

      if (result.success && result.data) {
        router.push(`/super-admin/tenants/${result.data.organizationId}`)
      } else {
        setError(result.error || 'Failed to create tenant')
      }
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back Link */}
      <Link
        href="/super-admin/tenants"
        className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="mr-2 size-4" />
        Back to Tenants
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Create New Tenant
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Manually provision a new organization on the platform
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Organization Details
          </CardTitle>
          <CardDescription>
            Fill in the details to create a new tenant. The owner will receive
            access to the organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name *</Label>
              <Input
                id="orgName"
                placeholder="Acme Doula Services"
                value={orgName}
                onChange={e => handleOrgNameChange(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500">
                The display name for this organization
              </p>
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                placeholder="acme-doula"
                value={slug}
                onChange={e =>
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  )
                }
                pattern="^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$"
                required
              />
              <p className="text-xs text-slate-500">
                Used in URLs: {slug || 'your-slug'}.birthcrm.app
              </p>
            </div>

            {/* Owner Email */}
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Owner Email *</Label>
              <Input
                id="ownerEmail"
                type="email"
                placeholder="owner@example.com"
                value={ownerEmail}
                onChange={e => setOwnerEmail(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500">
                The email address of the organization owner
              </p>
            </div>

            {/* Owner Name */}
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                placeholder="Jane Doe"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Optional: The name of the organization owner
              </p>
            </div>

            {/* Subscription Tier */}
            <div className="space-y-2">
              <Label htmlFor="tier">Subscription Tier</Label>
              <Select
                value={tier}
                onValueChange={value =>
                  setTier(
                    value as
                      | 'starter'
                      | 'professional'
                      | 'business'
                      | 'enterprise'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">
                    Starter — 1 member, 50 clients
                  </SelectItem>
                  <SelectItem value="professional">
                    Professional — 5 members, 200 clients
                  </SelectItem>
                  <SelectItem value="business">
                    Business — 15 members, 500 clients
                  </SelectItem>
                  <SelectItem value="enterprise">
                    Enterprise — Unlimited
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Organization will start with a 30-day trial
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-3 border-t pt-6">
              <Link href="/super-admin/tenants">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 size-4" />
                    Create Tenant
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

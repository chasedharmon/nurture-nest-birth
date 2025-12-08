'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Plus } from 'lucide-react'
import { createTeamMember } from '@/app/actions/team'
import type { TeamMemberRole } from '@/lib/supabase/types'

export function AddTeamMemberDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    phone: '',
    role: 'provider' as TeamMemberRole,
    title: '',
    bio: '',
    hourly_rate: '',
    is_accepting_clients: true,
    is_available_oncall: false,
    oncall_phone: '',
    certifications: '',
    specialties: '',
    show_email_to_clients: true,
    show_phone_to_clients: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await createTeamMember({
      display_name: formData.display_name,
      email: formData.email,
      phone: formData.phone || null,
      role: formData.role,
      title: formData.title || null,
      bio: formData.bio || null,
      hourly_rate: formData.hourly_rate
        ? parseFloat(formData.hourly_rate)
        : null,
      is_active: true,
      is_accepting_clients: formData.is_accepting_clients,
      is_available_oncall: formData.is_available_oncall,
      oncall_phone: formData.oncall_phone || null,
      certifications: formData.certifications
        ? formData.certifications.split(',').map(s => s.trim())
        : [],
      specialties: formData.specialties
        ? formData.specialties.split(',').map(s => s.trim())
        : [],
      show_email_to_clients: formData.show_email_to_clients,
      show_phone_to_clients: formData.show_phone_to_clients,
      avatar_url: null,
      max_active_clients: null,
      user_id: null,
    })

    setIsLoading(false)

    if (result.success) {
      setOpen(false)
      router.refresh()
      // Reset form
      setFormData({
        display_name: '',
        email: '',
        phone: '',
        role: 'provider',
        title: '',
        bio: '',
        hourly_rate: '',
        is_accepting_clients: true,
        is_available_oncall: false,
        oncall_phone: '',
        certifications: '',
        specialties: '',
        show_email_to_clients: true,
        show_phone_to_clients: true,
      })
    } else {
      setError(result.error || 'Failed to create team member')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new provider or team member to your practice.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Full Name *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={e =>
                    setFormData({ ...formData, display_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: TeamMemberRole) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="provider">Provider</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={e =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Birth Doula"
                  value={formData.title}
                  onChange={e =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourly_rate}
                  onChange={e =>
                    setFormData({ ...formData, hourly_rate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={3}
                value={formData.bio}
                onChange={e =>
                  setFormData({ ...formData, bio: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="certifications">
                  Certifications (comma-separated)
                </Label>
                <Input
                  id="certifications"
                  placeholder="DONA, IBCLC"
                  value={formData.certifications}
                  onChange={e =>
                    setFormData({ ...formData, certifications: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialties">
                  Specialties (comma-separated)
                </Label>
                <Input
                  id="specialties"
                  placeholder="VBAC, Multiples"
                  value={formData.specialties}
                  onChange={e =>
                    setFormData({ ...formData, specialties: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="font-medium">Availability</h4>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_accepting_clients"
                  checked={formData.is_accepting_clients}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({ ...formData, is_accepting_clients: checked })
                  }
                />
                <Label htmlFor="is_accepting_clients">
                  Accepting new clients
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_available_oncall"
                  checked={formData.is_available_oncall}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({ ...formData, is_available_oncall: checked })
                  }
                />
                <Label htmlFor="is_available_oncall">
                  Available for on-call shifts
                </Label>
              </div>
              {formData.is_available_oncall && (
                <div className="mt-2 space-y-2">
                  <Label htmlFor="oncall_phone">On-Call Phone</Label>
                  <Input
                    id="oncall_phone"
                    type="tel"
                    placeholder="Leave blank to use main phone"
                    value={formData.oncall_phone}
                    onChange={e =>
                      setFormData({ ...formData, oncall_phone: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            {/* Client Visibility */}
            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="font-medium">Client Portal Visibility</h4>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show_email_to_clients"
                  checked={formData.show_email_to_clients}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({ ...formData, show_email_to_clients: checked })
                  }
                />
                <Label htmlFor="show_email_to_clients">
                  Show email to clients
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show_phone_to_clients"
                  checked={formData.show_phone_to_clients}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({ ...formData, show_phone_to_clients: checked })
                  }
                />
                <Label htmlFor="show_phone_to_clients">
                  Show phone to clients
                </Label>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Team Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

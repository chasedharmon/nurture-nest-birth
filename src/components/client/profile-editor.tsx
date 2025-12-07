'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import {
  updateContactInfo,
  updateAddress,
  updateBirthPreferences,
  updateMedicalInfo,
  updateEmergencyContact,
  updateDueDate,
} from '@/app/actions/client-profile'
import {
  User,
  MapPin,
  Heart,
  Stethoscope,
  Phone,
  Calendar,
  Check,
  Pencil,
  X,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface ClientData {
  id: string
  name: string
  email: string
  phone?: string
  partner_name?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
  }
  expected_due_date?: string
  actual_birth_date?: string
  birth_preferences?: {
    location?: string
    birth_plan?: string
    special_requests?: string
  }
  medical_info?: {
    obgyn?: string
    hospital?: string
    insurance?: string
  }
  emergency_contact?: {
    name?: string
    phone?: string
    relationship?: string
  }
  client_type?: string
  lifecycle_stage?: string
  last_login_at?: string
}

interface ProfileEditorProps {
  client: ClientData
}

// Styled Input component matching the intake form aesthetic
const StyledInput = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  className,
}: {
  label?: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) => (
  <div className={cn('space-y-2', className)}>
    {label && (
      <Label className="text-sm font-medium text-stone-600">{label}</Label>
    )}
    <Input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="border-stone-200 bg-white/80 focus:border-[#b5a48b] focus:ring-[#b5a48b]/20 rounded-xl"
    />
  </div>
)

// Styled Textarea component
const StyledTextarea = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}) => (
  <div className="space-y-2">
    {label && (
      <Label className="text-sm font-medium text-stone-600">{label}</Label>
    )}
    <Textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="border-stone-200 bg-white/80 focus:border-[#b5a48b] focus:ring-[#b5a48b]/20 rounded-xl resize-none"
    />
  </div>
)

// Section Card component with edit capabilities
interface EditableSectionProps {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
  editForm: React.ReactNode
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  isSaving: boolean
}

const EditableSection = ({
  title,
  description,
  icon,
  children,
  editForm,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  isSaving,
}: EditableSectionProps) => (
  <motion.div layout>
    <Card className="bg-white/90 backdrop-blur-sm border-stone-200 shadow-sm overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#f5f0e8] rounded-xl text-[#8b7355]">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg text-stone-800">{title}</CardTitle>
              <CardDescription className="text-stone-500">
                {description}
              </CardDescription>
            </div>
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="text-[#8b7355] hover:bg-[#f5f0e8] hover:text-[#6b5a45]"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-4"
            >
              {editForm}
              <div className="flex gap-3 pt-4 border-t border-stone-100">
                <Button
                  onClick={onSave}
                  disabled={isSaving}
                  className="bg-[#8b7355] hover:bg-[#6b5a45] text-white rounded-xl"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="border-stone-300 text-stone-600 hover:bg-stone-50 rounded-xl"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  </motion.div>
)

// Display field component
const DisplayField = ({
  label,
  value,
}: {
  label: string
  value?: string | null
}) => (
  <div>
    <p className="text-sm font-medium text-stone-500">{label}</p>
    <p className="text-stone-800 mt-1">{value || 'Not provided'}</p>
  </div>
)

export function ProfileEditor({ client }: ProfileEditorProps) {
  const [isPending, startTransition] = useTransition()
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Form state for each section
  const [contactForm, setContactForm] = useState({
    name: client.name || '',
    phone: client.phone || '',
    partnerName: client.partner_name || '',
  })

  const [addressForm, setAddressForm] = useState({
    street: client.address?.street || '',
    city: client.address?.city || '',
    state: client.address?.state || '',
    zip: client.address?.zip || '',
  })

  const [dueDateForm, setDueDateForm] = useState({
    dueDate: client.expected_due_date || '',
  })

  const [medicalForm, setMedicalForm] = useState({
    obgyn: client.medical_info?.obgyn || '',
    hospital: client.medical_info?.hospital || '',
    insurance: client.medical_info?.insurance || '',
  })

  const [birthPrefsForm, setBirthPrefsForm] = useState({
    location: client.birth_preferences?.location || '',
    birthPlanNotes: client.birth_preferences?.birth_plan || '',
    specialRequests: client.birth_preferences?.special_requests || '',
  })

  const [emergencyForm, setEmergencyForm] = useState({
    name: client.emergency_contact?.name || '',
    phone: client.emergency_contact?.phone || '',
    relationship: client.emergency_contact?.relationship || '',
  })

  const handleSave = async (
    section: string,
    saveFn: () => Promise<{ success: boolean; error?: string }>
  ) => {
    setSaveError(null)
    setSaveSuccess(null)

    startTransition(async () => {
      const result = await saveFn()
      if (result.success) {
        setSaveSuccess(section)
        setEditingSection(null)
        setTimeout(() => setSaveSuccess(null), 3000)
      } else {
        setSaveError(result.error || 'Failed to save changes')
      }
    })
  }

  const cancelEdit = (section: string) => {
    setEditingSection(null)
    setSaveError(null)

    // Reset form to original values
    switch (section) {
      case 'contact':
        setContactForm({
          name: client.name || '',
          phone: client.phone || '',
          partnerName: client.partner_name || '',
        })
        break
      case 'address':
        setAddressForm({
          street: client.address?.street || '',
          city: client.address?.city || '',
          state: client.address?.state || '',
          zip: client.address?.zip || '',
        })
        break
      case 'dueDate':
        setDueDateForm({
          dueDate: client.expected_due_date || '',
        })
        break
      case 'medical':
        setMedicalForm({
          obgyn: client.medical_info?.obgyn || '',
          hospital: client.medical_info?.hospital || '',
          insurance: client.medical_info?.insurance || '',
        })
        break
      case 'birthPrefs':
        setBirthPrefsForm({
          location: client.birth_preferences?.location || '',
          birthPlanNotes: client.birth_preferences?.birth_plan || '',
          specialRequests: client.birth_preferences?.special_requests || '',
        })
        break
      case 'emergency':
        setEmergencyForm({
          name: client.emergency_contact?.name || '',
          phone: client.emergency_contact?.phone || '',
          relationship: client.emergency_contact?.relationship || '',
        })
        break
    }
  }

  // US States for select
  const usStates = [
    'AL',
    'AK',
    'AZ',
    'AR',
    'CA',
    'CO',
    'CT',
    'DE',
    'FL',
    'GA',
    'HI',
    'ID',
    'IL',
    'IN',
    'IA',
    'KS',
    'KY',
    'LA',
    'ME',
    'MD',
    'MA',
    'MI',
    'MN',
    'MS',
    'MO',
    'MT',
    'NE',
    'NV',
    'NH',
    'NJ',
    'NM',
    'NY',
    'NC',
    'ND',
    'OH',
    'OK',
    'OR',
    'PA',
    'RI',
    'SC',
    'SD',
    'TN',
    'TX',
    'UT',
    'VT',
    'VA',
    'WA',
    'WV',
    'WI',
    'WY',
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Your Profile</h1>
          <p className="text-stone-600 mt-2">
            View and update your personal information
          </p>
        </div>
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-200"
            >
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">Changes saved</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200"
          >
            <p className="text-sm font-medium">{saveError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Information */}
      <EditableSection
        title="Contact Information"
        description="Your basic contact details"
        icon={<User className="h-5 w-5" />}
        isEditing={editingSection === 'contact'}
        onEdit={() => setEditingSection('contact')}
        onCancel={() => cancelEdit('contact')}
        onSave={() =>
          handleSave('contact', () =>
            updateContactInfo({
              name: contactForm.name,
              email: client.email,
              phone: contactForm.phone,
              partnerName: contactForm.partnerName,
            })
          )
        }
        isSaving={isPending && editingSection === 'contact'}
        editForm={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StyledInput
              label="Full Name"
              value={contactForm.name}
              onChange={value => setContactForm(f => ({ ...f, name: value }))}
              placeholder="Your full name"
            />
            <StyledInput
              label="Email"
              type="email"
              value={client.email}
              onChange={() => {}}
              placeholder="Email cannot be changed"
              className="opacity-60"
            />
            <StyledInput
              label="Phone Number"
              type="tel"
              value={contactForm.phone}
              onChange={value => setContactForm(f => ({ ...f, phone: value }))}
              placeholder="(555) 123-4567"
            />
            <StyledInput
              label="Partner's Name"
              value={contactForm.partnerName}
              onChange={value =>
                setContactForm(f => ({ ...f, partnerName: value }))
              }
              placeholder="Optional"
            />
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DisplayField label="Name" value={client.name} />
          <DisplayField label="Email" value={client.email} />
          <DisplayField label="Phone" value={client.phone} />
          <DisplayField label="Partner's Name" value={client.partner_name} />
        </div>
      </EditableSection>

      {/* Address */}
      <EditableSection
        title="Address"
        description="Your home address"
        icon={<MapPin className="h-5 w-5" />}
        isEditing={editingSection === 'address'}
        onEdit={() => setEditingSection('address')}
        onCancel={() => cancelEdit('address')}
        onSave={() =>
          handleSave('address', () =>
            updateAddress({
              street: addressForm.street,
              city: addressForm.city,
              state: addressForm.state,
              zip: addressForm.zip,
            })
          )
        }
        isSaving={isPending && editingSection === 'address'}
        editForm={
          <div className="space-y-4">
            <StyledInput
              label="Street Address"
              value={addressForm.street}
              onChange={value => setAddressForm(f => ({ ...f, street: value }))}
              placeholder="123 Main Street"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StyledInput
                label="City"
                value={addressForm.city}
                onChange={value => setAddressForm(f => ({ ...f, city: value }))}
                placeholder="City"
                className="col-span-2"
              />
              <div className="space-y-2">
                <Label className="text-sm font-medium text-stone-600">
                  State
                </Label>
                <Select
                  value={addressForm.state}
                  onValueChange={(value: string) =>
                    setAddressForm(f => ({ ...f, state: value }))
                  }
                >
                  <SelectTrigger className="border-stone-200 bg-white/80 focus:border-[#b5a48b] focus:ring-[#b5a48b]/20 rounded-xl">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {usStates.map(state => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <StyledInput
                label="ZIP Code"
                value={addressForm.zip}
                onChange={value => setAddressForm(f => ({ ...f, zip: value }))}
                placeholder="12345"
              />
            </div>
          </div>
        }
      >
        <div className="text-stone-800">
          {client.address?.street ||
          client.address?.city ||
          client.address?.state ||
          client.address?.zip ? (
            <div className="space-y-1">
              {client.address.street && <p>{client.address.street}</p>}
              {(client.address.city ||
                client.address.state ||
                client.address.zip) && (
                <p>
                  {client.address.city && `${client.address.city}, `}
                  {client.address.state && `${client.address.state} `}
                  {client.address.zip}
                </p>
              )}
            </div>
          ) : (
            <p className="text-stone-500">No address provided</p>
          )}
        </div>
      </EditableSection>

      {/* Due Date & Medical */}
      <EditableSection
        title="Birth & Medical Information"
        description="Important dates and healthcare details"
        icon={<Calendar className="h-5 w-5" />}
        isEditing={editingSection === 'medical'}
        onEdit={() => setEditingSection('medical')}
        onCancel={() => cancelEdit('medical')}
        onSave={async () => {
          // Save both due date and medical info
          const dueDateResult = await updateDueDate(dueDateForm.dueDate || null)
          if (!dueDateResult.success) {
            return dueDateResult
          }
          return handleSave('medical', () =>
            updateMedicalInfo({
              obgyn: medicalForm.obgyn,
              hospital: medicalForm.hospital,
              insurance: medicalForm.insurance,
            })
          )
        }}
        isSaving={isPending && editingSection === 'medical'}
        editForm={
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-stone-600">
                  Expected Due Date
                </Label>
                <Input
                  type="date"
                  value={dueDateForm.dueDate}
                  onChange={e => setDueDateForm({ dueDate: e.target.value })}
                  className="border-stone-200 bg-white/80 focus:border-[#b5a48b] focus:ring-[#b5a48b]/20 rounded-xl"
                />
              </div>
            </div>
            <div className="pt-4 border-t border-stone-100">
              <p className="text-sm font-medium text-stone-600 mb-4">
                Healthcare Providers
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StyledInput
                  label="OB/GYN or Midwife"
                  value={medicalForm.obgyn}
                  onChange={value =>
                    setMedicalForm(f => ({ ...f, obgyn: value }))
                  }
                  placeholder="Dr. Smith"
                />
                <StyledInput
                  label="Hospital or Birth Center"
                  value={medicalForm.hospital}
                  onChange={value =>
                    setMedicalForm(f => ({ ...f, hospital: value }))
                  }
                  placeholder="General Hospital"
                />
                <StyledInput
                  label="Insurance Provider"
                  value={medicalForm.insurance}
                  onChange={value =>
                    setMedicalForm(f => ({ ...f, insurance: value }))
                  }
                  placeholder="Blue Cross Blue Shield"
                  className="md:col-span-2"
                />
              </div>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DisplayField
            label="Expected Due Date"
            value={
              client.expected_due_date
                ? format(new Date(client.expected_due_date), 'MMMM d, yyyy')
                : undefined
            }
          />
          {client.actual_birth_date && (
            <DisplayField
              label="Birth Date"
              value={format(new Date(client.actual_birth_date), 'MMMM d, yyyy')}
            />
          )}
          <DisplayField
            label="OB/GYN or Midwife"
            value={client.medical_info?.obgyn}
          />
          <DisplayField
            label="Hospital/Birth Center"
            value={client.medical_info?.hospital}
          />
          <DisplayField
            label="Insurance Provider"
            value={client.medical_info?.insurance}
          />
        </div>
      </EditableSection>

      {/* Birth Preferences */}
      <EditableSection
        title="Birth Preferences"
        description="Your birth plan and wishes"
        icon={<Heart className="h-5 w-5" />}
        isEditing={editingSection === 'birthPrefs'}
        onEdit={() => setEditingSection('birthPrefs')}
        onCancel={() => cancelEdit('birthPrefs')}
        onSave={() =>
          handleSave('birthPrefs', () =>
            updateBirthPreferences({
              location: birthPrefsForm.location,
              birthPlanNotes: birthPrefsForm.birthPlanNotes,
              specialRequests: birthPrefsForm.specialRequests,
            })
          )
        }
        isSaving={isPending && editingSection === 'birthPrefs'}
        editForm={
          <div className="space-y-4">
            <StyledInput
              label="Preferred Birth Location"
              value={birthPrefsForm.location}
              onChange={value =>
                setBirthPrefsForm(f => ({ ...f, location: value }))
              }
              placeholder="Hospital, birth center, or home"
            />
            <StyledTextarea
              label="Birth Plan Notes"
              value={birthPrefsForm.birthPlanNotes}
              onChange={value =>
                setBirthPrefsForm(f => ({ ...f, birthPlanNotes: value }))
              }
              placeholder="Describe your ideal birth experience, pain management preferences, etc."
              rows={4}
            />
            <StyledTextarea
              label="Special Requests"
              value={birthPrefsForm.specialRequests}
              onChange={value =>
                setBirthPrefsForm(f => ({ ...f, specialRequests: value }))
              }
              placeholder="Any special accommodations or requests for your doula"
              rows={3}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <DisplayField
            label="Preferred Birth Location"
            value={client.birth_preferences?.location}
          />
          {client.birth_preferences?.birth_plan && (
            <div>
              <p className="text-sm font-medium text-stone-500">
                Birth Plan Notes
              </p>
              <p className="text-stone-800 mt-1 whitespace-pre-wrap">
                {client.birth_preferences.birth_plan}
              </p>
            </div>
          )}
          {client.birth_preferences?.special_requests && (
            <div>
              <p className="text-sm font-medium text-stone-500">
                Special Requests
              </p>
              <p className="text-stone-800 mt-1 whitespace-pre-wrap">
                {client.birth_preferences.special_requests}
              </p>
            </div>
          )}
          {!client.birth_preferences?.location &&
            !client.birth_preferences?.birth_plan &&
            !client.birth_preferences?.special_requests && (
              <p className="text-stone-500">
                No birth preferences specified yet
              </p>
            )}
        </div>
      </EditableSection>

      {/* Emergency Contact */}
      <EditableSection
        title="Emergency Contact"
        description="Person to contact in case of emergency"
        icon={<Phone className="h-5 w-5" />}
        isEditing={editingSection === 'emergency'}
        onEdit={() => setEditingSection('emergency')}
        onCancel={() => cancelEdit('emergency')}
        onSave={() =>
          handleSave('emergency', () =>
            updateEmergencyContact({
              name: emergencyForm.name,
              phone: emergencyForm.phone,
              relationship: emergencyForm.relationship,
            })
          )
        }
        isSaving={isPending && editingSection === 'emergency'}
        editForm={
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StyledInput
              label="Contact Name"
              value={emergencyForm.name}
              onChange={value => setEmergencyForm(f => ({ ...f, name: value }))}
              placeholder="Full name"
            />
            <StyledInput
              label="Phone Number"
              type="tel"
              value={emergencyForm.phone}
              onChange={value =>
                setEmergencyForm(f => ({ ...f, phone: value }))
              }
              placeholder="(555) 123-4567"
            />
            <StyledInput
              label="Relationship"
              value={emergencyForm.relationship}
              onChange={value =>
                setEmergencyForm(f => ({ ...f, relationship: value }))
              }
              placeholder="Spouse, parent, etc."
            />
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DisplayField label="Name" value={client.emergency_contact?.name} />
          <DisplayField label="Phone" value={client.emergency_contact?.phone} />
          <DisplayField
            label="Relationship"
            value={client.emergency_contact?.relationship}
          />
        </div>
        {!client.emergency_contact?.name &&
          !client.emergency_contact?.phone && (
            <p className="text-stone-500 mt-2">No emergency contact provided</p>
          )}
      </EditableSection>

      {/* Account Status - Read Only */}
      <Card className="bg-stone-50/50 backdrop-blur-sm border-stone-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#f5f0e8] rounded-xl text-[#8b7355]">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg text-stone-800">
                Account Information
              </CardTitle>
              <CardDescription className="text-stone-500">
                Your account status and history
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DisplayField
              label="Client Type"
              value={
                client.client_type
                  ?.replace('_', ' ')
                  .replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Client'
              }
            />
            <DisplayField
              label="Stage"
              value={
                client.lifecycle_stage
                  ?.replace('_', ' ')
                  .replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Active'
              }
            />
            <DisplayField
              label="Last Login"
              value={
                client.last_login_at
                  ? format(
                      new Date(client.last_login_at),
                      'MMM d, yyyy • h:mm a'
                    )
                  : 'First visit'
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

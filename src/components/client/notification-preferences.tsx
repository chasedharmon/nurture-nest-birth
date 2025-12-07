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
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Bell,
  Calendar,
  FileText,
  CreditCard,
  Mail,
  Check,
  Loader2,
} from 'lucide-react'
import { updateNotificationPreferences } from '@/app/actions/notifications'

interface NotificationPreferencesProps {
  clientId: string
  initialPreferences: {
    meeting_reminders: boolean
    document_notifications: boolean
    payment_reminders: boolean
    marketing_emails: boolean
  }
}

export function NotificationPreferences({
  clientId,
  initialPreferences,
}: NotificationPreferencesProps) {
  const [isPending, startTransition] = useTransition()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [preferences, setPreferences] = useState(initialPreferences)

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = () => {
    setSaveError(null)
    setSaveSuccess(false)

    startTransition(async () => {
      const result = await updateNotificationPreferences(clientId, preferences)

      if (result.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setSaveError(result.error || 'Failed to save preferences')
      }
    })
  }

  const hasChanges =
    preferences.meeting_reminders !== initialPreferences.meeting_reminders ||
    preferences.document_notifications !==
      initialPreferences.document_notifications ||
    preferences.payment_reminders !== initialPreferences.payment_reminders ||
    preferences.marketing_emails !== initialPreferences.marketing_emails

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-stone-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#f5f0e8] rounded-xl text-[#8b7355]">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg text-stone-800">
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-stone-500">
                Choose how you&apos;d like to hear from us
              </CardDescription>
            </div>
          </div>
          <AnimatePresence>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200"
              >
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Saved</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Alert */}
        <AnimatePresence>
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200"
            >
              <p className="text-sm">{saveError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification Options */}
        <div className="space-y-4">
          {/* Meeting Reminders */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-[#8b7355]" />
              <div>
                <Label
                  htmlFor="meeting-reminders"
                  className="text-sm font-medium text-stone-800 cursor-pointer"
                >
                  Meeting Reminders
                </Label>
                <p className="text-xs text-stone-500 mt-0.5">
                  Receive reminders 24 hours before appointments
                </p>
              </div>
            </div>
            <Switch
              id="meeting-reminders"
              checked={preferences.meeting_reminders}
              onCheckedChange={() => handleToggle('meeting_reminders')}
              className="data-[state=checked]:bg-[#8b7355]"
            />
          </div>

          {/* Document Notifications */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#8b7355]" />
              <div>
                <Label
                  htmlFor="document-notifications"
                  className="text-sm font-medium text-stone-800 cursor-pointer"
                >
                  Document Notifications
                </Label>
                <p className="text-xs text-stone-500 mt-0.5">
                  Get notified when new documents are shared
                </p>
              </div>
            </div>
            <Switch
              id="document-notifications"
              checked={preferences.document_notifications}
              onCheckedChange={() => handleToggle('document_notifications')}
              className="data-[state=checked]:bg-[#8b7355]"
            />
          </div>

          {/* Payment Reminders */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-[#8b7355]" />
              <div>
                <Label
                  htmlFor="payment-reminders"
                  className="text-sm font-medium text-stone-800 cursor-pointer"
                >
                  Payment Confirmations
                </Label>
                <p className="text-xs text-stone-500 mt-0.5">
                  Receive receipts when payments are processed
                </p>
              </div>
            </div>
            <Switch
              id="payment-reminders"
              checked={preferences.payment_reminders}
              onCheckedChange={() => handleToggle('payment_reminders')}
              className="data-[state=checked]:bg-[#8b7355]"
            />
          </div>

          {/* Marketing Emails */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#8b7355]" />
              <div>
                <Label
                  htmlFor="marketing-emails"
                  className="text-sm font-medium text-stone-800 cursor-pointer"
                >
                  Newsletter & Updates
                </Label>
                <p className="text-xs text-stone-500 mt-0.5">
                  Tips, resources, and occasional updates
                </p>
              </div>
            </div>
            <Switch
              id="marketing-emails"
              checked={preferences.marketing_emails}
              onCheckedChange={() => handleToggle('marketing_emails')}
              className="data-[state=checked]:bg-[#8b7355]"
            />
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-2"
          >
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="w-full bg-[#8b7355] hover:bg-[#6b5a45] text-white rounded-xl"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

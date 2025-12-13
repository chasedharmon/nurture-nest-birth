import { Construction } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * Super-Admin Settings Page
 *
 * Placeholder for future platform-wide settings:
 * - Platform branding
 * - Default tenant settings
 * - Admin user management
 * - Feature flags
 */
export default function SuperAdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Platform Settings
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Configure platform-wide settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="size-5 text-amber-500" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            Platform settings will be available in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Planned features for this section:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
            <li>Platform branding and theming</li>
            <li>Default settings for new tenants</li>
            <li>Platform admin user management</li>
            <li>Feature flags and toggles</li>
            <li>Email and notification settings</li>
            <li>API rate limits configuration</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

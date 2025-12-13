'use client'

import { useState } from 'react'
import {
  Building2,
  Users,
  UserPlus,
  Target,
  Activity,
  MessageSquare,
  BarChart3,
  LayoutDashboard,
  Workflow,
  Users2,
  Settings,
  File,
  Box,
  Briefcase,
  Calendar,
  ClipboardList,
  Database,
  FileSpreadsheet,
  Folder,
  Heart,
  Home,
  MapPin,
  Package,
  Star,
  Tag,
  Zap,
  User,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface IconPickerProps {
  value: string
  onChange: (value: string) => void
}

const AVAILABLE_ICONS: Array<{ name: string; icon: LucideIcon }> = [
  { name: 'building-2', icon: Building2 },
  { name: 'users', icon: Users },
  { name: 'user-plus', icon: UserPlus },
  { name: 'user', icon: User },
  { name: 'users-2', icon: Users2 },
  { name: 'target', icon: Target },
  { name: 'activity', icon: Activity },
  { name: 'message-square', icon: MessageSquare },
  { name: 'bar-chart-3', icon: BarChart3 },
  { name: 'trending-up', icon: TrendingUp },
  { name: 'layout-dashboard', icon: LayoutDashboard },
  { name: 'workflow', icon: Workflow },
  { name: 'settings', icon: Settings },
  { name: 'file', icon: File },
  { name: 'folder', icon: Folder },
  { name: 'file-spreadsheet', icon: FileSpreadsheet },
  { name: 'clipboard-list', icon: ClipboardList },
  { name: 'box', icon: Box },
  { name: 'package', icon: Package },
  { name: 'briefcase', icon: Briefcase },
  { name: 'calendar', icon: Calendar },
  { name: 'database', icon: Database },
  { name: 'heart', icon: Heart },
  { name: 'home', icon: Home },
  { name: 'map-pin', icon: MapPin },
  { name: 'star', icon: Star },
  { name: 'tag', icon: Tag },
  { name: 'zap', icon: Zap },
]

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)

  // Find current icon
  const currentIcon = AVAILABLE_ICONS.find(
    i =>
      i.name === value || i.name === value.toLowerCase().replace(/[-_]/g, '-')
  )
  const CurrentIconComponent = currentIcon?.icon || File

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <CurrentIconComponent className="h-4 w-4" />
          <span className="text-sm">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-2">
          <p className="text-sm font-medium">Choose an icon</p>
          <div className="grid grid-cols-7 gap-1">
            {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
              <Button
                key={name}
                variant="ghost"
                size="icon"
                className={cn(
                  'h-9 w-9',
                  value === name &&
                    'bg-primary text-primary-foreground ring-2 ring-primary'
                )}
                onClick={() => {
                  onChange(name)
                  setOpen(false)
                }}
                aria-pressed={value === name}
                aria-label={`Select ${name} icon`}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

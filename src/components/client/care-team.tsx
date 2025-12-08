import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, Phone, User } from 'lucide-react'
import type { AssignmentRole } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface CareTeamProvider {
  id: string
  display_name: string
  title?: string | null
  bio?: string | null
  avatar_url?: string | null
  certifications?: string[] | null
  specialties?: string[] | null
  email?: string | null
  phone?: string | null
  oncall_phone?: string | null
}

interface CareTeamMember {
  id: string
  assignment_role: AssignmentRole
  notes?: string | null
  provider: CareTeamProvider
}

interface CareTeamProps {
  careTeam: CareTeamMember[]
}

const roleLabels: Record<AssignmentRole, string> = {
  primary: 'Primary Provider',
  backup: 'Backup Provider',
  support: 'Support',
}

const roleColors: Record<AssignmentRole, string> = {
  primary: 'bg-primary/10 text-primary',
  backup: 'bg-secondary/10 text-secondary',
  support: 'bg-muted text-muted-foreground',
}

export function CareTeam({ careTeam }: CareTeamProps) {
  if (careTeam.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Care Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your care team hasn&apos;t been assigned yet. We&apos;ll update this
            once your providers are confirmed.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Your Care Team
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {careTeam.map(member => (
          <div
            key={member.id}
            className={cn(
              'flex flex-col sm:flex-row gap-4 p-4 rounded-lg bg-muted/50',
              'transition-all duration-200 hover:bg-muted/70 hover:shadow-sm'
            )}
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {member.provider.avatar_url ? (
                <img
                  src={member.provider.avatar_url}
                  alt={member.provider.display_name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-medium">
                  {member.provider.display_name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-lg">
                  {member.provider.display_name}
                </h3>
                <Badge
                  variant="secondary"
                  className={roleColors[member.assignment_role]}
                >
                  {roleLabels[member.assignment_role]}
                </Badge>
              </div>

              {member.provider.title && (
                <p className="text-muted-foreground">{member.provider.title}</p>
              )}

              {member.provider.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {member.provider.bio}
                </p>
              )}

              {/* Certifications */}
              {member.provider.certifications &&
                member.provider.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {member.provider.certifications.map((cert, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                )}

              {/* Specialties */}
              {member.provider.specialties &&
                member.provider.specialties.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Specialties: {member.provider.specialties.join(', ')}
                  </p>
                )}

              {/* Contact Buttons - Prominent with proper touch targets */}
              {(member.provider.email || member.provider.phone) && (
                <div className="flex flex-wrap gap-2 pt-3">
                  {member.provider.email && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-10 min-w-[44px] gap-2 transition-all duration-200 hover:bg-primary/10 hover:border-primary"
                    >
                      <a href={`mailto:${member.provider.email}`}>
                        <Mail className="h-4 w-4" />
                        <span className="hidden sm:inline">Email</span>
                      </a>
                    </Button>
                  )}
                  {member.provider.phone && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-10 min-w-[44px] gap-2 transition-all duration-200 hover:bg-primary/10 hover:border-primary"
                    >
                      <a href={`tel:${member.provider.phone}`}>
                        <Phone className="h-4 w-4" />
                        <span className="hidden sm:inline">Call</span>
                      </a>
                    </Button>
                  )}
                </div>
              )}

              {/* Notes from admin */}
              {member.notes && (
                <p className="text-xs text-muted-foreground italic pt-1">
                  {member.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

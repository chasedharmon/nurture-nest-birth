import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Package, Plus, FileText, Clock } from 'lucide-react'
import { WelcomePacketDialog } from '@/components/admin/setup/welcome-packet-dialog'
import { WelcomePacketItemsDialog } from '@/components/admin/setup/welcome-packet-items-dialog'
import { WelcomePacketActions } from './welcome-packet-actions'
import type { WelcomePacketWithItemCount } from '@/lib/supabase/types'

const triggerLabels: Record<string, string> = {
  contract_signed: 'Contract Signed',
  lead_converted: 'Lead Converted',
  manual: 'Manual Trigger',
}

const serviceTypeLabels: Record<string, string> = {
  birth_doula: 'Birth Doula',
  postpartum_doula: 'Postpartum Doula',
  lactation_consulting: 'Lactation Consulting',
  childbirth_education: 'Childbirth Education',
  other: 'Other Services',
}

export default async function WelcomePacketsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch packets with item counts
  const { data: packets } = await supabase
    .from('welcome_packets')
    .select(
      `
      *,
      items:welcome_packet_items(count)
    `
    )
    .order('created_at', { ascending: false })

  const typedPackets = (packets || []) as WelcomePacketWithItemCount[]
  const activeCount = typedPackets.filter(p => p.is_active).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/setup">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Setup
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    Welcome Packets
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {typedPackets.length} packet
                    {typedPackets.length !== 1 ? 's' : ''} ({activeCount}{' '}
                    active)
                  </p>
                </div>
              </div>
            </div>
            <WelcomePacketDialog mode="create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Packet
              </Button>
            </WelcomePacketDialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Info Banner */}
        <Card className="mb-8 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardContent className="flex items-start gap-4 pt-6">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Automated Client Onboarding
              </h3>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                Welcome packets automatically send documents, forms, and
                resources to new clients when they sign their contract or
                convert from lead status. Set up packets for each service type
                to streamline your onboarding process.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{typedPackets.length}</div>
              <p className="text-sm text-muted-foreground">Total Packets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{activeCount}</div>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {typedPackets.reduce(
                  (sum, p) => sum + (p.items?.[0]?.count || 0),
                  0
                )}
              </div>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </CardContent>
          </Card>
        </div>

        {/* Packets List */}
        {typedPackets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-semibold">
                No welcome packets yet
              </h3>
              <p className="mb-4 text-center text-muted-foreground">
                Create your first welcome packet to automate client onboarding.
              </p>
              <WelcomePacketDialog mode="create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Packet
                </Button>
              </WelcomePacketDialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {typedPackets.map(packet => (
              <Card
                key={packet.id}
                className={!packet.is_active ? 'opacity-60' : ''}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {packet.name}
                        {packet.is_active ? (
                          <Badge variant="default" className="text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </CardTitle>
                      {packet.description && (
                        <CardDescription className="mt-1">
                          {packet.description}
                        </CardDescription>
                      )}
                    </div>
                    <WelcomePacketActions packet={packet} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {triggerLabels[packet.trigger_on] || packet.trigger_on}
                      </Badge>
                      {packet.service_type && (
                        <Badge variant="outline">
                          {serviceTypeLabels[packet.service_type] ||
                            packet.service_type}
                        </Badge>
                      )}
                      {!packet.service_type && (
                        <Badge variant="outline">All Services</Badge>
                      )}
                    </div>

                    {/* Items Summary */}
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>
                            {packet.items?.[0]?.count || 0} item
                            {(packet.items?.[0]?.count || 0) !== 1
                              ? 's'
                              : ''}{' '}
                            in this packet
                          </span>
                        </div>
                        <WelcomePacketItemsDialog packet={packet}>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0"
                          >
                            Manage Items
                          </Button>
                        </WelcomePacketItemsDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

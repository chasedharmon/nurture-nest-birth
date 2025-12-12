'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Play,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import {
  migrateLegacyLeads,
  getMigrationPreview,
  getMigrationStatus,
  validateMigration,
  type MigrationPreview,
  type MigrationStatus,
  type MigrationResult,
} from '@/app/actions/lead-migration'

interface MigrationDashboardProps {
  initialStatus: MigrationStatus | null
  initialPreview: MigrationPreview | null
}

export function MigrationDashboard({
  initialStatus,
  initialPreview,
}: MigrationDashboardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<MigrationStatus | null>(initialStatus)
  const [preview, setPreview] = useState<MigrationPreview | null>(
    initialPreview
  )
  const [migrationResult, setMigrationResult] =
    useState<MigrationResult | null>(null)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    legacyCount: number
    crmCount: number
    discrepancy: number
    sampleValidation: Array<{
      legacyId: string
      crmId: string
      matches: boolean
      issues: string[]
    }>
  } | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  const refreshData = async () => {
    startTransition(async () => {
      const [newStatus, newPreview] = await Promise.all([
        getMigrationStatus(),
        getMigrationPreview(),
      ])
      if (newStatus.data) setStatus(newStatus.data)
      if (newPreview.data) setPreview(newPreview.data)
      setMigrationResult(null)
      router.refresh()
    })
  }

  const runDryRun = async () => {
    setIsRunning(true)
    setMigrationResult(null)
    setProgress(0)

    try {
      const result = await migrateLegacyLeads({ dryRun: true })
      setMigrationResult(result)
    } finally {
      setIsRunning(false)
      setProgress(100)
    }
  }

  const runMigration = async () => {
    setIsRunning(true)
    setMigrationResult(null)
    setProgress(0)

    try {
      // Run migration in batches, updating progress
      const totalToMigrate = preview?.toMigrate || 0
      const batchSize = 50

      if (totalToMigrate === 0) {
        setMigrationResult({
          success: true,
          migratedCount: 0,
          skippedCount: 0,
          errors: [],
          dryRun: false,
        })
        return
      }

      const result = await migrateLegacyLeads({
        batchSize,
        dryRun: false,
      })

      setMigrationResult(result)
      setProgress(100)

      // Refresh data after migration
      await refreshData()
    } finally {
      setIsRunning(false)
    }
  }

  const runValidation = async () => {
    startTransition(async () => {
      const result = await validateMigration()
      setValidationResult(result)
    })
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={refreshData}
          disabled={isPending || isRunning}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>

        <Button
          variant="outline"
          onClick={runDryRun}
          disabled={isRunning || !preview?.toMigrate}
        >
          <Eye className="mr-2 h-4 w-4" />
          Dry Run
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={isRunning || !preview?.toMigrate}>
              <Play className="mr-2 h-4 w-4" />
              Start Migration
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start Migration?</AlertDialogTitle>
              <AlertDialogDescription>
                This will migrate {preview?.toMigrate || 0} legacy leads to the
                CRM system. This action preserves original data and can be run
                multiple times safely.
                <br />
                <br />
                <strong>Recommended:</strong> Run a dry run first to preview the
                migration.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={runMigration}>
                Start Migration
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          variant="secondary"
          onClick={runValidation}
          disabled={isPending || isRunning || !status?.migrated}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Validate Migration
        </Button>
      </div>

      {/* Progress Bar (when running) */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <Progress value={progress} className="h-2" />
              </div>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Migration Result */}
      {migrationResult && (
        <Card
          className={
            migrationResult.success
              ? 'border-green-200 dark:border-green-900'
              : 'border-red-200 dark:border-red-900'
          }
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {migrationResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
              <CardTitle className="text-lg">
                {migrationResult.dryRun
                  ? 'Dry Run Results'
                  : 'Migration Results'}
              </CardTitle>
              {migrationResult.dryRun && (
                <Badge variant="secondary">Dry Run</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">
                  {migrationResult.dryRun ? 'Would Migrate' : 'Migrated'}
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {migrationResult.migratedCount}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Skipped</div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {migrationResult.skippedCount}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Errors</div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {migrationResult.errors.length}
                </div>
              </div>
            </div>

            {migrationResult.errors.length > 0 && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                <h4 className="font-medium text-red-800 dark:text-red-200">
                  Errors:
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-red-700 dark:text-red-300">
                  {migrationResult.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>
                      {err.legacyId ? `Lead ${err.legacyId}: ` : ''}
                      {err.error}
                    </li>
                  ))}
                  {migrationResult.errors.length > 5 && (
                    <li>
                      ...and {migrationResult.errors.length - 5} more errors
                    </li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Result */}
      {validationResult && (
        <Card
          className={
            validationResult.valid
              ? 'border-green-200 dark:border-green-900'
              : 'border-amber-200 dark:border-amber-900'
          }
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {validationResult.valid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              )}
              <CardTitle className="text-lg">Validation Results</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">
                  Migrated (Legacy)
                </div>
                <div className="text-2xl font-bold">
                  {validationResult.legacyCount}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">CRM Leads</div>
                <div className="text-2xl font-bold">
                  {validationResult.crmCount}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Discrepancy</div>
                <div
                  className={`text-2xl font-bold ${validationResult.discrepancy > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}
                >
                  {validationResult.discrepancy}
                </div>
              </div>
            </div>

            {validationResult.sampleValidation.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-medium">Sample Validation:</h4>
                <div className="space-y-2">
                  {validationResult.sampleValidation.map((sample, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                        sample.matches
                          ? 'bg-green-50 dark:bg-green-950/30'
                          : 'bg-amber-50 dark:bg-amber-950/30'
                      }`}
                    >
                      {sample.matches ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      )}
                      <span className="font-mono text-xs">
                        {sample.legacyId.slice(0, 8)}...
                      </span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="font-mono text-xs">
                        {sample.crmId.slice(0, 8)}...
                      </span>
                      {sample.issues.length > 0 && (
                        <span className="text-amber-600 dark:text-amber-400">
                          ({sample.issues.join(', ')})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Breakdown */}
      {preview && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Breakdown</CardTitle>
              <CardDescription>
                Distribution of legacy leads by status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(preview.statusBreakdown).map(
                  ([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(status)}>
                          {status}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline">
                          {mapStatusLabel(status)}
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Source Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Source Breakdown</CardTitle>
              <CardDescription>
                Distribution of legacy leads by source
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(preview.sourceBreakdown).map(
                  ([source, count]) => (
                    <div
                      key={source}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{source}</Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline">
                          {mapSourceLabel(source)}
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sample Mappings */}
      {preview && preview.sampleMappings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sample Field Mappings</CardTitle>
            <CardDescription>
              Preview how legacy lead fields will be mapped to CRM fields
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Legacy Field</TableHead>
                    <TableHead>Legacy Value</TableHead>
                    <TableHead></TableHead>
                    <TableHead>CRM Field</TableHead>
                    <TableHead>CRM Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.sampleMappings.slice(0, 1).map(mapping => (
                    <>
                      <TableRow key={`${mapping.legacy.id}-name`}>
                        <TableCell className="font-mono text-xs">
                          name
                        </TableCell>
                        <TableCell>{mapping.legacy.name}</TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          first_name / last_name
                        </TableCell>
                        <TableCell>
                          {mapping.crm.first_name as string} /{' '}
                          {mapping.crm.last_name as string}
                        </TableCell>
                      </TableRow>
                      <TableRow key={`${mapping.legacy.id}-email`}>
                        <TableCell className="font-mono text-xs">
                          email
                        </TableCell>
                        <TableCell>{mapping.legacy.email}</TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          email
                        </TableCell>
                        <TableCell>{mapping.crm.email as string}</TableCell>
                      </TableRow>
                      <TableRow key={`${mapping.legacy.id}-status`}>
                        <TableCell className="font-mono text-xs">
                          status
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusVariant(
                              mapping.legacy.status || ''
                            )}
                          >
                            {mapping.legacy.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          lead_status
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {mapping.crm.lead_status as string}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow key={`${mapping.legacy.id}-source`}>
                        <TableCell className="font-mono text-xs">
                          source
                        </TableCell>
                        <TableCell>{mapping.legacy.source}</TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          lead_source
                        </TableCell>
                        <TableCell>
                          {mapping.crm.lead_source as string}
                        </TableCell>
                      </TableRow>
                      <TableRow key={`${mapping.legacy.id}-service`}>
                        <TableCell className="font-mono text-xs">
                          service_interest
                        </TableCell>
                        <TableCell>
                          {mapping.legacy.service_interest || '(none)'}
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          service_interest
                        </TableCell>
                        <TableCell>
                          {(mapping.crm.service_interest as string) || '(none)'}
                        </TableCell>
                      </TableRow>
                      <TableRow key={`${mapping.legacy.id}-due`}>
                        <TableCell className="font-mono text-xs">
                          expected_due_date
                        </TableCell>
                        <TableCell>
                          {mapping.legacy.expected_due_date || '(none)'}
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          expected_due_date
                        </TableCell>
                        <TableCell>
                          {(mapping.crm.expected_due_date as string) ||
                            '(none)'}
                        </TableCell>
                      </TableRow>
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper functions for badge styling
function getStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'new':
      return 'default'
    case 'contacted':
      return 'secondary'
    case 'scheduled':
    case 'qualified':
      return 'outline'
    case 'client':
    case 'converted':
      return 'default'
    case 'lost':
    case 'unqualified':
      return 'destructive'
    default:
      return 'secondary'
  }
}

function mapStatusLabel(status: string): string {
  const map: Record<string, string> = {
    new: 'new',
    contacted: 'contacted',
    scheduled: 'qualified',
    client: 'converted',
    lost: 'unqualified',
  }
  return map[status] || status
}

function mapSourceLabel(source: string): string {
  const map: Record<string, string> = {
    contact_form: 'Website Form',
    newsletter: 'Newsletter',
    manual: 'Manual Entry',
  }
  return map[source] || source
}

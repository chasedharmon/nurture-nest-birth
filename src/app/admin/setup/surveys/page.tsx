import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSurveys, getOverallNPSStats } from '@/app/actions/surveys'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ClipboardCheck,
  Plus,
  Eye,
  EyeOff,
  Star,
  MessageSquare,
  TrendingUp,
} from 'lucide-react'
import { SurveyDialog } from '@/components/admin/setup/survey-dialog'
import { SurveyActions } from '@/components/admin/setup/survey-actions'
import { NPSBadge } from '@/components/ui/nps-scale'
import type { Survey } from '@/lib/supabase/types'

const surveyTypeLabels: Record<string, string> = {
  nps: 'NPS Survey',
  csat: 'Satisfaction Survey',
  custom: 'Custom Survey',
}

const surveyTypeColors: Record<string, string> = {
  nps: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  csat: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  custom:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
}

export default async function SurveysPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [surveysResult, npsStatsResult] = await Promise.all([
    getSurveys(),
    getOverallNPSStats(),
  ])

  const surveys = surveysResult.success
    ? (surveysResult.surveys as Survey[]) || []
    : []
  const npsStats = npsStatsResult.success ? npsStatsResult.stats : null

  const activeCount = surveys.filter(s => s.is_active).length
  const totalResponses = surveys.reduce(
    (sum, s) => sum + (s.response_count || 0),
    0
  )

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
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    Client Surveys
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {surveys.length} survey{surveys.length !== 1 ? 's' : ''} (
                    {activeCount} active)
                  </p>
                </div>
              </div>
            </div>
            <SurveyDialog mode="create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Survey
              </Button>
            </SurveyDialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{surveys.length}</div>
              <p className="text-sm text-muted-foreground">Total Surveys</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalResponses}</div>
              <p className="text-sm text-muted-foreground">Total Responses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {npsStats?.nps !== undefined ? npsStats.nps : 'N/A'}
                </span>
                {npsStats?.nps !== undefined && npsStats.nps !== null && (
                  <TrendingUp
                    className={`h-4 w-4 ${npsStats.nps >= 0 ? 'text-green-500' : 'text-red-500'}`}
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground">Overall NPS Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {npsStats?.totalResponses || 0}
              </div>
              <p className="text-sm text-muted-foreground">NPS Responses</p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="flex items-start gap-3 pt-6">
            <MessageSquare className="h-5 w-5 shrink-0 mt-0.5 text-blue-500" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">
                Collect Client Feedback with Surveys
              </p>
              <p className="text-blue-600 dark:text-blue-400">
                Create NPS (Net Promoter Score) or custom satisfaction surveys
                to gather feedback from your clients. Surveys can be triggered
                automatically via workflows after services are completed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Surveys List */}
        {surveys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardCheck className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-semibold">No surveys yet</h3>
              <p className="mb-4 text-center text-muted-foreground">
                Create your first survey to start collecting client feedback.
              </p>
              <SurveyDialog mode="create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Survey
                </Button>
              </SurveyDialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {surveys.map(survey => (
              <Card
                key={survey.id}
                className={`transition-opacity ${!survey.is_active ? 'opacity-60' : ''}`}
              >
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-medium">{survey.name}</h3>
                        {!survey.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <Badge
                        className={`text-xs ${surveyTypeColors[survey.survey_type] || surveyTypeColors.custom}`}
                      >
                        {surveyTypeLabels[survey.survey_type] ||
                          survey.survey_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {survey.is_active ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {survey.description && (
                    <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                      {survey.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold">
                        {survey.response_count || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Responses</p>
                    </div>
                    <div>
                      {survey.survey_type === 'nps' &&
                      survey.average_score !== null &&
                      survey.average_score !== undefined ? (
                        <>
                          <div className="flex items-center gap-2">
                            <NPSBadge
                              score={Math.round(survey.average_score)}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Avg Score
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-500" />
                            <span className="text-lg font-semibold">
                              {survey.average_score !== null &&
                              survey.average_score !== undefined
                                ? survey.average_score.toFixed(1)
                                : 'N/A'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Avg Score
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Questions Preview */}
                  <div className="mb-4 text-sm text-muted-foreground">
                    {survey.questions?.length || 0} question
                    {(survey.questions?.length || 0) !== 1 ? 's' : ''}
                  </div>

                  <SurveyActions survey={survey} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

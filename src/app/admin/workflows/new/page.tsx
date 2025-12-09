import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewWorkflowForm } from './new-workflow-form'

export default async function NewWorkflowPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <NewWorkflowForm />
}

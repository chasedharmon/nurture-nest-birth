import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/admin/dashboard'

export const metadata = {
  title: 'Admin Dashboard | Nurture Nest Birth',
  description: 'Manage leads and client relationships',
}

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch leads summary
  const { data: leads, count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10)

  const { count: newLeadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')

  const { count: clientsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'client')

  return (
    <AdminDashboard
      user={{
        email: user.email!,
        fullName: profile?.full_name || null,
        role: profile?.role || 'admin',
      }}
      leads={leads || []}
      stats={{
        total: totalLeads || 0,
        new: newLeadsCount || 0,
        clients: clientsCount || 0,
      }}
    />
  )
}

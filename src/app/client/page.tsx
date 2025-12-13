import { redirect } from 'next/navigation'
import { getClientSession } from '@/app/actions/client-auth'

export default async function ClientPage() {
  const session = await getClientSession()

  if (!session) {
    redirect('/client/login')
  }

  redirect('/client/dashboard')
}

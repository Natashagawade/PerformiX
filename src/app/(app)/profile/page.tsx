import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ProfileClient from '@/components/dashboard/ProfileClient'

export const metadata = { title: 'My Profile' }

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  return <ProfileClient user={user as never} />
}

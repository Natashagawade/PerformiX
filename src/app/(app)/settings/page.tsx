import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SettingsClient from '@/components/dashboard/SettingsClient'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  if (user.role !== 'ADMIN') redirect('/dashboard')

  const [cycles, users, escalations, departments] = await Promise.all([
    prisma.cycle.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.user.findMany({ include: { department: true }, orderBy: { createdAt: 'desc' } }),
    prisma.escalation.findMany({ where: { status: 'PENDING' }, include: { user: true }, take: 10 }),
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
  ])

  return <SettingsClient cycles={cycles as never} users={users as never} escalations={escalations as never} departments={departments as never} />
}

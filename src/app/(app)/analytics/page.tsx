import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AnalyticsClient from '@/components/charts/AnalyticsClient'

export const metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  const goals = await prisma.goal.findMany({
    where: user.role === 'EMPLOYEE' ? { ownerId: user.id } : user.role === 'MANAGER' ? { owner: { managerId: user.id } } : {},
    include: { checkIns: true, owner: { include: { department: true } } },
  })

  const depts = user.role === 'ADMIN' ? await prisma.department.findMany({
    include: { users: { include: { goals: { include: { checkIns: true } } } } },
  }) : []

  return <AnalyticsClient goals={goals as never} departments={depts as never} userRole={user.role} userName={user.name} />
}

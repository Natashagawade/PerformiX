import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ApprovalsClient from '@/components/goals/ApprovalsClient'

export const metadata = { title: 'Approvals' }

export default async function ApprovalsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  if (user.role === 'EMPLOYEE') redirect('/dashboard')

  const where = user.role === 'MANAGER'
    ? { status: 'PENDING' as const, owner: { managerId: user.id } }
    : { status: 'PENDING' as const }

  const goals = await prisma.goal.findMany({
    where,
    include: { owner: { include: { department: true } }, cycle: true },
    orderBy: { submittedAt: 'asc' },
  })

  return <ApprovalsClient goals={goals as never} userRole={user.role} />
}

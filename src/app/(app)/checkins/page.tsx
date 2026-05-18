import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import CheckinsClient from '@/components/goals/CheckinsClient'

export const metadata = { title: 'Quarterly Check-ins' }

export default async function CheckinsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  // Both employees and managers can do check-ins on their own goals
  const goals = await prisma.goal.findMany({
    where: { ownerId: user.id, status: 'APPROVED' },
    include: { checkIns: { orderBy: { quarter: 'asc' } }, cycle: true },
  })

  const activeCycle = await prisma.cycle.findFirst({ where: { status: 'ACTIVE' } })

  return <CheckinsClient goals={goals as never} activeCycle={activeCycle} userId={user.id} />
}

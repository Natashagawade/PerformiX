import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import GoalsClient from '@/components/goals/GoalsClient'

export const metadata = { title: 'My Goals' }

export default async function GoalsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  // Both employees and managers can manage their own goals
  if (user.role === 'ADMIN') redirect('/dashboard')

  const [goals, activeCycle] = await Promise.all([
    prisma.goal.findMany({
      where: { ownerId: user.id },
      include: { checkIns: { orderBy: { quarter: 'asc' } }, cycle: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.cycle.findFirst({ where: { status: 'ACTIVE' } }),
  ])

  const totalWeight = goals.filter(g => g.status !== 'REJECTED').reduce((a, g) => a + g.weightage, 0)

  return <GoalsClient goals={goals as never} activeCycle={activeCycle} totalWeight={totalWeight} userId={user.id} />
}

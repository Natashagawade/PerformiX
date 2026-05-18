import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import GoalIQClient from '@/components/dashboard/GoalIQClient'

export const metadata = { title: 'AI Insights — GoalIQ' }

export default async function AIPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  const goals = await prisma.goal.findMany({
    where: user.role === 'EMPLOYEE' ? { ownerId: user.id } : user.role === 'MANAGER' ? { owner: { managerId: user.id } } : {},
    include: { checkIns: true, owner: { select: { name: true } } },
    take: 20,
  })

  return <GoalIQClient user={user} goals={goals as never} />
}

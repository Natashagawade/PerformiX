import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import TeamClient from '@/components/dashboard/TeamClient'

export const metadata = { title: 'Team' }

export default async function TeamPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  if (user.role === 'EMPLOYEE') redirect('/dashboard')

  const where = user.role === 'MANAGER' ? { managerId: user.id } : {}
  const members = await prisma.user.findMany({
    where: { ...where, role: 'EMPLOYEE' },
    include: {
      department: true,
      goals: { include: { checkIns: { orderBy: { quarter: 'desc' }, take: 1 } }, where: { status: 'APPROVED' } },
    },
    orderBy: { name: 'asc' },
  })

  return <TeamClient members={members as never} userRole={user.role} />
}

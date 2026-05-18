import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AuditClient from '@/components/dashboard/AuditClient'

export const metadata = { title: 'Audit Log' }

export default async function AuditPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  if (user.role === 'EMPLOYEE') redirect('/dashboard')

  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { name: true, role: true } }, goal: { select: { title: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return <AuditClient logs={logs as never} />
}

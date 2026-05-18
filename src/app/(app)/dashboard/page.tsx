import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard'
import ManagerDashboard from '@/components/dashboard/ManagerDashboard'
import AdminDashboard from '@/components/dashboard/AdminDashboard'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  const activeCycle = await prisma.cycle.findFirst({ where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' } })

  if (user.role === 'EMPLOYEE') {
    const goals = await prisma.goal.findMany({
      where: { ownerId: user.id },
      include: { checkIns: true, cycle: true },
      orderBy: { createdAt: 'desc' },
    })
    const notifications = await prisma.notification.findMany({ where: { userId: user.id, read: false }, take: 4, orderBy: { createdAt: 'desc' } })
    return <EmployeeDashboard user={user} goals={goals as never} notifications={notifications as never} activeCycle={activeCycle} />
  }

  if (user.role === 'MANAGER') {
    const [pendingApprovals, reports] = await Promise.all([
      prisma.goal.findMany({ where: { status: 'PENDING', owner: { managerId: user.id } }, include: { owner: { include: { department: true } } }, take: 5 }),
      prisma.user.findMany({ where: { managerId: user.id }, include: { goals: { include: { checkIns: true } } } }),
    ])
    return <ManagerDashboard user={user} pendingApprovals={pendingApprovals as never} reports={reports as never} activeCycle={activeCycle} />
  }

  if (user.role === 'ADMIN') {
    const [totalUsers, totalGoals, pendingApprovals, escalations, auditLogs] = await Promise.all([
      prisma.user.count({ where: { role: 'EMPLOYEE' } }),
      prisma.goal.count(),
      prisma.goal.count({ where: { status: 'PENDING' } }),
      prisma.escalation.count({ where: { status: 'PENDING' } }),
      prisma.auditLog.findMany({ include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 6 }),
    ])
    const depts = await prisma.department.findMany({ include: { users: { include: { goals: { include: { checkIns: true } } } } } })
    return <AdminDashboard user={user} stats={{ totalUsers, totalGoals, pendingApprovals, escalations }} departments={depts as never} auditLogs={auditLogs as never} activeCycle={activeCycle} />
  }

  redirect('/auth/login')
}

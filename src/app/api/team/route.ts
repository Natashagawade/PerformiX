import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.role === 'EMPLOYEE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const managerId = searchParams.get('managerId') || (user.role === 'MANAGER' ? user.id : undefined)
    const cycleId = searchParams.get('cycleId')

    const where = managerId ? { managerId } : {}

    const members = await prisma.user.findMany({
      where: { ...where, role: 'EMPLOYEE' },
      include: {
        department: true,
        goals: {
          where: cycleId ? { cycleId } : {},
          include: { checkIns: { orderBy: { quarter: 'desc' }, take: 1 } },
        },
        manager: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    })

    const data = members.map(m => {
      const approvedGoals = m.goals.filter(g => g.status === 'APPROVED')
      const completion = approvedGoals.length
        ? Math.round(approvedGoals.reduce((a, g) => {
            const ci = g.checkIns[0]
            const pct = ci ? Math.min(100, (ci.actualAchieved / g.target) * 100) : 0
            return a + pct
          }, 0) / approvedGoals.length)
        : 0
      const { passwordHash: _, ...safeUser } = m as typeof m & { passwordHash: string }
      return { ...safeUser, completion, pendingCount: m.goals.filter(g => g.status === 'PENDING').length }
    })

    return NextResponse.json({ data })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

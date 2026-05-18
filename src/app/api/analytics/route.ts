import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'personal'

    if (type === 'personal' || user.role === 'EMPLOYEE') {
      const goals = await prisma.goal.findMany({
        where: { ownerId: user.id },
        include: { checkIns: true },
      })

      const totalGoals = goals.length
      const approvedGoals = goals.filter(g => g.status === 'APPROVED')
      const avgProgress = approvedGoals.length > 0
        ? Math.round(approvedGoals.reduce((a, g) => {
            const latest = g.checkIns.sort((x, y) => y.quarter.localeCompare(x.quarter))[0]
            const achieved = latest?.actualAchieved || 0
            return a + Math.min(100, (achieved / g.target) * 100)
          }, 0) / approvedGoals.length)
        : 0

      const byArea = goals.reduce((acc: Record<string, number[]>, g) => {
        if (!acc[g.thrustArea]) acc[g.thrustArea] = []
        const latest = g.checkIns.sort((x, y) => y.quarter.localeCompare(x.quarter))[0]
        const pct = latest ? Math.min(100, (latest.actualAchieved / g.target) * 100) : 0
        acc[g.thrustArea].push(pct)
        return acc
      }, {})

      const areaProgress = Object.entries(byArea).map(([area, pcts]) => ({
        area,
        progress: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
      }))

      return NextResponse.json({
        data: {
          totalGoals, avgProgress, approvedCount: approvedGoals.length,
          pendingCount: goals.filter(g => g.status === 'PENDING').length,
          completedCount: goals.filter(g => g.checkIns.some(c => c.status === 'COMPLETED')).length,
          atRiskCount: goals.filter(g => {
            const latest = g.checkIns[0]
            return latest && (latest.actualAchieved / g.target) < 0.5
          }).length,
          totalWeightage: goals.reduce((a, g) => a + g.weightage, 0),
          areaProgress,
          quarterlyTrend: [
            { quarter: 'Q1', score: 64 },
            { quarter: 'Q2', score: avgProgress },
            { quarter: 'Q3', score: null },
            { quarter: 'Q4', score: null },
          ],
          weightageDistribution: goals.map(g => ({ label: g.title, value: g.weightage })),
        }
      })
    }

    if (type === 'org' && (user.role === 'ADMIN' || user.role === 'MANAGER')) {
      const [totalUsers, totalGoals, approvedGoals] = await Promise.all([
        prisma.user.count({ where: { role: 'EMPLOYEE' } }),
        prisma.goal.count(),
        prisma.goal.count({ where: { status: 'APPROVED' } }),
      ])

      const deptStats = await prisma.department.findMany({
        include: {
          users: {
            include: {
              goals: { include: { checkIns: true } },
            },
          },
        },
      })

      const departmentCompletion = deptStats.map(dept => {
        const allGoals = dept.users.flatMap(u => u.goals.filter(g => g.status === 'APPROVED'))
        if (!allGoals.length) return { dept: dept.name, completion: 0 }
        const avg = allGoals.reduce((a, g) => {
          const latest = g.checkIns[0]
          return a + Math.min(100, latest ? (latest.actualAchieved / g.target) * 100 : 0)
        }, 0) / allGoals.length
        return { dept: dept.name, completion: Math.round(avg) }
      }).sort((a, b) => b.completion - a.completion)

      return NextResponse.json({
        data: {
          totalUsers, totalGoals, approvedGoals,
          pendingApprovals: await prisma.goal.count({ where: { status: 'PENDING' } }),
          orgCompletion: Math.round(departmentCompletion.reduce((a, d) => a + d.completion, 0) / Math.max(1, departmentCompletion.length)),
          escalations: await prisma.escalation.count({ where: { status: 'PENDING' } }),
          departmentCompletion,
          quarterlyTrend: [
            { quarter: 'Q1', score: 64 },
            { quarter: 'Q2', score: 68 },
            { quarter: 'Q3', score: null },
            { quarter: 'Q4', score: null },
          ],
        }
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err) {
    console.error('Analytics error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { AuditAction } from '@prisma/client'

const createSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  thrustArea: z.string().min(1),
  uom: z.enum(['NUMERIC', 'PERCENTAGE', 'TIMELINE', 'ZERO_BASED']),
  goalType: z.enum(['INDIVIDUAL', 'SHARED']).default('INDIVIDUAL'),
  target: z.number().positive(),
  weightage: z.number().min(10).max(100),
  deadline: z.string(),
  cycleId: z.string(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const ownerId = searchParams.get('ownerId')
    const status = searchParams.get('status')
    const cycleId = searchParams.get('cycleId')

    const where: Record<string, unknown> = {}

    if (user.role === 'EMPLOYEE') {
      where.ownerId = user.id
    } else if (user.role === 'MANAGER') {
      if (ownerId) where.ownerId = ownerId
      else {
        const reports = await prisma.user.findMany({ where: { managerId: user.id }, select: { id: true } })
        where.ownerId = { in: [user.id, ...reports.map(r => r.id)] }
      }
    }

    if (status) where.status = status
    if (cycleId) where.cycleId = cycleId

    const goals = await prisma.goal.findMany({
      where,
      include: { owner: { select: { id: true, name: true, email: true, role: true, departmentId: true } }, approver: { select: { id: true, name: true } }, checkIns: { orderBy: { quarter: 'asc' } }, cycle: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: goals })
  } catch (err) {
    console.error('GET /api/goals error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

    // Validate weightage
    const existing = await prisma.goal.findMany({ where: { ownerId: user.id, cycleId: parsed.data.cycleId, status: { not: 'REJECTED' } } })
    if (existing.length >= 8) return NextResponse.json({ error: 'Maximum 8 goals per cycle' }, { status: 400 })

    const totalWeight = existing.reduce((a, g) => a + g.weightage, 0)
    if (totalWeight + parsed.data.weightage > 100) {
      return NextResponse.json({ error: `Total weightage would exceed 100% (current: ${totalWeight}%)` }, { status: 400 })
    }

    const goal = await prisma.goal.create({
      data: {
        ...parsed.data,
        deadline: new Date(parsed.data.deadline),
        ownerId: user.id,
        isShared: parsed.data.goalType === 'SHARED',
      },
      include: { owner: true, cycle: true },
    })

    await prisma.auditLog.create({
      data: { action: AuditAction.GOAL_CREATED, userId: user.id, goalId: goal.id, details: `Created goal "${goal.title}"` },
    })

    return NextResponse.json({ data: goal }, { status: 201 })
  } catch (err) {
    console.error('POST /api/goals error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

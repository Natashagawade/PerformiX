import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { AuditAction } from '@prisma/client'

const schema = z.object({
  goalId: z.string(),
  cycleId: z.string(),
  quarter: z.string(),
  plannedTarget: z.number(),
  actualAchieved: z.number(),
  status: z.enum(['NOT_STARTED', 'ON_TRACK', 'AT_RISK', 'COMPLETED']),
  employeeComment: z.string().optional(),
  managerFeedback: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const goalId = searchParams.get('goalId')
    const userId = searchParams.get('userId') || user.id

    const checkIns = await prisma.checkIn.findMany({
      where: { ...(goalId ? { goalId } : {}), userId },
      include: { goal: { include: { owner: true } }, cycle: true },
      orderBy: { quarter: 'asc' },
    })
    return NextResponse.json({ data: checkIns })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

    const goal = await prisma.goal.findUnique({ where: { id: parsed.data.goalId } })
    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

    // Calculate progress score
    let progressScore = 0
    if (parsed.data.plannedTarget > 0) {
      if (goal.uom === 'ZERO_BASED') {
        progressScore = parsed.data.actualAchieved === 0 ? 1 : 0
      } else {
        progressScore = Math.min(1, parsed.data.actualAchieved / parsed.data.plannedTarget)
      }
    }

    const checkIn = await prisma.checkIn.upsert({
      where: { goalId_quarter: { goalId: parsed.data.goalId, quarter: parsed.data.quarter } },
      update: { ...parsed.data, progressScore, userId: user.id },
      create: { ...parsed.data, progressScore, userId: user.id },
    })

    await prisma.auditLog.create({
      data: { action: AuditAction.ACHIEVEMENT_UPDATED, userId: user.id, goalId: parsed.data.goalId, details: `${parsed.data.quarter} achievement updated: ${parsed.data.actualAchieved}` },
    })

    return NextResponse.json({ data: checkIn })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

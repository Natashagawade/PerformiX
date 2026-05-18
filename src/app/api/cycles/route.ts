import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { AuditAction } from '@prisma/client'

const schema = z.object({
  name: z.string().min(3),
  phase: z.enum(['GOAL_SETTING', 'Q1', 'Q2', 'Q3', 'Q4']),
  startDate: z.string(),
  endDate: z.string(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const cycles = await prisma.cycle.findMany({ orderBy: { startDate: 'desc' } })
    return NextResponse.json({ data: cycles })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

    // Deactivate current active cycles
    if (body.makeActive) {
      await prisma.cycle.updateMany({ where: { status: 'ACTIVE' }, data: { status: 'COMPLETED' } })
    }

    const cycle = await prisma.cycle.create({
      data: { ...parsed.data, startDate: new Date(parsed.data.startDate), endDate: new Date(parsed.data.endDate), status: body.makeActive ? 'ACTIVE' : 'UPCOMING' },
    })

    await prisma.auditLog.create({
      data: { action: AuditAction.CYCLE_CREATED, userId: user.id, details: `Created cycle "${cycle.name}"` },
    })

    return NextResponse.json({ data: cycle }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}

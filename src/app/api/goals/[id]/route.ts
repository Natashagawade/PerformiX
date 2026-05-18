import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { AuditAction } from '@prisma/client'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  thrustArea: z.string().optional(),
  uom: z.enum(['NUMERIC', 'PERCENTAGE', 'TIMELINE', 'ZERO_BASED']).optional(),
  target: z.number().positive().optional(),
  weightage: z.number().min(10).max(100).optional(),
  deadline: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'RETURNED']).optional(),
  managerComment: z.string().optional(),
  isLocked: z.boolean().optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const goal = await prisma.goal.findUnique({ where: { id }, include: { owner: true, approver: true, checkIns: { orderBy: { quarter: 'asc' } }, cycle: true } })
    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    return NextResponse.json({ data: goal })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const goal = await prisma.goal.findUnique({ where: { id } })
    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

    // Permission checks
    if (goal.isLocked && user.role === 'EMPLOYEE' && !parsed.data.status) {
      return NextResponse.json({ error: 'Goal is locked. Contact admin to unlock.' }, { status: 403 })
    }

    const data: Record<string, unknown> = { ...parsed.data }

    // Handle approval workflow
    if (parsed.data.status === 'APPROVED') {
      if (user.role !== 'MANAGER' && user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      data.approverId = user.id
      data.approvedAt = new Date()
      data.isLocked = true
    }
    if (parsed.data.status === 'PENDING') {
      data.submittedAt = new Date()
    }
    if (parsed.data.deadline) data.deadline = new Date(parsed.data.deadline as string)

    const updated = await prisma.goal.update({ where: { id }, data, include: { owner: true, approver: true } })

    // Audit
    const action = parsed.data.status === 'APPROVED' ? AuditAction.GOAL_APPROVED
      : parsed.data.status === 'REJECTED' ? AuditAction.GOAL_REJECTED
      : parsed.data.status === 'RETURNED' ? AuditAction.GOAL_RETURNED
      : parsed.data.status === 'PENDING' ? AuditAction.GOAL_SUBMITTED
      : parsed.data.isLocked === false ? AuditAction.GOAL_UNLOCKED
      : AuditAction.GOAL_UPDATED

    await prisma.auditLog.create({ data: { action, userId: user.id, goalId: id, details: `${action} for "${goal.title}"` } })

    // Notifications
    if (parsed.data.status === 'APPROVED') {
      await prisma.notification.create({ data: { userId: goal.ownerId, title: 'Goal Approved', message: `Your goal "${goal.title}" has been approved.`, type: 'approval' } })
    } else if (parsed.data.status === 'RETURNED' || parsed.data.status === 'REJECTED') {
      await prisma.notification.create({ data: { userId: goal.ownerId, title: `Goal ${parsed.data.status === 'RETURNED' ? 'Returned' : 'Rejected'}`, message: `"${goal.title}" ${parsed.data.status === 'RETURNED' ? 'returned for rework' : 'was rejected'}. ${parsed.data.managerComment || ''}`, type: 'rework' } })
    }

    return NextResponse.json({ data: updated })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const goal = await prisma.goal.findUnique({ where: { id } })
    if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (goal.ownerId !== user.id && user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (goal.isLocked) return NextResponse.json({ error: 'Cannot delete a locked goal' }, { status: 400 })
    await prisma.goal.delete({ where: { id } })
    return NextResponse.json({ message: 'Goal deleted' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

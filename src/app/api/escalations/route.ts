import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'EMPLOYEE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const escalations = await prisma.escalation.findMany({
      include: { user: { select: { id: true, name: true, email: true } }, goal: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: escalations })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'EMPLOYEE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id, status } = await req.json()
    const updated = await prisma.escalation.update({
      where: { id },
      data: { status, resolvedAt: status === 'RESOLVED' ? new Date() : undefined },
    })
    return NextResponse.json({ data: updated })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'MANAGER' && user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const where = user.role === 'MANAGER'
      ? { status: 'PENDING' as const, owner: { managerId: user.id } }
      : { status: 'PENDING' as const }

    const goals = await prisma.goal.findMany({
      where,
      include: { owner: { include: { department: true } }, cycle: true },
      orderBy: { submittedAt: 'asc' },
    })

    return NextResponse.json({ data: goals })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

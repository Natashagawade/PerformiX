import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const action = searchParams.get('action')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (action) where.action = action
    if (search) where.details = { contains: search, mode: 'insensitive' }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, role: true } }, goal: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return NextResponse.json({ data: logs, total, page, pageSize })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

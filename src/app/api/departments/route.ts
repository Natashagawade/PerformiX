import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const depts = await prisma.department.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ data: depts })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}

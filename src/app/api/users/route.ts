import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')
    const deptId = searchParams.get('departmentId')

    const users = await prisma.user.findMany({
      where: { ...(role ? { role: role as never } : {}), ...(deptId ? { departmentId: deptId } : {}) },
      include: { department: true, manager: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: users.map(({ passwordHash: _, ...u }) => u) })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })

    const { password, departmentId, managerId, ...rest } = parsed.data
    const newUser = await prisma.user.create({
      data: { 
        ...rest, 
        passwordHash: await hashPassword(password),
        departmentId: departmentId || undefined,
        managerId: managerId || undefined,
      },
      include: { department: true },
    })
    const { passwordHash: _, ...safe } = newUser
    return NextResponse.json({ data: safe }, { status: 201 })
  } catch (err) {
    console.error('Error creating user:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

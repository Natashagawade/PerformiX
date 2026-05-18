import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function GET() {
  const count = await prisma.user.count()
  return NextResponse.json({ setupRequired: count === 0 })
}

export async function POST(req: NextRequest) {
  try {
    const count = await prisma.user.count()
    if (count > 0) {
      return NextResponse.json(
        { error: 'Workspace already set up. Use the admin panel to add users.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { name, email, password } = parsed.data

    const salesDept = await prisma.department.upsert({
      where: { name: 'General' },
      update: {},
      create: { name: 'General' },
    })

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        role: 'ADMIN',
        departmentId: salesDept.id,
      },
    })

    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Welcome to PerformiX!',
        message: 'Your workspace has been set up. Go to Settings → Users to add employees and managers.',
        type: 'info',
      },
    })

    const token = signToken({ userId: admin.id, role: admin.role })
    const { passwordHash: _, ...safeAdmin } = admin

    const res = NextResponse.json({ user: safeAdmin, message: 'Workspace created successfully' }, { status: 201 })
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
    return res
  } catch (err) {
    console.error('Setup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

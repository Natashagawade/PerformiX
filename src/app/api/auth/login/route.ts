import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })

    const { email, password } = parsed.data
    const user = await prisma.user.findUnique({ where: { email }, include: { department: true } })
    if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

    const valid = user.passwordHash ? await verifyPassword(password, user.passwordHash) : false
    if (!valid) {
      if (!user.passwordHash && user.authProvider === 'google') {
        return NextResponse.json({ error: 'This account uses Google sign-in. Please use the Google button.' }, { status: 401 })
      }
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = signToken({ userId: user.id, role: user.role })
    const { passwordHash: _, ...safeUser } = user

    const res = NextResponse.json({ user: safeUser, message: 'Logged in successfully' })
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
    return res
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

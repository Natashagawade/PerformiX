import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phoneNumber: z.string().optional(),
  password: z.string().min(8).optional().or(z.literal('')),
})

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { name, phoneNumber, password } = parsed.data
    
    const updateData: any = {}
    if (name) updateData.name = name
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber
    if (password && password.length >= 8) {
      updateData.passwordHash = await hashPassword(password)
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    })

    const { passwordHash: _, ...safe } = updatedUser
    return NextResponse.json({ data: safe, message: 'Profile updated successfully' })
  } catch (err) {
    console.error('Error updating profile:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import type { User } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'performix-secret-change-in-production'
const COOKIE_NAME = 'performix_session'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: { userId: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
  } catch {
    return null
  }
}

export async function getSession(): Promise<{ userId: string; role: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  if (!session) return null
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { department: true, manager: true },
  })
  if (!user) return null
  const { passwordHash: _, ...safeUser } = user
  return safeUser as unknown as User
}

export async function requireAuth(requiredRole?: string | string[]): Promise<User> {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!roles.includes(user.role)) throw new Error('FORBIDDEN')
  }
  return user
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60,
  path: '/',
}

export { COOKIE_NAME }

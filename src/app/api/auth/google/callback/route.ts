import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth'

interface GoogleTokenResponse {
  access_token: string
  id_token: string
  token_type: string
}

interface GoogleUserInfo {
  sub: string
  email: string
  name: string
  picture?: string
  email_verified: boolean
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error || !code) {
      return NextResponse.redirect(new URL('/auth/login?error=google_denied', req.url))
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/auth/login?error=google_not_configured', req.url))
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      console.error('Google token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(new URL('/auth/login?error=google_token_failed', req.url))
    }

    const tokens: GoogleTokenResponse = await tokenRes.json()

    // Get user info
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userInfoRes.ok) {
      return NextResponse.redirect(new URL('/auth/login?error=google_userinfo_failed', req.url))
    }

    const googleUser: GoogleUserInfo = await userInfoRes.json()

    if (!googleUser.email_verified) {
      return NextResponse.redirect(new URL('/auth/login?error=email_not_verified', req.url))
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.sub },
          { email: googleUser.email },
        ],
      },
    })

    if (user) {
      // Link Google account if not already linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.sub,
            authProvider: 'google',
            avatarUrl: user.avatarUrl || googleUser.picture,
          },
        })
      }
    } else {
      // Create new user with Google auth
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.sub,
          authProvider: 'google',
          avatarUrl: googleUser.picture,
          role: 'EMPLOYEE', // Default role for new Google users
        },
      })

      // Create welcome notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Welcome to PerformiX!',
          message: 'Your account has been created. Contact your admin to be assigned to a department and manager.',
          type: 'info',
        },
      })
    }

    // Issue JWT
    const token = signToken({ userId: user.id, role: user.role })
    const res = NextResponse.redirect(new URL('/dashboard', req.url))
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
    return res
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect(new URL('/auth/login?error=google_auth_failed', req.url))
  }
}

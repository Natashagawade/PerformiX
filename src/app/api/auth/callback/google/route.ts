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

    const origin = new URL(req.url).origin
    const loginUrl = `${origin}/auth/login`

    if (error || !code) {
      return NextResponse.redirect(`${loginUrl}?error=google_denied`)
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${origin}/api/auth/callback/google`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${loginUrl}?error=google_not_configured`)
    }

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
      return NextResponse.redirect(`${loginUrl}?error=google_token_failed`)
    }

    const tokens: GoogleTokenResponse = await tokenRes.json()

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${loginUrl}?error=google_userinfo_failed`)
    }

    const googleUser: GoogleUserInfo = await userInfoRes.json()

    if (!googleUser.email_verified) {
      return NextResponse.redirect(`${loginUrl}?error=email_not_verified`)
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.sub },
          { email: googleUser.email },
        ],
      },
    })

    if (user) {
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
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.sub,
          authProvider: 'google',
          avatarUrl: googleUser.picture,
          role: 'EMPLOYEE',
        },
      })

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Welcome to PerformiX!',
          message: 'Your account has been created. Contact your admin to be assigned to a department and manager.',
          type: 'info',
        },
      })
    }

    const token = signToken({ userId: user.id, role: user.role })
    const res = NextResponse.redirect(`${origin}/dashboard`)
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
    return res
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    const origin = new URL(req.url).origin
    return NextResponse.redirect(`${origin}/auth/login?error=google_auth_failed`)
  }
}

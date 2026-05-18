'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Target, Zap, Shield, BarChart3 } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

const GOOGLE_ERRORS: Record<string, string> = {
  google_denied: 'Google sign-in was cancelled.',
  google_not_configured: 'Google sign-in is not configured. Contact your admin.',
  google_token_failed: 'Google authentication failed. Please try again.',
  google_userinfo_failed: 'Could not retrieve Google account info.',
  email_not_verified: 'Your Google email is not verified.',
  google_auth_failed: 'Google sign-in failed. Please try again.',
}

const FEATURES = [
  { icon: Target, text: 'Role-based dashboards for employees, managers & HR' },
  { icon: BarChart3, text: 'Quarterly check-ins with real-time progress scoring' },
  { icon: Zap, text: 'AI-powered goal insights and recommendations' },
  { icon: Shield, text: 'Secure, enterprise-grade access control' },
]

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-[#111]" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const error = searchParams.get('error')
    if (error && GOOGLE_ERRORS[error]) {
      toast.error(GOOGLE_ERRORS[error])
    }
  }, [searchParams])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Login failed')
        return
      }
      toast.success('Welcome back!')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    setGoogleLoading(true)
    window.location.href = '/api/auth/google'
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-4">
      <div className="w-full max-w-[900px] grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

        {/* Left — branding */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-[#111] rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-[#111] tracking-tight">PerformiX</div>
              <div className="text-[10px] text-[#777] uppercase tracking-wider">Goal Management</div>
            </div>
          </div>

          <h1 className="text-3xl font-semibold text-[#111] tracking-tight leading-tight mb-3">
            Align goals.<br />Drive performance.
          </h1>
          <p className="text-[#777] text-sm leading-relaxed mb-8">
            Enterprise-grade goal setting and tracking for modern organizations. Set meaningful objectives, track achievements, and celebrate progress.
          </p>

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-[#444]">
                <div className="w-7 h-7 rounded-lg bg-[#f0f0f0] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[#555]" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right — form */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-8" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div className="mb-6">
              <h2 className="text-[18px] font-semibold text-[#111] tracking-tight mb-1">Sign in</h2>
              <p className="text-sm text-[#777]">Access your PerformiX workspace</p>
            </div>

            {/* Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-[#d4d4d4] rounded-lg px-4 py-2.5 text-sm font-medium text-[#444] hover:bg-[#fafafa] hover:border-[#bbb] transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-5"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative mb-5">
              <div className="h-px bg-[#e5e5e5]" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[10px] text-[#aaa] uppercase tracking-wider">or sign in with email</span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input
                  {...register('email')}
                  type="email"
                  className="input"
                  placeholder="you@company.com"
                  autoComplete="email"
                />
                {errors.email && <p className="text-[11px] text-[#dc2626] mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPass ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#777]"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-[#dc2626] mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 mt-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign in to PerformiX'}
              </button>
            </form>

            <p className="text-[11px] text-[#aaa] text-center mt-5">
              First time?{' '}
              <a href="/auth/setup" className="text-[#555] underline underline-offset-2 hover:text-[#111] transition-colors">
                Set up your workspace
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

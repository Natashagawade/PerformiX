'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Loader2, Target, KeyRound } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormData = z.infer<typeof schema>

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [setupAllowed, setSetupAllowed] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    fetch('/api/auth/setup')
      .then(res => res.json())
      .then(data => {
        if (!data.setupRequired) {
          toast.error('Workspace is already set up')
          router.push('/auth/login')
        } else {
          setSetupAllowed(true)
        }
      })
      .catch(() => {
        toast.error('Failed to check workspace status')
      })
      .finally(() => setChecking(false))
  }, [router])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Setup failed')
        return
      }
      toast.success('Workspace created! Welcome to PerformiX.')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-[#111]" />
      </div>
    )
  }

  if (!setupAllowed) return null

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-4">
      <div className="w-full max-w-[500px]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 bg-[#111] rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-8 shadow-sm">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-[#111] tracking-tight mb-2">
                Set up workspace
              </h1>
              <p className="text-sm text-[#777]">
                Create the first admin account to initialize your PerformiX workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Admin Name</label>
                <input
                  {...register('name')}
                  type="text"
                  className="input"
                  placeholder="e.g. Jane Doe"
                />
                {errors.name && <p className="text-[11px] text-[#dc2626] mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="label">Admin Email</label>
                <input
                  {...register('email')}
                  type="email"
                  className="input"
                  placeholder="admin@company.com"
                />
                {errors.email && <p className="text-[11px] text-[#dc2626] mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label">Admin Password</label>
                <input
                  {...register('password')}
                  type="password"
                  className="input"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-[11px] text-[#dc2626] mt-1">{errors.password.message}</p>}
              </div>

              <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-lg p-4 mt-6 flex gap-3">
                <KeyRound className="w-5 h-5 text-[#0369a1] flex-shrink-0" />
                <div className="text-sm text-[#0369a1]">
                  This account will have full administrative privileges. You can add more users and departments from the Settings panel later.
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 mt-6"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</> : 'Initialize Workspace'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

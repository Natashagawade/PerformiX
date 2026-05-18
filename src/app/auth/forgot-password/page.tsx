'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowLeft, Target, Loader2, CheckCircle2 } from 'lucide-react'

const schema = z.object({ email: z.string().email('Enter a valid email address') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async () => {
    // Simulate API call
    await new Promise(r => setTimeout(r, 1200))
    setSent(true)
    toast.success('Reset instructions sent')
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="w-full max-w-sm">

        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-[#111] rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[#111] text-[14px] tracking-tight">PerformiX</span>
        </div>

        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-8" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {!sent ? (
            <>
              <h1 className="text-[18px] font-semibold text-[#111] tracking-tight mb-1">Reset password</h1>
              <p className="text-[12px] text-[#aaa] mb-6">Enter your work email and we'll send reset instructions.</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">Work email</label>
                  <input {...register('email')} type="email" className="input" placeholder="you@company.com" autoFocus />
                  {errors.email && <p className="text-[11px] text-[#dc2626] mt-1">{errors.email.message}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-2.5">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send reset instructions'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircle2 className="w-10 h-10 text-[#16a34a] mx-auto mb-3" />
              <h2 className="text-[15px] font-semibold text-[#111] mb-2">Check your inbox</h2>
              <p className="text-[12px] text-[#aaa] leading-relaxed">
                We sent password reset instructions to <strong className="text-[#444]">{getValues('email')}</strong>.
              </p>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-[#f2f2f2]">
            <Link href="/auth/login" className="flex items-center gap-1.5 text-[12px] text-[#aaa] hover:text-[#111] transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

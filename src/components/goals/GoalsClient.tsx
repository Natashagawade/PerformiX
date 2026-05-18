'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Sparkles, Lock, Link2, Loader2, Edit2, Send, Trash2,
  ChevronDown, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react'
import {
  calculateProgress, getProgressBarClass, getStatusBadgeClass,
  getStatusLabel, getUoMLabel, THRUST_AREAS, validateWeightage
} from '@/lib/utils'
import type { Goal } from '@/types'

const schema = z.object({
  title: z.string().min(3, 'At least 3 characters').max(100),
  description: z.string().optional(),
  thrustArea: z.string().min(1, 'Select a thrust area'),
  uom: z.enum(['NUMERIC', 'PERCENTAGE', 'TIMELINE', 'ZERO_BASED']),
  goalType: z.enum(['INDIVIDUAL', 'SHARED']).default('INDIVIDUAL'),
  target: z.coerce.number().positive('Must be positive'),
  weightage: z.coerce.number().min(10, 'Min 10%').max(100, 'Max 100%'),
  deadline: z.string().min(1, 'Select a deadline'),
})
type FormData = z.infer<typeof schema>

type GoalWithDetails = Goal & { checkIns: { actualAchieved: number; quarter: string }[]; cycle: { name: string } }

interface Props {
  goals: GoalWithDetails[]
  activeCycle: { id: string; name: string; phase: string } | null
  totalWeight: number
  userId: string
}

const UOM_OPTIONS = [
  { value: 'NUMERIC', label: 'Numeric', desc: 'Absolute number (e.g. 50 calls)' },
  { value: 'PERCENTAGE', label: 'Percentage', desc: 'Relative progress (e.g. 25%)' },
  { value: 'TIMELINE', label: 'Timeline', desc: 'Milestone completion (0–100%)' },
  { value: 'ZERO_BASED', label: 'Zero-based', desc: 'Baseline reduction goal' },
]

export default function GoalsClient({ goals: initGoals, activeCycle, totalWeight: initWeight, userId }: Props) {
  const router = useRouter()
  const [goals, setGoals] = useState(initGoals)
  const [totalWeight, setTotalWeight] = useState(initWeight)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('ALL')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<Partial<FormData> | null>(null)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { uom: 'PERCENTAGE', goalType: 'INDIVIDUAL' },
  })

  const watchedWeight = watch('weightage')
  const weightCheck = validateWeightage(goals.filter(g => g.status !== 'REJECTED'), Number(watchedWeight) || 0)

  const filtered = goals.filter(g => filter === 'ALL' ? true : g.status === filter)

  const openCreate = () => { reset({ uom: 'PERCENTAGE', goalType: 'INDIVIDUAL' }); setEditingId(null); setAiSuggestion(null); setShowForm(true) }

  const openEdit = (g: GoalWithDetails) => {
    reset({
      title: g.title, description: g.description || '', thrustArea: g.thrustArea,
      uom: g.uom, goalType: g.goalType, target: g.target, weightage: g.weightage,
      deadline: new Date(g.deadline).toISOString().split('T')[0],
    })
    setEditingId(g.id); setShowForm(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!activeCycle) { toast.error('No active cycle found'); return }
    try {
      const url = editingId ? `/api/goals/${editingId}` : '/api/goals'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, cycleId: activeCycle.id }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || 'Failed to save goal'); return }
      toast.success(editingId ? 'Goal updated' : 'Goal created')
      setShowForm(false); reset()
      startTransition(() => router.refresh())
    } catch { toast.error('Something went wrong') }
  }

  const handleSubmitForApproval = async (goalId: string) => {
    const res = await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PENDING' }),
    })
    if (res.ok) { toast.success('Goal submitted for approval'); startTransition(() => router.refresh()) }
    else toast.error('Failed to submit goal')
  }

  const handleDelete = async (goalId: string) => {
    if (!confirm('Delete this goal?')) return
    const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Goal deleted'); startTransition(() => router.refresh()) }
    else toast.error('Cannot delete a locked or approved goal')
  }

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) { toast.error('Enter a goal description first'); return }
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/generate-goal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'AI generation failed'); return }
      const parsed = data.goal
      setAiSuggestion(parsed)
      Object.entries(parsed).forEach(([k, v]) => setValue(k as keyof FormData, v as never, { shouldValidate: true, shouldDirty: true }))
      toast.success('✨ AI goal generated! Review and adjust.')
    } catch { toast.error('AI generation failed. Please fill manually.') }
    finally { setAiLoading(false) }
  }

  const statusCounts = {
    ALL: goals.length,
    APPROVED: goals.filter(g => g.status === 'APPROVED').length,
    PENDING: goals.filter(g => g.status === 'PENDING').length,
    DRAFT: goals.filter(g => g.status === 'DRAFT').length,
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-semibold text-[#111] tracking-tight">My Goals</h1>
          <p className="text-[12px] text-[#aaa] mt-1">
            {activeCycle?.name || 'FY2025'} · {goals.length}/8 goals · {totalWeight}% weightage allocated
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {/* Weightage bar */}
      <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-[#aaa] uppercase tracking-wider">Weightage allocation</span>
          <span className={`text-[11px] font-semibold ${totalWeight === 100 ? 'text-[#16a34a]' : totalWeight > 100 ? 'text-[#dc2626]' : 'text-[#b45309]'}`}>
            {totalWeight}% / 100%
          </span>
        </div>
        <div className="progress-bar" style={{ height: 6 }}>
          <div className={`progress-fill ${totalWeight >= 100 ? 'bg-[#16a34a]' : totalWeight >= 70 ? 'bg-[#111]' : 'bg-[#b45309]'}`} style={{ width: `${Math.min(100, totalWeight)}%` }} />
        </div>
        {totalWeight === 100 && <p className="text-[10px] text-[#16a34a] mt-1.5">✓ Perfectly balanced — ready to submit</p>}
        {totalWeight < 100 && <p className="text-[10px] text-[#b45309] mt-1.5">{100 - totalWeight}% remaining to allocate</p>}
        {totalWeight > 100 && <p className="text-[10px] text-[#dc2626] mt-1.5">Over-allocated by {totalWeight - 100}%</p>}
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-4">
        {Object.entries(statusCounts).map(([s, count]) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${filter === s ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-[#777] border-[#e5e5e5] hover:border-[#d4d4d4]'}`}>
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()} ({count})
          </button>
        ))}
      </div>

      {/* Goal cards */}
      <div className="space-y-2.5">
        <AnimatePresence>
          {filtered.map((g) => {
            const latest = g.checkIns.sort((a, b) => b.quarter.localeCompare(a.quarter))[0]
            const pct = calculateProgress(latest?.actualAchieved || 0, g.target, g.uom)
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="bg-white border border-[#e5e5e5] rounded-xl px-5 py-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                <div className="flex items-start gap-4">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${pct >= 80 ? 'bg-[#16a34a]' : pct >= 50 ? 'bg-[#111]' : 'bg-[#dc2626]'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[13px] font-semibold text-[#111]">{g.title}</span>
                      {g.isShared && <span className="inline-flex items-center gap-1 text-[10px] text-[#777] bg-[#f2f2f2] border border-[#e5e5e5] px-1.5 py-0.5 rounded-full"><Link2 className="w-2.5 h-2.5" /> Shared</span>}
                      {g.isLocked && <span className="inline-flex items-center gap-1 text-[10px] text-[#aaa]"><Lock className="w-2.5 h-2.5" /> Locked</span>}
                      <span className={`badge-${getStatusBadgeClass(g.status)}`}>{getStatusLabel(g.status)}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-[#aaa] mb-3">
                      <span>{g.thrustArea}</span>
                      <span>·</span>
                      <span>{getUoMLabel(g.uom)}</span>
                      <span>·</span>
                      <span>Weight: {g.weightage}%</span>
                      <span>·</span>
                      <span>Deadline: {new Date(g.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 max-w-xs">
                        <div className="progress-bar">
                          <div className={`progress-fill ${getProgressBarClass(pct)}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-[11px] text-[#aaa]">{latest?.actualAchieved || 0} / {g.target} {g.uom === 'PERCENTAGE' ? '%' : ''}</span>
                      <span className={`text-[12px] font-semibold ${pct >= 80 ? 'text-[#16a34a]' : pct >= 50 ? 'text-[#111]' : 'text-[#dc2626]'}`}>{pct}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!g.isLocked && g.status === 'DRAFT' && (
                      <>
                        <button onClick={() => openEdit(g)} className="btn-ghost btn-sm p-2"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleSubmitForApproval(g.id)} className="btn-primary btn-sm"><Send className="w-3 h-3" /> Submit</button>
                        <button onClick={() => handleDelete(g.id)} className="btn-ghost btn-sm p-2 text-[#dc2626]"><Trash2 className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                    {g.status === 'RETURNED' && <button onClick={() => openEdit(g)} className="btn-secondary btn-sm"><Edit2 className="w-3 h-3" /> Rework</button>}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="bg-white border border-[#e5e5e5] rounded-xl py-12 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div className="text-[#ddd] mb-3"><Plus className="w-8 h-8 mx-auto" /></div>
            <div className="text-[13px] font-medium text-[#aaa]">No goals yet</div>
            <button onClick={openCreate} className="btn-primary mt-4">Create your first goal</button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-12 px-4 pb-8 overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}
              className="bg-white border border-[#e5e5e5] rounded-2xl w-full max-w-lg overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5]">
                <div>
                  <h2 className="text-[14px] font-semibold text-[#111]">{editingId ? 'Edit goal' : 'Create new goal'}</h2>
                  <p className="text-[11px] text-[#aaa] mt-0.5">{activeCycle?.name || 'FY2025'}</p>
                </div>
                <button onClick={() => setShowForm(false)} className="text-[#aaa] hover:text-[#111] p-1 rounded-lg hover:bg-[#f2f2f2]"><X className="w-4 h-4" /></button>
              </div>

              {/* AI Generator */}
              {!editingId && (
                <div className="px-6 py-4 bg-[#f8f8f8] border-b border-[#e5e5e5]">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#777]" />
                    <span className="text-[11px] font-semibold text-[#777] uppercase tracking-wider">GoalIQ — AI Generator</span>
                  </div>
                  <div className="flex gap-2">
                    <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && generateWithAI()}
                      placeholder='e.g. "Improve team response time" or "Reduce churn"'
                      className="input text-[12px] flex-1" />
                    <button onClick={generateWithAI} disabled={aiLoading} className="btn-primary btn-sm flex-shrink-0">
                      {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Sparkles className="w-3.5 h-3.5" /> Generate</>}
                    </button>
                  </div>
                  {aiSuggestion && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#16a34a]">
                      <CheckCircle2 className="w-3 h-3" /> AI suggestion applied — review and adjust below
                    </div>
                  )}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="label">Goal title *</label>
                  <input {...register('title')} className="input" placeholder="e.g. Increase Q3 Sales Revenue by 20%" />
                  {errors.title && <p className="text-[11px] text-[#dc2626] mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea {...register('description')} rows={2} className="input resize-none" placeholder="Brief context about this goal..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Thrust area *</label>
                    <select {...register('thrustArea')} className="input">
                      <option value="">Select area...</option>
                      {THRUST_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    {errors.thrustArea && <p className="text-[11px] text-[#dc2626] mt-1">{errors.thrustArea.message}</p>}
                  </div>
                  <div>
                    <label className="label">Goal type</label>
                    <select {...register('goalType')} className="input">
                      <option value="INDIVIDUAL">Individual</option>
                      <option value="SHARED">Shared</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Unit of measurement *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {UOM_OPTIONS.map(opt => (
                      <label key={opt.value} className={`flex items-start gap-2.5 p-2.5 border rounded-lg cursor-pointer transition-all ${watch('uom') === opt.value ? 'border-[#111] bg-[#f8f8f8]' : 'border-[#e5e5e5] hover:border-[#d4d4d4]'}`}>
                        <input type="radio" {...register('uom')} value={opt.value} className="mt-0.5 accent-black flex-shrink-0" />
                        <div>
                          <div className="text-[11px] font-medium text-[#111]">{opt.label}</div>
                          <div className="text-[10px] text-[#aaa]">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Target *</label>
                    <input {...register('target')} type="number" className="input" placeholder="e.g. 100" />
                    {errors.target && <p className="text-[11px] text-[#dc2626] mt-1">{errors.target.message}</p>}
                  </div>
                  <div>
                    <label className="label">Weightage % *</label>
                    <input {...register('weightage')} type="number" min={10} max={100} className="input" placeholder="Min 10%" />
                    {errors.weightage && <p className="text-[11px] text-[#dc2626] mt-1">{errors.weightage.message}</p>}
                  </div>
                </div>

                {/* Weightage checker */}
                {watchedWeight && (
                  <div className={`flex items-center gap-2 text-[11px] p-2.5 rounded-lg border ${weightCheck.valid ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]' : 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'}`}>
                    {weightCheck.valid ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />}
                    {weightCheck.message}
                  </div>
                )}

                <div>
                  <label className="label">Deadline *</label>
                  <input {...register('deadline')} type="date" className="input" min={new Date().toISOString().split('T')[0]} />
                  {errors.deadline && <p className="text-[11px] text-[#dc2626] mt-1">{errors.deadline.message}</p>}
                </div>
              </form>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#e5e5e5] bg-[#fafafa]">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost btn-sm">Cancel</button>
                <div className="flex gap-2">
                  <button onClick={handleSubmit(data => onSubmit({ ...data }))} disabled={isSubmitting}
                    className="btn-secondary btn-sm">
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save draft
                  </button>
                  <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="btn-primary btn-sm">
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {editingId ? 'Update goal' : 'Create goal'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

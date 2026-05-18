'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, RotateCcw, X, ChevronDown, User2 } from 'lucide-react'
import { getUoMLabel } from '@/lib/utils'
import type { Goal } from '@/types'

type GoalWithOwner = Goal & { owner: { name: string; email: string; department?: { name: string } }; cycle: { name: string } }

interface Props { goals: GoalWithOwner[]; userRole: string }

export default function ApprovalsClient({ goals: initGoals, userRole }: Props) {
  const router = useRouter()
  const [goals, setGoals] = useState(initGoals)
  const [comments, setComments] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const decide = async (goalId: string, status: string) => {
    setProcessing(goalId)
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, managerComment: comments[goalId] || undefined }),
      })
      if (!res.ok) { toast.error('Action failed'); return }
      setGoals(g => g.filter(x => x.id !== goalId))
      toast.success(status === 'APPROVED' ? '✓ Goal approved' : status === 'RETURNED' ? 'Goal returned for rework' : 'Goal rejected')
      startTransition(() => router.refresh())
    } catch { toast.error('Something went wrong') }
    finally { setProcessing(null) }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-5">
        <h1 className="text-[18px] font-semibold text-[#111] tracking-tight">Approvals</h1>
        <p className="text-[12px] text-[#aaa] mt-1">{goals.length} goal{goals.length !== 1 ? 's' : ''} awaiting review</p>
      </div>

      {goals.length === 0 && (
        <div className="bg-white border border-[#e5e5e5] rounded-xl py-16 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <Check className="w-8 h-8 text-[#ddd] mx-auto mb-3" />
          <div className="text-[13px] font-medium text-[#aaa]">All caught up</div>
          <div className="text-[11px] text-[#ccc] mt-1">No goals pending approval</div>
        </div>
      )}

      <AnimatePresence>
        {goals.map((g) => (
          <motion.div key={g.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="bg-white border border-[#e5e5e5] rounded-xl mb-3 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>

            {/* Header */}
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-[#111] mb-1">{g.title}</div>
                  <div className="flex items-center gap-2 text-[11px] text-[#aaa]">
                    <User2 className="w-3 h-3" />
                    <span className="font-medium text-[#444]">{g.owner.name}</span>
                    <span>·</span>
                    <span>{g.owner.department?.name}</span>
                    <span>·</span>
                    <span>Submitted {g.submittedAt ? new Date(g.submittedAt).toLocaleDateString() : 'recently'}</span>
                  </div>
                </div>
                <button onClick={() => setExpanded(expanded === g.id ? null : g.id)}
                  className="text-[#aaa] hover:text-[#111] p-1 rounded transition-colors">
                  <ChevronDown className={`w-4 h-4 transition-transform ${expanded === g.id ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-4 gap-px bg-[#f2f2f2] border border-[#e5e5e5] rounded-lg overflow-hidden mt-3">
                {[
                  { label: 'Thrust area', val: g.thrustArea },
                  { label: 'UoM', val: getUoMLabel(g.uom) },
                  { label: 'Target', val: `${g.target}${g.uom === 'PERCENTAGE' ? '%' : ''}` },
                  { label: 'Weightage', val: `${g.weightage}%` },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-[#fafafa] px-3 py-2.5">
                    <div className="text-[9px] font-semibold text-[#aaa] uppercase tracking-wider mb-1">{label}</div>
                    <div className="text-[12px] font-semibold text-[#111]">{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expanded details */}
            <AnimatePresence>
              {expanded === g.id && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-5 pb-3 border-t border-[#f2f2f2]">
                    {g.description && <p className="text-[12px] text-[#777] py-3 leading-relaxed">{g.description}</p>}
                    <div className="flex gap-3 text-[11px] text-[#aaa] mt-2">
                      <span>Deadline: <strong className="text-[#444]">{new Date(g.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                      <span>·</span>
                      <span>Cycle: <strong className="text-[#444]">{g.cycle.name}</strong></span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Comment + actions */}
            <div className="px-5 pb-4 pt-0 border-t border-[#f8f8f8]">
              <input
                value={comments[g.id] || ''}
                onChange={e => setComments(c => ({ ...c, [g.id]: e.target.value }))}
                placeholder="Add a comment before deciding (optional)…"
                className="input text-[12px] mb-3 mt-3"
              />
              <div className="flex gap-2">
                <button onClick={() => decide(g.id, 'APPROVED')} disabled={processing === g.id}
                  className="btn-success btn-sm">
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
                <button onClick={() => decide(g.id, 'RETURNED')} disabled={processing === g.id}
                  className="btn-ghost btn-sm">
                  <RotateCcw className="w-3.5 h-3.5" /> Return for rework
                </button>
                <button onClick={() => decide(g.id, 'REJECTED')} disabled={processing === g.id}
                  className="btn-danger btn-sm">
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

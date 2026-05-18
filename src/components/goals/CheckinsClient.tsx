'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Save, Loader2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { calculateProgress, getProgressBarClass } from '@/lib/utils'
import type { Goal } from '@/types'

const QUARTERS = [
  { q: 'Q1', period: 'Apr – Jun', month: 7 },
  { q: 'Q2', period: 'Jul – Sep', month: 10 },
  { q: 'Q3', period: 'Oct – Dec', month: 1 },
  { q: 'Q4', period: 'Jan – Mar', month: 4 },
]

type GoalWithCheckins = Goal & { checkIns: { quarter: string; actualAchieved: number; plannedTarget: number; status: string; employeeComment?: string }[]; cycle: { id: string } }

interface Props { goals: GoalWithCheckins[]; activeCycle: { id: string; phase: string } | null; userId: string }

export default function CheckinsClient({ goals, activeCycle }: Props) {
  const router = useRouter()
  const [activeQ, setActiveQ] = useState(activeCycle?.phase || 'Q2')
  const [values, setValues] = useState<Record<string, { achieved: number; status: string; comment: string }>>(() => {
    const init: Record<string, { achieved: number; status: string; comment: string }> = {}
    goals.forEach(g => {
      const ci = g.checkIns.find(c => c.quarter === activeQ)
      init[g.id] = { achieved: ci?.actualAchieved || 0, status: ci?.status || 'NOT_STARTED', comment: ci?.employeeComment || '' }
    })
    return init
  })
  const [saving, setSaving] = useState<string | null>(null)

  const activePhase = activeCycle?.phase || 'Q2'

  const saveCheckin = async (goalId: string) => {
    if (!activeCycle) { toast.error('No active cycle'); return }
    setSaving(goalId)
    const v = values[goalId]
    const goal = goals.find(g => g.id === goalId)!
    try {
      const res = await fetch('/api/checkins', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId, cycleId: activeCycle.id, quarter: activeQ,
          plannedTarget: goal.target * 0.5, actualAchieved: v.achieved,
          status: v.status, employeeComment: v.comment,
        }),
      })
      if (!res.ok) throw new Error()
      
      const pct = calculateProgress(v.achieved, goal.target, goal.uom)
      if (pct >= 100) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#111111', '#16a34a', '#b45309'] })
      }
      
      toast.success('Check-in saved')
      router.refresh()
    } catch { toast.error('Failed to save check-in') }
    finally { setSaving(null) }
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-5">
        <h1 className="text-[18px] font-semibold text-[#111] tracking-tight">Quarterly Check-ins</h1>
        <p className="text-[12px] text-[#aaa] mt-1">Track your achievement against targets each quarter</p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        {QUARTERS.map(({ q, period }) => {
          const isActive = q === activePhase
          const isSelected = q === activeQ
          const avgPct = goals.length ? Math.round(goals.reduce((a, g) => {
            const ci = g.checkIns.find(c => c.quarter === q)
            return a + (ci ? calculateProgress(ci.actualAchieved, g.target, g.uom) : 0)
          }, 0) / goals.length) : 0

          return (
            <button key={q} onClick={() => setActiveQ(q)}
              className={`bg-white border rounded-xl p-4 text-left transition-all ${isSelected ? 'border-[#111]' : 'border-[#e5e5e5] hover:border-[#d4d4d4]'}`}
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
              <div className="text-[20px] font-bold tracking-tight text-[#111] mb-1">{q}</div>
              <div className="text-[10px] text-[#aaa] mb-2">{period}</div>
              <div className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${isActive ? 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a]' : avgPct > 0 ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]' : 'bg-[#f2f2f2] text-[#aaa] border border-[#e5e5e5]'}`}>
                {isActive ? 'Active window' : avgPct > 0 ? `${avgPct}% avg` : 'Locked'}
              </div>
            </button>
          )
        })}
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f2f2f2]">
          <div>
            <span className="text-[13px] font-semibold text-[#111]">{activeQ} Achievement Entry</span>
            {activeQ === activePhase && <span className="ml-2 text-[10px] font-medium px-2 py-0.5 bg-[#fffbeb] text-[#b45309] border border-[#fde68a] rounded-full">Window open</span>}
          </div>
        </div>

        {goals.length === 0 ? (
          <div className="py-12 text-center text-[12px] text-[#aaa]">No approved goals to check in</div>
        ) : (
          <div className="divide-y divide-[#f8f8f8]">
            {goals.map((g) => {
              const v = values[g.id] || { achieved: 0, status: 'NOT_STARTED', comment: '' }
              const pct = calculateProgress(v.achieved, g.target, g.uom)
              const existing = g.checkIns.find(c => c.quarter === activeQ)
              const isWindowOpen = activeQ === activePhase

              return (
                <motion.div key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="px-5 py-4">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-[#111] mb-0.5">{g.title}</div>
                      <div className="text-[11px] text-[#aaa]">{g.thrustArea} · Target: {g.target}{g.uom === 'PERCENTAGE' ? '%' : ''}</div>
                    </div>
                    <div className={`text-[10px] font-medium px-2 py-1 rounded-full ${pct >= 80 ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]' : pct >= 50 ? 'bg-[#f8f8f8] text-[#444] border border-[#e5e5e5]' : 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a]'}`}>
                      {pct >= 80 ? 'On track' : pct >= 50 ? 'In progress' : 'At risk'}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="label">Actual achievement</label>
                      <input type="number" value={v.achieved} disabled={!isWindowOpen}
                        onChange={e => setValues(x => ({ ...x, [g.id]: { ...x[g.id], achieved: Number(e.target.value) } }))}
                        className={`input text-[12px] ${!isWindowOpen ? 'opacity-60 cursor-not-allowed' : ''}`} />
                    </div>
                    <div>
                      <label className="label">Status</label>
                      <select value={v.status} disabled={!isWindowOpen}
                        onChange={e => setValues(x => ({ ...x, [g.id]: { ...x[g.id], status: e.target.value } }))}
                        className={`input text-[12px] ${!isWindowOpen ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="ON_TRACK">On Track</option>
                        <option value="AT_RISK">At Risk</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Progress</label>
                      <div className="flex items-center gap-2 h-9">
                        <div className="flex-1 progress-bar"><div className={`progress-fill ${getProgressBarClass(pct)}`} style={{ width: `${pct}%` }} /></div>
                        <span className="text-[12px] font-semibold text-[#111] w-9 text-right">{pct}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <input value={v.comment} disabled={!isWindowOpen} placeholder="Add a comment about your progress..."
                      onChange={e => setValues(x => ({ ...x, [g.id]: { ...x[g.id], comment: e.target.value } }))}
                      className={`input text-[12px] flex-1 ${!isWindowOpen ? 'opacity-60 cursor-not-allowed' : ''}`} />
                    {isWindowOpen && (
                      <button onClick={() => saveCheckin(g.id)} disabled={saving === g.id} className="btn-primary btn-sm flex-shrink-0">
                        {saving === g.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                      </button>
                    )}
                  </div>
                  {existing && <p className="text-[10px] text-[#aaa] mt-1.5">Last saved check-in data</p>}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

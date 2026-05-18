'use client'

import Link from 'next/link'
import { ArrowRight, Check, RotateCcw, X } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { calculateProgress, getProgressBarClass, getInitials } from '@/lib/utils'
import type { User, Goal } from '@/types'

interface TeamMember { id: string; name: string; goals: (Goal & { checkIns: { actualAchieved: number }[] })[]; department?: { name: string } }

interface Props {
  user: User
  pendingApprovals: (Goal & { owner: { name: string; department?: { name: string } } })[]
  reports: TeamMember[]
  activeCycle: { name: string; phase: string } | null
}

export default function ManagerDashboard({ pendingApprovals: initPending, reports, activeCycle }: Props) {
  const [pending, setPending] = useState(initPending)

  const handleDecision = async (goalId: string, status: string) => {
    try {
      const res = await fetch(`/api/goals/${goalId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (!res.ok) throw new Error()
      setPending(p => p.filter(g => g.id !== goalId))
      toast.success(status === 'APPROVED' ? 'Goal approved' : status === 'RETURNED' ? 'Returned for rework' : 'Goal rejected')
    } catch {
      toast.error('Action failed. Please try again.')
    }
  }

  const teamCompletion = reports.map(m => {
    const approved = m.goals.filter(g => g.status === 'APPROVED')
    const pct = approved.length ? Math.round(approved.reduce((a, g) => a + calculateProgress(g.checkIns[0]?.actualAchieved || 0, g.target, g.uom), 0) / approved.length) : 0
    return { ...m, completion: pct, pending: m.goals.filter(g => g.status === 'PENDING').length }
  })
  const avgTeam = teamCompletion.length ? Math.round(teamCompletion.reduce((a, m) => a + m.completion, 0) / teamCompletion.length) : 0

  return (
    <div className="p-6 max-w-6xl">
      {activeCycle && (
        <div className="flex items-center gap-3 bg-white border border-[#e5e5e5] rounded-xl px-4 py-3 mb-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div className="w-2 h-2 rounded-full bg-[#16a34a]" />
          <div className="flex-1 text-[13px] font-medium text-[#111]">{reports.length} direct reports · {pending.length} approvals pending</div>
          <span className="text-[10px] font-semibold px-2 py-1 bg-[#fffbeb] text-[#b45309] border border-[#fde68a] rounded-full">{pending.length > 0 ? 'Action needed' : 'All clear'}</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Pending approvals', value: pending.length, color: pending.length > 0 ? '#b45309' : '#111' },
          { label: 'Team avg progress', value: `${avgTeam}%`, color: '#111' },
          { label: 'Team size', value: reports.length, color: '#111' },
          { label: 'At risk', value: teamCompletion.filter(m => m.completion < 50).length, color: '#dc2626' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wider mb-2">{s.label}</div>
            <div className="text-[22px] font-semibold tracking-tight leading-none" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Team completion */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f2f2f2]">
            <span className="text-[13px] font-semibold text-[#111]">Team completion</span>
            <Link href="/team" className="flex items-center gap-1 text-[11px] text-[#aaa] hover:text-[#111]">See all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="p-5 space-y-4">
            {teamCompletion.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#f2f2f2] border border-[#e5e5e5] flex items-center justify-center text-[10px] font-semibold text-[#444] flex-shrink-0">{getInitials(m.name)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium text-[#111]">{m.name}</span>
                    <span className="text-[11px] text-[#aaa]">{m.completion}%</span>
                  </div>
                  <div className="progress-bar"><div className={`progress-fill ${getProgressBarClass(m.completion)}`} style={{ width: `${m.completion}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending approvals */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f2f2f2]">
            <span className="text-[13px] font-semibold text-[#111]">Pending approvals</span>
            <Link href="/approvals" className="flex items-center gap-1 text-[11px] text-[#aaa] hover:text-[#111]">Review all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="divide-y divide-[#f8f8f8]">
            {pending.slice(0, 4).map((g) => (
              <div key={g.id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-[12px] font-medium text-[#111]">{g.title}</div>
                    <div className="text-[10px] text-[#aaa] mt-0.5">{(g as Goal & { owner: { name: string; department?: { name: string } } }).owner.name} · {(g as Goal & { owner: { name: string; department?: { name: string } } }).owner.department?.name} · {g.weightage}%</div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => handleDecision(g.id, 'APPROVED')} className="btn-success text-[11px] px-2.5 py-1"><Check className="w-3 h-3" /> Approve</button>
                  <button onClick={() => handleDecision(g.id, 'RETURNED')} className="btn-ghost text-[11px] px-2.5 py-1"><RotateCcw className="w-3 h-3" /> Return</button>
                  <button onClick={() => handleDecision(g.id, 'REJECTED')} className="btn-danger text-[11px] px-2.5 py-1"><X className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
            {pending.length === 0 && <div className="px-5 py-8 text-center text-[12px] text-[#aaa]">All caught up — no pending approvals</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock, AlertCircle, Plus } from 'lucide-react'
import { calculateProgress, getProgressBarClass, getStatusBadgeClass, getStatusLabel, formatDate } from '@/lib/utils'
import type { Goal, User, Notification } from '@/types'

interface Props {
  user: User
  goals: (Goal & { checkIns: { actualAchieved: number; quarter: string }[] })[]
  notifications: Notification[]
  activeCycle: { name: string; phase: string } | null
}

export default function EmployeeDashboard({ user, goals, notifications, activeCycle }: Props) {
  const approvedGoals = goals.filter(g => g.status === 'APPROVED')
  const totalWeight = goals.reduce((a, g) => a + g.weightage, 0)
  const avgProgress = approvedGoals.length
    ? Math.round(approvedGoals.reduce((a, g) => {
        const latest = g.checkIns[0]
        return a + calculateProgress(latest?.actualAchieved || 0, g.target, g.uom)
      }, 0) / approvedGoals.length)
    : 0
  const completed = goals.filter(g => g.checkIns.some(c => c.actualAchieved >= g.target))

  return (
    <div className="p-6 max-w-6xl">
      {/* Cycle banner */}
      {activeCycle && (
        <div className="flex items-center gap-3 bg-white border border-[#e5e5e5] rounded-xl px-4 py-3 mb-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div className="w-2 h-2 rounded-full bg-[#16a34a] flex-shrink-0" />
          <div className="flex-1">
            <span className="text-[13px] font-medium text-[#111]">{activeCycle.name}</span>
            <span className="text-[12px] text-[#aaa] ml-2">— {activeCycle.phase} phase active</span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] rounded-full">Active</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total goals', value: goals.length, sub: `${approvedGoals.length} approved` },
          { label: 'Avg progress', value: `${avgProgress}%`, sub: '↑ 8% vs Q1', subColor: '#16a34a' },
          { label: 'Weightage', value: `${totalWeight}%`, sub: totalWeight === 100 ? 'Balanced ✓' : 'Needs balance', subColor: totalWeight === 100 ? '#16a34a' : '#dc2626' },
          { label: 'Completed', value: completed.length, sub: `of ${goals.length} goals` },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wider mb-2">{s.label}</div>
            <div className="text-[22px] font-semibold text-[#111] tracking-tight leading-none">{s.value}</div>
            <div className="text-[11px] mt-1.5" style={{ color: s.subColor || '#aaa' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Goals */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f2f2f2]">
            <span className="text-[13px] font-semibold text-[#111]">Goal progress</span>
            <Link href="/goals" className="flex items-center gap-1 text-[11px] text-[#aaa] hover:text-[#111] transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-[#f8f8f8]">
            {goals.slice(0, 5).map((g) => {
              const latest = g.checkIns[0]
              const pct = calculateProgress(latest?.actualAchieved || 0, g.target, g.uom)
              return (
                <div key={g.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pct >= 80 ? 'bg-[#16a34a]' : pct >= 50 ? 'bg-[#111]' : 'bg-[#dc2626]'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-[#111] truncate">{g.title}</div>
                    <div className="text-[10px] text-[#aaa] mt-0.5">{g.thrustArea} · {g.weightage}% weight</div>
                  </div>
                  <span className={`badge-${getStatusBadgeClass(g.status)} text-[10px]`}>{getStatusLabel(g.status)}</span>
                  <div className="w-20 flex-shrink-0">
                    <div className="progress-bar">
                      <div className={`progress-fill ${getProgressBarClass(pct)}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[10px] text-[#aaa] text-right mt-1">{pct}%</div>
                  </div>
                </div>
              )
            })}
            {goals.length === 0 && (
              <div className="px-5 py-8 text-center">
                <div className="text-[#aaa] text-[12px]">No goals yet</div>
                <Link href="/goals" className="inline-flex items-center gap-1.5 mt-3 text-[12px] font-medium text-[#111] bg-[#f2f2f2] px-3 py-1.5 rounded-lg hover:bg-[#ebebeb] transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add your first goal
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Notifications */}
          <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f2f2f2]">
              <span className="text-[13px] font-semibold text-[#111]">Notifications</span>
              {notifications.length > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-[#f2f2f2] text-[#444] rounded-full border border-[#e5e5e5]">{notifications.length}</span>}
            </div>
            <div className="divide-y divide-[#f8f8f8]">
              {notifications.slice(0, 3).map((n) => {
                const Icon = n.type === 'approval' ? CheckCircle2 : n.type === 'reminder' ? Clock : AlertCircle
                return (
                  <div key={n.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="w-6 h-6 rounded-lg bg-[#f8f8f8] border border-[#e5e5e5] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-[#777]" />
                    </div>
                    <div>
                      <div className="text-[12px] text-[#111] leading-relaxed">{n.message}</div>
                      <div className="text-[10px] text-[#aaa] mt-0.5">{n.title}</div>
                    </div>
                  </div>
                )
              })}
              {notifications.length === 0 && <div className="px-5 py-6 text-center text-[12px] text-[#aaa]">All caught up</div>}
            </div>
          </div>

          {/* Upcoming deadlines */}
          <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div className="px-5 py-4 border-b border-[#f2f2f2]">
              <span className="text-[13px] font-semibold text-[#111]">Upcoming deadlines</span>
            </div>
            <div className="divide-y divide-[#f8f8f8]">
              {goals.filter(g => g.status === 'APPROVED').slice(0, 3).map((g) => (
                <div key={g.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-[12px] text-[#111] truncate max-w-[200px]">{g.title}</span>
                  <span className="text-[11px] text-[#aaa] flex-shrink-0">{formatDate(g.deadline)}</span>
                </div>
              ))}
              {goals.length === 0 && <div className="px-5 py-6 text-center text-[12px] text-[#aaa]">No upcoming deadlines</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

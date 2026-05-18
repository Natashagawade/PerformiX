'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { calculateProgress } from '@/lib/utils'

interface DeptData { id: string; name: string; users: { goals: { status: string; target: number; uom: string; checkIns: { actualAchieved: number }[] }[] }[] }

interface Props {
  user: { name: string }
  stats: { totalUsers: number; totalGoals: number; pendingApprovals: number; escalations: number }
  departments: DeptData[]
  auditLogs: { id: string; action: string; details: string; createdAt: Date; user: { name: string } }[]
  activeCycle: { name: string } | null
}

export default function AdminDashboard({ stats, departments, auditLogs, activeCycle }: Props) {
  const deptStats = departments.map(d => {
    const allGoals = d.users.flatMap(u => u.goals.filter(g => g.status === 'APPROVED'))
    const pct = allGoals.length ? Math.round(allGoals.reduce((a, g) => a + calculateProgress(g.checkIns[0]?.actualAchieved || 0, g.target, g.uom), 0) / allGoals.length) : 0
    return { name: d.name, completion: pct }
  }).sort((a, b) => b.completion - a.completion)

  const orgCompletion = deptStats.length ? Math.round(deptStats.reduce((a, d) => a + d.completion, 0) / deptStats.length) : 0

  return (
    <div className="p-6 max-w-6xl">
      {activeCycle && (
        <div className="flex items-center gap-3 bg-white border border-[#e5e5e5] rounded-xl px-4 py-3 mb-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div className="w-2 h-2 rounded-full bg-[#16a34a]" />
          <span className="text-[13px] font-medium text-[#111]">{activeCycle.name}</span>
          <span className="text-[10px] font-semibold px-2 py-1 bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] rounded-full ml-auto">Active</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total employees', value: stats.totalUsers, sub: 'across 6 departments' },
          { label: 'Goals submitted', value: stats.totalGoals, sub: 'this cycle' },
          { label: 'Org completion', value: `${orgCompletion}%`, sub: '↑ 4% vs Q1', color: '#16a34a' },
          { label: 'Escalations', value: stats.escalations, sub: 'pending action', color: stats.escalations > 0 ? '#dc2626' : '#111' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wider mb-2">{s.label}</div>
            <div className="text-[22px] font-semibold tracking-tight leading-none" style={{ color: s.color || '#111' }}>{s.value}</div>
            <div className="text-[11px] text-[#aaa] mt-1.5" style={{ color: s.color ? s.color : undefined }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Department completion */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div className="px-5 py-4 border-b border-[#f2f2f2]"><span className="text-[13px] font-semibold text-[#111]">Department completion</span></div>
          <div className="p-5 space-y-4">
            {deptStats.map((d) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="text-[12px] text-[#444] w-28 flex-shrink-0 truncate">{d.name}</span>
                <div className="flex-1 progress-bar">
                  <div className={`progress-fill ${d.completion >= 80 ? 'bg-[#16a34a]' : d.completion >= 60 ? 'bg-[#111]' : 'bg-[#dc2626]'}`} style={{ width: `${d.completion}%` }} />
                </div>
                <span className="text-[11px] text-[#aaa] w-8 text-right flex-shrink-0">{d.completion}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Audit log */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f2f2f2]">
            <span className="text-[13px] font-semibold text-[#111]">Recent activity</span>
            <Link href="/audit" className="flex items-center gap-1 text-[11px] text-[#aaa] hover:text-[#111]">Full log <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="divide-y divide-[#f8f8f8]">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d4d4d4] flex-shrink-0 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-[#111]">{log.action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}</div>
                  <div className="text-[11px] text-[#aaa] truncate mt-0.5">{log.details}</div>
                </div>
                <div className="text-[10px] text-[#ccc] flex-shrink-0 whitespace-nowrap">{log.user.name.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

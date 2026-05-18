'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Search, LockOpen } from 'lucide-react'
import { calculateProgress, getProgressBarClass, getInitials } from '@/lib/utils'

interface Member {
  id: string; name: string; email: string; role: string
  department?: { name: string }
  goals: { id: string; title: string; target: number; uom: string; weightage: number; checkIns: { actualAchieved: number }[] }[]
}

interface Props { members: Member[]; userRole: string }

export default function TeamClient({ members, userRole }: Props) {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')

  const depts = ['ALL', ...Array.from(new Set(members.map(m => m.department?.name || 'Unknown')))]

  const filtered = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === 'ALL' || m.department?.name === deptFilter
    return matchSearch && matchDept
  })

  const getCompletion = (m: Member) => {
    if (!m.goals.length) return 0
    return Math.round(m.goals.reduce((a, g) => {
      const ci = g.checkIns[0]
      return a + calculateProgress(ci?.actualAchieved || 0, g.target, g.uom)
    }, 0) / m.goals.length)
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-5">
        <h1 className="text-[18px] font-semibold text-[#111] tracking-tight">{userRole === 'ADMIN' ? 'All Employees' : 'My Team'}</h1>
        <p className="text-[12px] text-[#aaa] mt-1">{members.length} {userRole === 'ADMIN' ? 'employees' : 'direct reports'}</p>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search employees…" className="input pl-8 text-[12px]" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="input max-w-[160px] text-[12px]">
          {depts.map(d => <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>)}
        </select>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f2f2f2]">
              {['Employee', 'Department', 'Goals', 'Completion', 'Status', ...(userRole === 'ADMIN' ? ['Actions'] : [])].map(h => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const pct = getCompletion(m)
              const pending = m.goals.filter(g => (g as unknown as { status: string }).status === 'PENDING').length
              return (
                <tr key={m.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#f2f2f2] border border-[#e5e5e5] flex items-center justify-center text-[10px] font-semibold text-[#444] flex-shrink-0">
                        {getInitials(m.name)}
                      </div>
                      <div>
                        <div className="text-[12px] font-medium text-[#111]">{m.name}</div>
                        <div className="text-[10px] text-[#aaa]">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-[#777]">{m.department?.name || '—'}</td>
                  <td className="table-cell">
                    <span className="text-[#111]">{m.goals.length}</span>
                    {pending > 0 && <span className="ml-1.5 text-[9px] font-medium px-1.5 py-0.5 bg-[#fffbeb] text-[#b45309] border border-[#fde68a] rounded-full">{pending} pending</span>}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-20 progress-bar"><div className={`progress-fill ${getProgressBarClass(pct)}`} style={{ width: `${pct}%` }} /></div>
                      <span className="text-[11px] text-[#444]">{pct}%</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${pct >= 80 ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' : pct >= 60 ? 'bg-[#f8f8f8] text-[#444] border-[#e5e5e5]' : 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]'}`}>
                      {pct >= 80 ? 'On track' : pct >= 60 ? 'In progress' : 'At risk'}
                    </span>
                  </td>
                  {userRole === 'ADMIN' && (
                    <td className="table-cell">
                      <button onClick={() => toast.success(`Goal unlock request sent for ${m.name}`)} className="btn-ghost btn-sm text-[11px] px-2 py-1">
                        <LockOpen className="w-3 h-3" /> Unlock
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-[12px] text-[#aaa]">No employees found</div>}
      </div>
    </div>
  )
}

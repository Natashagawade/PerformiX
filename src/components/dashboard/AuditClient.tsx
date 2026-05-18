'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Search, Download } from 'lucide-react'
import { exportToCSV } from '@/lib/utils'

interface Log {
  id: string; action: string; details: string; createdAt: string | Date
  user: { name: string; role: string }; goal?: { title: string } | null
}

const ACTION_ICONS: Record<string, string> = {
  GOAL_APPROVED: '✓', GOAL_REJECTED: '✗', GOAL_RETURNED: '↩', GOAL_SUBMITTED: '→',
  GOAL_CREATED: '+', GOAL_UPDATED: '~', GOAL_UNLOCKED: '🔓', ACHIEVEMENT_UPDATED: '📊',
  CYCLE_CREATED: '📅', USER_CREATED: '👤', SHARED_GOAL_PUSHED: '📤',
}

const ACTION_COLORS: Record<string, string> = {
  GOAL_APPROVED: '#16a34a', GOAL_REJECTED: '#dc2626', GOAL_RETURNED: '#b45309',
  GOAL_SUBMITTED: '#444', GOAL_CREATED: '#111', GOAL_UNLOCKED: '#7c3aed',
  ACHIEVEMENT_UPDATED: '#0369a1', DEFAULT: '#aaa',
}

export default function AuditClient({ logs }: { logs: Log[] }) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')

  const actions = ['ALL', ...Array.from(new Set(logs.map(l => l.action)))]

  const filtered = logs.filter(l => {
    const matchSearch = l.details.toLowerCase().includes(search.toLowerCase()) || l.user.name.toLowerCase().includes(search.toLowerCase())
    const matchAction = actionFilter === 'ALL' || l.action === actionFilter
    return matchSearch && matchAction
  })

  const doExport = () => {
    exportToCSV(filtered.map(l => ({ action: l.action, user: l.user.name, details: l.details, time: new Date(l.createdAt).toISOString() })), 'performix-audit')
    toast.success('Audit log exported')
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-semibold text-[#111] tracking-tight">Audit Log</h1>
          <p className="text-[12px] text-[#aaa] mt-1">Complete action history · {logs.length} entries</p>
        </div>
        <button onClick={doExport} className="btn-secondary btn-sm"><Download className="w-3.5 h-3.5" /> Export</button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs…" className="input pl-8 text-[12px]" />
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="input max-w-[200px] text-[12px]">
          {actions.map(a => <option key={a} value={a}>{a === 'ALL' ? 'All actions' : a.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}</option>)}
        </select>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f2f2f2]">
              {['Action', 'Details', 'User', 'Timestamp'].map(h => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => {
              const color = ACTION_COLORS[log.action] || ACTION_COLORS.DEFAULT
              const icon = ACTION_ICONS[log.action] || '·'
              return (
                <tr key={log.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0 border border-[#e5e5e5]"
                        style={{ background: `${color}10`, color }}>
                        {icon}
                      </div>
                      <span className="text-[11px] font-medium text-[#111] whitespace-nowrap">
                        {log.action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell text-[#777] max-w-[280px] truncate">{log.details}</td>
                  <td className="table-cell">
                    <div className="text-[11px] font-medium text-[#111]">{log.user.name}</div>
                    <div className="text-[10px] text-[#aaa]">{log.user.role.toLowerCase()}</div>
                  </td>
                  <td className="table-cell text-[#aaa] text-[11px] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-[12px] text-[#aaa]">No logs found</div>}
      </div>
    </div>
  )
}

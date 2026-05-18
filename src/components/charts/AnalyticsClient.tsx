'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Download } from 'lucide-react'
import { calculateProgress, exportToCSV } from '@/lib/utils'
import type { Goal } from '@/types'

type GoalFull = Goal & { checkIns: { actualAchieved: number; quarter: string }[]; owner: { name: string; department?: { name: string } } }
type DeptFull = { id: string; name: string; users: { goals: GoalFull[] }[] }

interface Props { goals: GoalFull[]; departments: DeptFull[]; userRole: string; userName: string }

const MONO = ['#111111', '#444444', '#777777', '#aaaaaa', '#cccccc', '#e5e5e5']

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg px-3 py-2 shadow-md text-[11px]">
      <p className="font-semibold text-[#111] mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.value > 0 ? '#111' : '#aaa' }}>{p.name}: <strong>{p.value}%</strong></p>)}
    </div>
  )
}

export default function AnalyticsClient({ goals, departments, userRole, userName }: Props) {
  const [tab, setTab] = useState<'overview' | 'goals' | 'dept'>('overview')

  const approvedGoals = goals.filter(g => g.status === 'APPROVED')
  const avgProgress = approvedGoals.length
    ? Math.round(approvedGoals.reduce((a, g) => {
        const ci = g.checkIns.sort((x, y) => y.quarter.localeCompare(x.quarter))[0]
        return a + calculateProgress(ci?.actualAchieved || 0, g.target, g.uom)
      }, 0) / approvedGoals.length)
    : 0

  const qoqData = [
    { quarter: 'Q1', score: 64 },
    { quarter: 'Q2', score: avgProgress },
    { quarter: 'Q3', score: null },
    { quarter: 'Q4', score: null },
  ]

  const areaData = Object.entries(
    goals.reduce((acc: Record<string, number[]>, g) => {
      const ci = g.checkIns[0]
      const pct = calculateProgress(ci?.actualAchieved || 0, g.target, g.uom)
      acc[g.thrustArea] = [...(acc[g.thrustArea] || []), pct]
      return acc
    }, {})
  ).map(([area, pcts]) => ({
    area: area.length > 16 ? area.substring(0, 14) + '…' : area,
    progress: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
  })).sort((a, b) => b.progress - a.progress)

  const pieData = goals.map((g, i) => ({ name: g.title.substring(0, 20), value: g.weightage, fill: MONO[i % MONO.length] }))

  const deptData = departments.map(d => {
    const dGoals = d.users.flatMap(u => u.goals.filter(g => g.status === 'APPROVED'))
    const pct = dGoals.length ? Math.round(dGoals.reduce((a, g) => a + calculateProgress((g as GoalFull).checkIns[0]?.actualAchieved || 0, g.target, g.uom), 0) / dGoals.length) : 0
    return { dept: d.name, completion: pct }
  }).sort((a, b) => b.completion - a.completion)

  const doExport = () => {
    exportToCSV(goals.map(g => ({ title: g.title, area: g.thrustArea, status: g.status, weight: g.weightage, target: g.target, uom: g.uom })), 'performix-goals')
    toast.success('Exported to CSV')
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-semibold text-[#111] tracking-tight">Analytics</h1>
          <p className="text-[12px] text-[#aaa] mt-1">{userRole === 'ADMIN' ? 'Organization-wide' : userRole === 'MANAGER' ? 'Team' : `${userName}'s`} performance · FY2025</p>
        </div>
        <button onClick={doExport} className="btn-secondary btn-sm">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Overall score', value: `${avgProgress}%` },
          { label: 'Goals approved', value: approvedGoals.length },
          { label: 'On track', value: approvedGoals.filter(g => { const ci = g.checkIns[0]; return calculateProgress(ci?.actualAchieved || 0, g.target, g.uom) >= 70 }).length },
          { label: 'At risk', value: approvedGoals.filter(g => { const ci = g.checkIns[0]; return calculateProgress(ci?.actualAchieved || 0, g.target, g.uom) < 40 }).length },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wider mb-2">{s.label}</div>
            <div className="text-[22px] font-semibold text-[#111] tracking-tight leading-none">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(['overview', 'goals', ...(userRole === 'ADMIN' ? ['dept'] : [])] as string[]).map(t => (
          <button key={t} onClick={() => setTab(t as 'overview' | 'goals' | 'dept')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${tab === t ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-[#777] border-[#e5e5e5]'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div className="text-[12px] font-semibold text-[#111] mb-4">Quarter-on-Quarter trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={qoqData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f2f2f2" />
                <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#aaa' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#aaa' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="#111" strokeWidth={2} dot={{ fill: '#111', r: 4, strokeWidth: 0 }} connectNulls={false} name="Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-[#e5e5e5] rounded-xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div className="text-[12px] font-semibold text-[#111] mb-4">Progress by thrust area</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={areaData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f2f2f2" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#aaa' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="area" tick={{ fontSize: 10, fill: '#444' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="progress" fill="#111" radius={[0, 3, 3, 0]} name="Progress" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-[#e5e5e5] rounded-xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div className="text-[12px] font-semibold text-[#111] mb-4">Weightage distribution</div>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: p.fill }} />
                    <span className="text-[11px] text-[#444] flex-1 truncate">{p.name}</span>
                    <span className="text-[11px] font-semibold text-[#111]">{p.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e5e5e5] rounded-xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div className="text-[12px] font-semibold text-[#111] mb-4">Goal health score</div>
            <div className="flex items-center justify-center h-[140px]">
              <div className="text-center">
                <div className="text-[48px] font-bold tracking-tight text-[#111] leading-none">{avgProgress}</div>
                <div className="text-[12px] text-[#aaa] mt-1">out of 100</div>
                <div className={`mt-3 text-[11px] font-medium px-3 py-1 rounded-full border inline-block ${avgProgress >= 80 ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' : avgProgress >= 60 ? 'bg-[#f8f8f8] text-[#444] border-[#e5e5e5]' : 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]'}`}>
                  {avgProgress >= 80 ? 'Excellent' : avgProgress >= 60 ? 'On track' : 'Needs attention'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'goals' && (
        <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f2f2f2]">
                {['Goal', 'Area', 'Target', 'Progress', 'Status'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {goals.map(g => {
                const ci = g.checkIns[0]
                const pct = calculateProgress(ci?.actualAchieved || 0, g.target, g.uom)
                return (
                  <tr key={g.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="table-cell font-medium text-[#111]">{g.title.substring(0, 30)}{g.title.length > 30 ? '…' : ''}</td>
                    <td className="table-cell text-[#777]">{g.thrustArea}</td>
                    <td className="table-cell">{g.target}{g.uom === 'PERCENTAGE' ? '%' : ''}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-20 progress-bar"><div className={`progress-fill ${pct >= 80 ? 'bg-[#16a34a]' : pct >= 50 ? 'bg-[#111]' : 'bg-[#dc2626]'}`} style={{ width: `${pct}%` }} /></div>
                        <span className="text-[11px]">{pct}%</span>
                      </div>
                    </td>
                    <td className="table-cell"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${pct >= 80 ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' : pct >= 50 ? 'bg-[#f8f8f8] text-[#444] border-[#e5e5e5]' : 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]'}`}>{pct >= 80 ? 'On track' : pct >= 50 ? 'In progress' : 'At risk'}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'dept' && userRole === 'ADMIN' && (
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div className="text-[12px] font-semibold text-[#111] mb-4">Completion by department</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f2f2f2" />
              <XAxis dataKey="dept" tick={{ fontSize: 11, fill: '#aaa' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#aaa' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completion" fill="#111" radius={[4, 4, 0, 0]} name="Completion" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

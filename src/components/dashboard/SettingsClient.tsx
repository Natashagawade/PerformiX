'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Send, AlertTriangle, Loader2 } from 'lucide-react'

interface Cycle { id: string; name: string; phase: string; status: string; startDate: string; endDate: string }
interface Department { id: string; name: string }
interface User { id: string; name: string; email: string; role: string; department?: { name: string } }
interface Escalation { id: string; reason: string; status: string; user: { name: string } }

interface Props { cycles: Cycle[]; users: User[]; escalations: Escalation[]; departments: Department[] }

const ESCALATION_RULES = [
  { rule: 'Goal not submitted', trigger: 'After 5 days of cycle opening', chain: 'Employee → Manager' },
  { rule: 'Approval pending', trigger: 'After 3 days of submission', chain: 'Manager → HR' },
  { rule: 'Q check-in overdue', trigger: 'After 7 days of window open', chain: 'Employee → Manager → HR' },
]

export default function SettingsClient({ cycles, users, escalations, departments }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'cycles' | 'users' | 'escalations' | 'shared'>('users')
  const [sharedGoalTitle, setSharedGoalTitle] = useState('')
  const [sharedDept, setSharedDept] = useState('ALL')
  
  // Add User State
  const [showAddUser, setShowAddUser] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    departmentId: '',
    managerId: ''
  })

  const managers = users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN')

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add user')
      
      toast.success('User created successfully')
      setShowAddUser(false)
      setNewUser({ name: '', email: '', password: '', role: 'EMPLOYEE', departmentId: '', managerId: '' })
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-5">
        <h1 className="text-[18px] font-semibold text-[#111] tracking-tight">System Configuration</h1>
        <p className="text-[12px] text-[#aaa] mt-1">Manage cycles, users, escalations, and shared goals</p>
      </div>

      <div className="flex gap-1 mb-5">
        {(['cycles', 'users', 'escalations', 'shared'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all capitalize ${tab === t ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-[#777] border-[#e5e5e5]'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'cycles' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => toast.success('Cycle creation UI — wire to /api/cycles')} className="btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5" /> New Cycle
            </button>
          </div>
          {cycles.map(c => (
            <div key={c.id} className="bg-white border border-[#e5e5e5] rounded-xl px-5 py-4 flex items-center justify-between" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
              <div>
                <div className="text-[13px] font-semibold text-[#111]">{c.name}</div>
                <div className="text-[11px] text-[#aaa] mt-0.5">{c.phase} · {new Date(c.startDate).toLocaleDateString()} – {new Date(c.endDate).toLocaleDateString()}</div>
              </div>
              <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${c.status === 'ACTIVE' ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' : c.status === 'COMPLETED' ? 'bg-[#f2f2f2] text-[#aaa] border-[#e5e5e5]' : 'bg-[#f8f8f8] text-[#444] border-[#e5e5e5]'}`}>{c.status.toLowerCase()}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-4">
          {!showAddUser ? (
            <div className="flex justify-end">
              <button onClick={() => setShowAddUser(true)} className="btn-primary btn-sm">
                <Plus className="w-3.5 h-3.5" /> Add User
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#e5e5e5] rounded-xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
              <div className="flex justify-between items-center mb-4">
                <div className="text-[13px] font-semibold text-[#111]">Add New User</div>
                <button onClick={() => setShowAddUser(false)} className="text-xs text-[#777] hover:text-[#111]">Cancel</button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name</label>
                    <input required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="input" placeholder="e.g. John Smith" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input required type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="input" placeholder="john@company.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Temporary Password</label>
                    <input required minLength={8} type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="input" placeholder="Min 8 characters" />
                  </div>
                  <div>
                    <label className="label">Role</label>
                    <select required value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="input">
                      <option value="EMPLOYEE">Employee</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin / HR</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Department</label>
                    <select value={newUser.departmentId} onChange={e => setNewUser({ ...newUser, departmentId: e.target.value })} className="input">
                      <option value="">Select Department...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  {newUser.role === 'EMPLOYEE' && (
                    <div>
                      <label className="label">Manager (Optional)</label>
                      <select value={newUser.managerId} onChange={e => setNewUser({ ...newUser, managerId: e.target.value })} className="input">
                        <option value="">No Manager</option>
                        {managers.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={isAdding} className="btn-primary w-full justify-center">
                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User Account'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f2f2f2]">
                  {['Name', 'Email', 'Role', 'Department'].map(h => <th key={h} className="table-header">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="table-cell text-center text-[#777] py-6">No users found.</td>
                  </tr>
                )}
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-[#fafafa]">
                    <td className="table-cell font-medium text-[#111]">{u.name}</td>
                    <td className="table-cell text-[#777]">{u.email}</td>
                    <td className="table-cell"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${u.role === 'ADMIN' ? 'bg-[#111] text-white border-[#111]' : u.role === 'MANAGER' ? 'bg-[#f8f8f8] text-[#444] border-[#e5e5e5]' : 'bg-[#f2f2f2] text-[#777] border-[#e5e5e5]'}`}>{u.role.toLowerCase()}</span></td>
                    <td className="table-cell text-[#777]">{u.department?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'escalations' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div className="px-5 py-3.5 border-b border-[#f2f2f2]">
              <div className="text-[12px] font-semibold text-[#111]">Escalation rules</div>
            </div>
            <div className="divide-y divide-[#f8f8f8]">
              {ESCALATION_RULES.map(r => (
                <div key={r.rule} className="px-5 py-3.5 flex items-start gap-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#b45309] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[12px] font-medium text-[#111]">{r.rule}</div>
                    <div className="text-[11px] text-[#aaa] mt-0.5">{r.trigger}</div>
                    <div className="text-[11px] text-[#777] mt-0.5">→ {r.chain}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {escalations.length > 0 && (
            <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
              <div className="px-5 py-3.5 border-b border-[#f2f2f2]"><div className="text-[12px] font-semibold text-[#111]">Active escalations ({escalations.length})</div></div>
              {escalations.map(e => (
                <div key={e.id} className="px-5 py-3 border-b border-[#f8f8f8] flex items-center justify-between">
                  <div>
                    <div className="text-[12px] text-[#111] font-medium">{e.user.name}</div>
                    <div className="text-[11px] text-[#aaa]">{e.reason}</div>
                  </div>
                  <button onClick={() => toast.success('Escalation resolved')} className="btn-success btn-sm text-[11px]">Resolve</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'shared' && (
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div className="text-[13px] font-semibold text-[#111] mb-4">Push shared goal to team</div>
          <div className="space-y-3">
            <div>
              <label className="label">Goal title</label>
              <input value={sharedGoalTitle} onChange={e => setSharedGoalTitle(e.target.value)}
                className="input" placeholder="e.g. Org-wide Safety Compliance Training" />
            </div>
            <div>
              <label className="label">Target department</label>
              <select value={sharedDept} onChange={e => setSharedDept(e.target.value)} className="input">
                <option value="ALL">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <button onClick={() => { if (!sharedGoalTitle) { toast.error('Enter a goal title'); return } toast.success(`Shared goal pushed to ${sharedDept === 'ALL' ? 'all departments' : sharedDept}`) }}
              className="btn-primary btn-sm">
              <Send className="w-3.5 h-3.5" /> Push Shared Goal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

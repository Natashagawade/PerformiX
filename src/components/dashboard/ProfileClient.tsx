'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, User as UserIcon, Lock, Save, Camera } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string | null
  phoneNumber?: string | null
  department?: { name: string } | null
}

export default function ProfileClient({ user }: { user: User }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  
  // Local state for the form
  const [formData, setFormData] = useState({
    name: user.name || '',
    phoneNumber: user.phoneNumber || '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')
      
      toast.success('Profile updated successfully!')
      setFormData(prev => ({ ...prev, password: '' })) // Clear password field
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Generate initials for avatar fallback
  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-[20px] font-semibold text-[#111] tracking-tight">My Profile</h1>
        <p className="text-[13px] text-[#777] mt-1">Manage your personal information and security settings</p>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <form onSubmit={handleSubmit}>
          
          {/* Header & Avatar Section */}
          <div className="p-6 border-b border-[#f2f2f2] flex items-center gap-6">
            <div className="relative group cursor-pointer">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full object-cover border border-[#e5e5e5]" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#f8f8f8] border border-[#e5e5e5] flex items-center justify-center text-[#111] text-xl font-semibold">
                  {initials}
                </div>
              )}
              {/* Optional: Future avatar upload overlay */}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div>
              <div className="text-[16px] font-semibold text-[#111]">{user.name}</div>
              <div className="text-[13px] text-[#777] mt-0.5">{user.email}</div>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f2f2f2] text-[#444] border border-[#e5e5e5]">
                  {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                </span>
                {user.department && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f8f8f8] text-[#777] border border-[#e5e5e5]">
                    {user.department.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Personal Details */}
            <div>
              <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-2 mb-4">
                <UserIcon className="w-4 h-4 text-[#777]" />
                Personal Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    className="input" 
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phoneNumber} 
                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} 
                    className="input" 
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Email Address <span className="text-[#aaa] font-normal">(Cannot be changed)</span></label>
                  <input type="email" value={user.email} disabled className="input bg-[#f8f8f8] text-[#777]" />
                </div>
              </div>
            </div>

            {/* Security */}
            <div>
              <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-[#777]" />
                Security
              </h2>
              <div className="max-w-md">
                <label className="label">New Password</label>
                <input 
                  type="password" 
                  value={formData.password} 
                  onChange={e => setFormData({ ...formData, password: e.target.value })} 
                  className="input" 
                  placeholder="Leave blank to keep current password"
                  minLength={8}
                />
                <p className="text-[11px] text-[#aaa] mt-1.5">Must be at least 8 characters long.</p>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="p-5 border-t border-[#f2f2f2] bg-[#fafafa] flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto min-w-[120px] justify-center">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

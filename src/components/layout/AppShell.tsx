'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  LayoutDashboard, Target, CalendarCheck, BarChart2, Sparkles,
  ClipboardCheck, Users, ShieldCheck, Settings, LogOut,
  ChevronLeft, ChevronRight, Menu
} from 'lucide-react'
import { NotificationBell } from '@/components/ui/NotificationBell'
import type { User } from '@/types'
import { cn, getInitials } from '@/lib/utils'

interface NavItem { href: string; label: string; icon: React.ElementType; badge?: number; roles: string[] }

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
  { href: '/goals', label: 'My Goals', icon: Target, roles: ['EMPLOYEE', 'MANAGER'] },
  { href: '/approvals', label: 'Approvals', icon: ClipboardCheck, roles: ['MANAGER', 'ADMIN'] },
  { href: '/checkins', label: 'Check-ins', icon: CalendarCheck, roles: ['EMPLOYEE', 'MANAGER'] },
  { href: '/team', label: 'Team', icon: Users, roles: ['MANAGER', 'ADMIN'] },
  { href: '/analytics', label: 'Analytics', icon: BarChart2, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
  { href: '/audit', label: 'Audit Log', icon: ShieldCheck, roles: ['ADMIN', 'MANAGER'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
  { href: '/ai', label: 'AI Insights', icon: Sparkles, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
]

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: 'Employee', MANAGER: 'Manager', ADMIN: 'Admin / HR'
}

export default function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const visibleNav = NAV_ITEMS.filter(n => n.roles.includes(user.role))

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Logged out')
    router.push('/auth/login')
  }

  const topbarTitle = visibleNav.find(n => pathname.startsWith(n.href) && n.href !== '/dashboard')?.label
    || (pathname === '/dashboard' ? 'Overview' : 'PerformiX')

  return (
    <div className="flex h-screen bg-[#f8f8f8] overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 56 : 228 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          'flex flex-col bg-white border-r border-[#e5e5e5] z-50 overflow-hidden flex-shrink-0',
          'fixed inset-y-0 left-0 lg:relative lg:flex',
          mobileOpen ? 'flex' : 'hidden lg:flex'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-13 px-3 border-b border-[#e5e5e5] flex-shrink-0" style={{ height: 52 }}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 bg-[#111] rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden">
                  <div className="font-semibold text-[#111] text-[13px] tracking-tight whitespace-nowrap">PerformiX</div>
                  <div className="text-[9px] text-[#aaa] uppercase tracking-wider whitespace-nowrap">Goal Management</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="text-[#aaa] hover:text-[#777] hover:bg-[#f2f2f2] p-1 rounded-md transition-colors flex-shrink-0">
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-3 pt-1 pb-1 text-[9px] font-semibold text-[#aaa] uppercase tracking-wider">
                Navigation
              </motion.div>
            )}
          </AnimatePresence>

          {visibleNav.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}>
                <div className={cn(
                  'flex items-center gap-2.5 mx-1.5 px-2 py-2 rounded-lg transition-all text-[13px] relative',
                  active ? 'bg-[#f2f2f2] text-[#111]' : 'text-[#777] hover:bg-[#f8f8f8] hover:text-[#444]'
                )}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden whitespace-nowrap flex-1">
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {item.badge && !collapsed && (
                    <span className="bg-[#111] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full">{item.badge}</span>
                  )}
                  {item.badge && collapsed && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#dc2626] rounded-full" />
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-[#e5e5e5] p-2">
          <div className="flex items-center gap-2 px-1.5 py-1.5 rounded-lg hover:bg-[#f8f8f8] cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-full bg-[#f2f2f2] border border-[#e5e5e5] flex items-center justify-center text-[10px] font-semibold text-[#444] flex-shrink-0">
              {getInitials(user.name)}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-hidden">
                  <div className="text-[12px] font-medium text-[#111] whitespace-nowrap overflow-hidden text-ellipsis">{user.name}</div>
                  <div className="text-[10px] text-[#aaa] whitespace-nowrap">{ROLE_LABELS[user.role]}</div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {!collapsed && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={handleLogout} title="Sign out"
                  className="text-[#ccc] hover:text-[#dc2626] transition-colors flex-shrink-0">
                  <LogOut className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="h-[52px] bg-white border-b border-[#e5e5e5] flex items-center px-5 gap-3 flex-shrink-0" style={{ boxShadow: '0 1px 0 #e5e5e5' }}>
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-[#777] hover:text-[#111] mr-1">
            <Menu className="w-4 h-4" />
          </button>
          <h1 className="text-[14px] font-semibold text-[#111] tracking-tight flex-1">{topbarTitle}</h1>

          {/* Role indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f8f8f8] border border-[#e5e5e5] rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
            <span className="text-[11px] text-[#444] font-medium">{ROLE_LABELS[user.role]}</span>
          </div>

          <NotificationBell />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div key={pathname} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

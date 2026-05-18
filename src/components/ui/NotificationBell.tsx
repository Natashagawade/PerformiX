'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCircle2, Clock, AlertCircle, Users, X } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { formatRelativeTime } from '@/lib/utils'

const TYPE_ICONS: Record<string, React.ElementType> = {
  approval: CheckCircle2,
  approval_request: CheckCircle2,
  reminder: Clock,
  rework: AlertCircle,
  escalation: AlertCircle,
  shared: Users,
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markAllRead } = useNotifications()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative text-[#777] hover:text-[#111] p-2 rounded-lg hover:bg-[#f8f8f8] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#dc2626] rounded-full" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#e5e5e5] rounded-xl overflow-hidden z-50"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#f2f2f2]">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-[#111]">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#111] text-white rounded-full">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-[#aaa] hover:text-[#111] transition-colors px-2 py-1 rounded">
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-[#ccc] hover:text-[#aaa] p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-80 overflow-y-auto divide-y divide-[#f8f8f8]">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-[12px] text-[#aaa]">All caught up!</div>
              ) : (
                notifications.map(n => {
                  const Icon = TYPE_ICONS[n.type] || Bell
                  return (
                    <div key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#fafafa] ${!n.read ? 'bg-[#fdfffe]' : ''}`}>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.read ? 'bg-[#f0fdf4] border border-[#bbf7d0]' : 'bg-[#f8f8f8] border border-[#e5e5e5]'}`}>
                        <Icon className={`w-3.5 h-3.5 ${!n.read ? 'text-[#16a34a]' : 'text-[#aaa]'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-[#111]">{n.title}</div>
                        <div className="text-[11px] text-[#777] mt-0.5 leading-relaxed line-clamp-2">{n.message}</div>
                        <div className="text-[10px] text-[#ccc] mt-1">{formatRelativeTime(n.createdAt)}</div>
                      </div>
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a] flex-shrink-0 mt-1.5" />}
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

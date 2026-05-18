import { useState, useEffect } from 'react'
import type { Notification } from '@/types'

export function useNotifications(pollInterval = 30000) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.data || [])
      setUnreadCount((data.data || []).filter((n: Notification) => !n.read).length)
    } catch { /* silent */ }
  }

  const markAsRead = async (ids: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      setNotifications(n => n.map(notif => ids.includes(notif.id) ? { ...notif, read: true } : notif))
      setUnreadCount(c => Math.max(0, c - ids.length))
    } catch { /* silent */ }
  }

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read).map(n => n.id)
    if (unread.length) await markAsRead(unread)
  }

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, pollInterval)
    return () => clearInterval(interval)
  }, [pollInterval])

  return { notifications, unreadCount, markAsRead, markAllRead, refetch: fetchNotifs }
}

import { useState, useEffect } from 'react'
import type { User } from '@/types'

interface UseCurrentUserReturn {
  user: User | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useCurrentUser(): UseCurrentUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setLoading(true)
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(data => { setUser(data.user); setError(null) })
      .catch(err => { setError(err.message); setUser(null) })
      .finally(() => setLoading(false))
  }, [tick])

  return { user, loading, error, refetch: () => setTick(t => t + 1) }
}

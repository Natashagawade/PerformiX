import { useState, useEffect, useCallback } from 'react'
import type { Goal } from '@/types'

interface UseGoalsOptions {
  status?: string
  cycleId?: string
  ownerId?: string
}

export function useGoals(options: UseGoalsOptions = {}) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (options.status) params.set('status', options.status)
      if (options.cycleId) params.set('cycleId', options.cycleId)
      if (options.ownerId) params.set('ownerId', options.ownerId)

      const res = await fetch(`/api/goals?${params}`)
      if (!res.ok) throw new Error('Failed to fetch goals')
      const data = await res.json()
      setGoals(data.data || [])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [options.status, options.cycleId, options.ownerId])

  useEffect(() => { fetch_() }, [fetch_])

  return { goals, loading, error, refetch: fetch_ }
}

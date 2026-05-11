import { useEffect, useState } from 'react'
import type { Desk } from '../data/desks'

interface State {
  desks: Desk[]
  loading: boolean
  error: string | null
}

export function useDesks(): State {
  const [state, setState] = useState<State>({ desks: [], loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    fetch('/api/desks', { credentials: 'include' })
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) {
          setState({ desks: [], loading: false, error: `HTTP ${res.status}` })
          return
        }
        const desks = (await res.json()) as Desk[]
        setState({ desks, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled) setState({ desks: [], loading: false, error: String(err) })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}

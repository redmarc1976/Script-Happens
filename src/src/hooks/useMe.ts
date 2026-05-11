import { useEffect, useState } from 'react'

export interface Me {
  id: string
  full_name: string
  email: string
  upn: string | null
  team: string
  role: string
  location: string
  preferred_neighbourhood: string | null
  identity_provider: string
  is_manager: boolean
  reports: string[]
}

interface State {
  me: Me | null
  loading: boolean
  error: string | null
}

export function useMe(): State {
  const [state, setState] = useState<State>({ me: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    fetch('/api/users/me', { credentials: 'include' })
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 401) {
          setState({ me: null, loading: false, error: null })
          return
        }
        if (!res.ok) {
          setState({ me: null, loading: false, error: `HTTP ${res.status}` })
          return
        }
        const me = (await res.json()) as Me
        setState({ me, loading: false, error: null })
      })
      .catch((err) => {
        if (cancelled) return
        setState({ me: null, loading: false, error: String(err) })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}

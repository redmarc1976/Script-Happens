import { useEffect, useState } from 'react'

export interface CurrentUser {
  id: string
  full_name: string
  email: string
  upn: string | null
  team: string
  role: string
  location: string
  preferred_neighbourhood: string | null
  line_manager_name: string | null
  line_manager_email: string | null
  anchor_days: string[] | null
  default_working_pattern: Record<string, string> | null
  identity_provider: string
}

interface State {
  user: CurrentUser | null
  loading: boolean
  error: string | null
}

export function useCurrentUser(): State {
  const [state, setState] = useState<State>({ user: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    fetch('/api/users/me')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`${res.status} ${res.statusText}`)
        }
        return res.json() as Promise<CurrentUser>
      })
      .then((user) => {
        if (!cancelled) setState({ user, loading: false, error: null })
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ user: null, loading: false, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}

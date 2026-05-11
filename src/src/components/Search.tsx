import { useMemo, useState } from 'react'
import './Search.css'
import { USERS, type User } from '../data/users'

const MAX_RESULTS = 20

function matches(user: User, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return false
  return (
    user.fullName.toLowerCase().includes(q) ||
    user.email.toLowerCase().includes(q) ||
    user.team.toLowerCase().includes(q)
  )
}

function todayStatus(user: User): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
  const key = days[new Date().getDay()]
  const pattern = user.defaultWorkingPattern as unknown as Record<string, string | undefined>
  const status = pattern[key]
  if (!status) return 'Weekend'
  if (status === 'office') return 'In office today'
  if (status === 'remote') return 'Working remotely today'
  return 'Not working today'
}

function Search() {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return []
    return USERS
      .filter(u => matches(u, query))
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
      .slice(0, MAX_RESULTS)
  }, [query])

  return (
    <div className="search-page">
      <header className="search-header">
        <h1 className="search-title">Search for a colleague</h1>
        <p className="search-subtitle">Find by name, email, or team.</p>
        <input
          type="search"
          className="search-input"
          placeholder="Start typing a name..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
      </header>

      <section className="search-results">
        {query.trim() === '' && (
          <p className="search-empty">Type a colleague's name to begin.</p>
        )}
        {query.trim() !== '' && results.length === 0 && (
          <p className="search-empty">No colleagues match "{query}".</p>
        )}
        {results.map(user => (
          <article key={user.id} className="search-card">
            <div className="search-card-row">
              <h2 className="search-card-name">{user.fullName}</h2>
              <span className="search-card-status">{todayStatus(user)}</span>
            </div>
            <p className="search-card-meta">
              <span>{user.team} {user.role}</span>
              <span className="search-card-sep">·</span>
              <span>{user.location}</span>
              <span className="search-card-sep">·</span>
              <a href={`mailto:${user.email}`}>{user.email}</a>
              <span className="search-card-sep">·</span>
              <span>Mgr: {user.lineManager.name}</span>
              <span className="search-card-sep">·</span>
              <span>{user.preferredNeighbourhood}</span>
            </p>
          </article>
        ))}
      </section>
    </div>
  )
}

export default Search

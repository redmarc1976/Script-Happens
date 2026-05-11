import { useEffect, useMemo, useState } from 'react'
import './Search.css'
import { USERS, type User } from '../data/users'

interface SearchProps {
  onOpenFloorPlan: () => void
  groupBookingIds: Set<string>
  onToggleGroupBooking: (userId: string) => void
}

type BookingDialog =
  | { kind: 'closed' }
  | { kind: 'choose' }
  | { kind: 'auto-confirmed' }

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

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const ANCHOR_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

type ForecastStatus = 'office' | 'remote' | 'not-working' | 'weekend'

interface ForecastDay {
  date: Date
  status: ForecastStatus
  isAnchor: boolean
}

function dayStatusOf(user: User, date: Date): ForecastStatus {
  const idx = date.getDay()
  if (idx === 0 || idx === 6) return 'weekend'
  const pattern = user.defaultWorkingPattern as unknown as Record<string, ForecastStatus | undefined>
  return pattern[DAY_KEYS[idx]] ?? 'not-working'
}

function todayStatus(user: User): string {
  const s = dayStatusOf(user, new Date())
  if (s === 'weekend') return 'Weekend'
  if (s === 'office') return 'In office today'
  if (s === 'remote') return 'Working remotely today'
  return 'Not working today'
}

function buildForecast(user: User, days: number): ForecastDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const anchors = new Set(user.anchorDays)
  const result: ForecastDay[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const status = dayStatusOf(user, d)
    const isAnchor = anchors.has(ANCHOR_NAMES[d.getDay()])
    result.push({ date: d, status, isAnchor })
  }
  return result
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}

function statusLabel(s: ForecastStatus): string {
  if (s === 'office') return 'In office'
  if (s === 'remote') return 'Remote'
  if (s === 'not-working') return 'Off'
  return 'Weekend'
}

function Search({ onOpenFloorPlan, groupBookingIds, onToggleGroupBooking }: SearchProps) {
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<BookingDialog>({ kind: 'closed' })

  useEffect(() => {
    if (dialog.kind === 'closed') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDialog({ kind: 'closed' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog.kind])

  const toggleExpanded = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const results = useMemo(() => {
    if (!query.trim()) return []
    return USERS
      .filter(u => matches(u, query))
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
      .slice(0, MAX_RESULTS)
  }, [query])

  const selectedUsers = useMemo(() => {
    return USERS
      .filter(u => groupBookingIds.has(u.id))
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
  }, [groupBookingIds])

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

      <div className="search-main">
      <section className="search-results">
        {query.trim() === '' && (
          <p className="search-empty">Type a colleague's name to begin.</p>
        )}
        {query.trim() !== '' && results.length === 0 && (
          <p className="search-empty">No colleagues match "{query}".</p>
        )}
        {results.map(user => {
          const added = groupBookingIds.has(user.id)
          const expanded = expandedId === user.id
          const forecast = expanded ? buildForecast(user, 14) : null
          return (
            <article key={user.id} className={`search-card${expanded ? ' search-card-expanded' : ''}`}>
              <div className="search-card-body">
                <div className="search-card-row">
                  <button
                    type="button"
                    className="search-card-name"
                    onClick={() => toggleExpanded(user.id)}
                    aria-expanded={expanded}
                  >
                    {user.fullName}
                  </button>
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
                {forecast && (
                  <div className="search-card-forecast">
                    <p className="search-card-forecast-title">
                      Next 14 days · Anchor days: {user.anchorDays.join(', ') || 'none'}
                    </p>
                    <ul className="search-card-forecast-list">
                      {forecast.map(day => (
                        <li
                          key={day.date.toISOString()}
                          className={`search-card-forecast-day status-${day.status}${day.isAnchor ? ' is-anchor' : ''}`}
                          title={day.isAnchor ? `${statusLabel(day.status)} (anchor day)` : statusLabel(day.status)}
                        >
                          <span className="search-card-forecast-dow">{DAY_LABELS[day.date.getDay()]}</span>
                          <span className="search-card-forecast-date">{formatDate(day.date)}</span>
                          <span className="search-card-forecast-status">{statusLabel(day.status)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                type="button"
                className={`search-card-add${added ? ' search-card-add-on' : ''}`}
                onClick={() => onToggleGroupBooking(user.id)}
                aria-pressed={added}
                aria-label={added ? `Remove ${user.fullName} from group booking list` : `Add ${user.fullName} to group booking list`}
                title={added ? 'Added — click to remove' : 'Add to Group Booking List'}
              >
                {added ? (
                  <svg className="search-card-tick" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  'Add to Group Booking List'
                )}
              </button>
            </article>
          )
        })}
      </section>

        <aside className="search-aside">
          <header className="search-aside-head">
            <h2 className="search-aside-title">Group Booking List</h2>
            <span className="search-aside-count">{selectedUsers.length}</span>
          </header>
          {selectedUsers.length === 0 ? (
            <p className="search-aside-empty">
              No colleagues selected yet. Use the green tick on a row to add them.
            </p>
          ) : (
            <>
              <table className="search-aside-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Team</th>
                    <th aria-label="Remove" />
                  </tr>
                </thead>
                <tbody>
                  {selectedUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.fullName}</td>
                      <td>{user.team}</td>
                      <td>
                        <button
                          type="button"
                          className="search-aside-remove"
                          onClick={() => onToggleGroupBooking(user.id)}
                          aria-label={`Remove ${user.fullName} from group booking list`}
                          title="Remove"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                className="search-aside-cta"
                onClick={() => setDialog({ kind: 'choose' })}
              >
                Make a Group Booking
              </button>
            </>
          )}
        </aside>
      </div>

      {dialog.kind !== 'closed' && (
        <div
          className="search-modal-backdrop"
          onClick={() => setDialog({ kind: 'closed' })}
          role="presentation"
        >
          <div
            className="search-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-modal-title"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              className="search-modal-close"
              onClick={() => setDialog({ kind: 'closed' })}
              aria-label="Close"
            >
              ×
            </button>

            {dialog.kind === 'choose' && (
              <>
                <h2 id="search-modal-title" className="search-modal-title">
                  How would you like to book?
                </h2>
                <p className="search-modal-subtitle">
                  {selectedUsers.length} colleague{selectedUsers.length === 1 ? '' : 's'} on your list.
                </p>
                <div className="search-modal-actions">
                  <button
                    type="button"
                    className="search-modal-btn search-modal-btn-primary"
                    onClick={() => {
                      setDialog({ kind: 'closed' })
                      onOpenFloorPlan()
                    }}
                  >
                    Take me to the floor plan
                  </button>
                  <button
                    type="button"
                    className="search-modal-btn search-modal-btn-secondary"
                    onClick={() => setDialog({ kind: 'auto-confirmed' })}
                  >
                    Let Bucking@LBG pick the best seats
                  </button>
                </div>
              </>
            )}

            {dialog.kind === 'auto-confirmed' && (
              <>
                <h2 id="search-modal-title" className="search-modal-title">
                  We're on it.
                </h2>
                <p className="search-modal-subtitle">
                  Bucking@LBG will arrange the best seats for your group of {selectedUsers.length}.
                  You'll get a confirmation shortly.
                </p>
                <div className="search-modal-actions">
                  <button
                    type="button"
                    className="search-modal-btn search-modal-btn-primary"
                    onClick={() => setDialog({ kind: 'closed' })}
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Search

import { useEffect, useMemo, useState } from 'react'
import './Landing.css'
import clock from '../assets/Clock.png'
import { DESKS } from '../data/desks'

interface LandingProps {
  onOpenFloorPlan: () => void
  onOpenSearch: () => void
  onOpenSimpleSearch: () => void
  onOpenProfile: () => void
}

const iconStroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function MapIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" {...iconStroke}>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" {...iconStroke}>
      <circle cx="12" cy="9" r="3" />
      <circle cx="5" cy="7" r="2" />
      <circle cx="19" cy="7" r="2" />
      <path d="M7 20c0-3 2-5 5-5s5 2 5 5" />
      <path d="M2 18c0-2 1-3 3-3" />
      <path d="M22 18c0-2-1-3-3-3" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" {...iconStroke}>
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 5 5" />
    </svg>
  )
}

function PieIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" {...iconStroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v9l6 6" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" {...iconStroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function DeskIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" {...iconStroke}>
      <path d="M3 10h18" />
      <path d="M5 10v8" />
      <path d="M19 10v8" />
    </svg>
  )
}

const MOCK_UPCOMING_DESKS = ['G-W-B1-TL', 'G-W-B2-BR', 'F-NW-R1C2-TR']
const MOCK_UPCOMING_AREAS = ['Windows', 'Windows', 'Open Plan']

// Profile preferences — these will come from the API once the backend is wired up
const PROFILE_OFFICE_DAYS = ['Monday', 'Tuesday', 'Thursday']
const PROFILE_NEIGHBOURHOOD = 'Security'

const DAY_MAP: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
}

function nextOfficeDay(officeDays: string[]): Date {
  const nums = officeDays.map(d => DAY_MAP[d])
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  for (let i = 1; i <= 7; i++) {
    cursor.setDate(cursor.getDate() + 1)
    if (nums.includes(cursor.getDay())) return new Date(cursor)
  }
  return new Date()
}

function nextWeekdays(count: number): Date[] {
  const days: Date[] = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  while (days.length < count) {
    cursor.setDate(cursor.getDate() + 1)
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) days.push(new Date(cursor))
  }
  return days
}

function formatUpcoming(d: Date): { weekday: string; date: string } {
  return {
    weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
    date: d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
  }
}

function Landing({ onOpenFloorPlan, onOpenSearch, onOpenSimpleSearch, onOpenProfile }: LandingProps) {
  const upcoming = nextWeekdays(3)
  const [firstName, setFirstName] = useState('Daniel')
  const [checkedIn, setCheckedIn] = useState(false)

  const suggestedDesk = useMemo(
    () => DESKS.find(d => d.neighbourhood === PROFILE_NEIGHBOURHOOD) ?? DESKS[0],
    []
  )
  const suggestedDay = useMemo(() => nextOfficeDay(PROFILE_OFFICE_DAYS), [])
  const suggestedFmt = formatUpcoming(suggestedDay)

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      // 1. Backend profile (DB-backed, gives full_name)
      try {
        const r = await fetch('/api/users/me')
        if (r.ok) {
          const data = await r.json()
          if (data?.full_name) {
            const first = String(data.full_name).trim().split(/\s+/)[0]
            if (!cancelled && first) {
              setFirstName(first)
              return
            }
          }
        }
      } catch { /* fall through */ }

      // 2. SWA built-in auth principal — works in deployed SWA even without the function app
      try {
        const r = await fetch('/.auth/me')
        if (r.ok) {
          const data = await r.json()
          const p = data?.clientPrincipal
          // Prefer the AAD "name" claim (display name)
          const nameClaim: string | undefined = p?.claims?.find(
            (c: { typ?: string; val?: string }) =>
              c.typ === 'name' || c.typ?.endsWith('/name')
          )?.val
          if (nameClaim) {
            const first = nameClaim.split(/\s+/)[0]
            if (!cancelled && first) {
              setFirstName(first)
              return
            }
          }
          // Otherwise derive from userDetails (usually the UPN/email)
          const details: string | undefined = p?.userDetails
          if (details) {
            const local = details.includes('@') ? details.split('@')[0] : details
            const first = local.split(/[._\-]/)[0]
            if (!cancelled && first) {
              setFirstName(first.charAt(0).toUpperCase() + first.slice(1).toLowerCase())
              return
            }
          }
        }
      } catch { /* keep fallback */ }
    }

    loadUser()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-hero-text">
            <h1 className="landing-hero-title">Hi {firstName}.<br />Your workspace, ready when you are.</h1>
            <p className="landing-hero-subtitle">Find your space in seconds below.</p>
            <div className="landing-hero-actions">
              <button className="landing-btn landing-btn-primary" onClick={onOpenFloorPlan}>Book now</button>
              <button className="landing-btn landing-btn-secondary" onClick={() => setCheckedIn(true)}>Check in</button>
            </div>
          </div>
          <div className="landing-hero-panels">
            <aside className="landing-upcoming" aria-label="Upcoming desk bookings">
              <h2 className="landing-upcoming-title">Upcoming bookings.</h2>
              <ul className="landing-upcoming-list">
                {upcoming.map((d, i) => {
                  const fmt = formatUpcoming(d)
                  return (
                    <li key={d.toISOString()} className="landing-upcoming-item">
                      <div className="landing-upcoming-date">
                        <span className="landing-upcoming-dow">{fmt.weekday}</span>
                        <span className="landing-upcoming-day">{fmt.date}</span>
                      </div>
                      <div className="landing-upcoming-info">
                        <span className="landing-upcoming-desk">{MOCK_UPCOMING_DESKS[i]}</span>
                        <span className="landing-upcoming-area">{MOCK_UPCOMING_AREAS[i]}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </aside>

            <aside className="landing-suggested" aria-label="Suggested desk booking">
              <h2 className="landing-upcoming-title">Suggested booking.</h2>
              <div className="landing-upcoming-item landing-suggested-desk-row">
                <div className="landing-upcoming-date">
                  <span className="landing-upcoming-dow">{suggestedFmt.weekday}</span>
                  <span className="landing-upcoming-day">{suggestedFmt.date}</span>
                </div>
                <div className="landing-upcoming-info">
                  <span className="landing-upcoming-desk">{suggestedDesk.name}</span>
                  <span className="landing-upcoming-area">{suggestedDesk.neighbourhood}</span>
                </div>
              </div>
              <p className="landing-suggested-reason">
                Based on your office days &amp; preferrences.
              </p>
              <button className="landing-btn landing-btn-primary landing-suggested-btn" onClick={onOpenFloorPlan}>
                Book now
              </button>
            </aside>
          </div>
        </div>
        <div className="landing-countdown">
          <img src={clock} alt="" className="landing-countdown-icon" aria-hidden="true" />
          <span>Next release of desks is in 6 Days 7 Hours</span>
        </div>
      </section>

      <section className="landing-quicklinks">
        <button className="landing-quicklink" onClick={onOpenFloorPlan}>
          <MapIcon />
          <h3 className="landing-quicklink-title">Floor Plan</h3>
          <p className="landing-quicklink-text">See the layout of the site and who's sat where.</p>
        </button>
        <button className="landing-quicklink" onClick={onOpenSearch}>
          <PeopleIcon />
          <h3 className="landing-quicklink-title">Team Bookings</h3>
          <p className="landing-quicklink-text">Book for your team, or for your forgetful colleague.</p>
        </button>
        <button className="landing-quicklink" onClick={onOpenSimpleSearch}>
          <SearchIcon />
          <h3 className="landing-quicklink-title">Search</h3>
          <p className="landing-quicklink-text">Looking for a colleague? Look no further.</p>
        </button>
      </section>

      <section className="landing-stats">
        <header className="landing-stats-header">
          <h2 className="landing-stats-heading">Your profile and stats.</h2>
        </header>
        <div className="landing-stats-body">
          <div className="landing-stats-grid">
            <div className="landing-stat">
              <PieIcon />
              <div>
                <p className="landing-stat-label">Your check in rate is:</p>
                <p className="landing-stat-value">80%.</p>
              </div>
            </div>
            <div className="landing-stat">
              <ClockIcon />
              <div>
                <p className="landing-stat-label">Your average check in time is:</p>
                <p className="landing-stat-value">9:00am</p>
              </div>
            </div>
            <div className="landing-stat">
              <DeskIcon />
              <div>
                <p className="landing-stat-label">So far this year you've booked:</p>
                <p className="landing-stat-value">100 Desks</p>
              </div>
            </div>
          </div>
          <button className="landing-btn landing-btn-primary" onClick={onOpenProfile}>Profile</button>
        </div>
      </section>

      {checkedIn && (
        <div className="booking-confirm-backdrop" role="presentation">
          <div
            className="booking-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkin-confirm-title"
          >
            <div className="booking-confirm-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="36" height="36">
                <circle cx="12" cy="12" r="11" fill="#16a34a" />
                <path
                  d="M7 12.5l3.5 3.5L17 8.5"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 id="checkin-confirm-title" className="booking-confirm-title">
              You're checked in!
            </h2>
            <p className="booking-confirm-text">
              Welcome in, {firstName}. Your check-in has been recorded for today.
            </p>
            <button
              type="button"
              className="booking-confirm-btn"
              onClick={() => setCheckedIn(false)}
              autoFocus
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Landing

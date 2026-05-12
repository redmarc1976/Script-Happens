import { useState } from 'react'
import './Profile.css'

const iconStroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
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

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const

const MY_STATS = {
  checkInRate: 80,
  avgCheckIn: '9:00am',
  desksBooked: 100,
}

type Colleague = {
  id: string
  name: string
  checkInRate: number
  avgCheckIn: string
  desksBooked: number
}

const COLLEAGUES: Colleague[] = [
  { id: 'sarah-chen',     name: 'Sarah Chen',     checkInRate: 92, avgCheckIn: '8:30am', desksBooked: 142 },
  { id: 'james-patel',    name: 'James Patel',    checkInRate: 76, avgCheckIn: '9:15am', desksBooked: 88  },
  { id: 'emily-roberts',  name: 'Emily Roberts',  checkInRate: 85, avgCheckIn: '9:00am', desksBooked: 120 },
  { id: 'mark-thompson',  name: 'Mark Thompson',  checkInRate: 95, avgCheckIn: '8:45am', desksBooked: 156 },
  { id: 'olivia-brown',   name: 'Olivia Brown',   checkInRate: 70, avgCheckIn: '9:30am', desksBooked: 75  },
  { id: 'liam-walsh',     name: 'Liam Walsh',     checkInRate: 88, avgCheckIn: '8:55am', desksBooked: 110 },
  { id: 'aisha-khan',     name: 'Aisha Khan',     checkInRate: 90, avgCheckIn: '8:40am', desksBooked: 132 },
]

function parseTime(s: string): number {
  const m = s.toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/)
  if (!m) return 0
  let h = parseInt(m[1], 10)
  const mm = parseInt(m[2], 10)
  const period = m[3]
  if (period === 'pm' && h !== 12) h += 12
  if (period === 'am' && h === 12) h = 0
  return h * 60 + mm
}

function timeDiffLabel(theirs: string, mine: string): string {
  const diff = parseTime(theirs) - parseTime(mine)
  if (diff === 0) return 'same as you'
  const abs = Math.abs(diff)
  return diff < 0 ? `${abs} min earlier than you` : `${abs} min later than you`
}

function numDiffLabel(theirs: number, mine: number, suffix = ''): string {
  const diff = theirs - mine
  if (diff === 0) return 'same as you'
  const sign = diff > 0 ? '+' : '−'
  return `${sign}${Math.abs(diff)}${suffix} vs you`
}

const ACCESSIBILITY_OPTIONS = [
  'EHAD desk',
  'Near entrance',
  'Ground floor',
  'Near accessible bathroom',
  'Near lift',
  'Wide aisle access',
]

const INITIAL_PROFILE = {
  fullName: 'Daniel Judge',
  role: 'Senior Engineer',
  team: 'Security',
  email: 'daniel.judge@example.com',
  location: 'Leeds',
  lineManager: 'Sam Carter',
  preferredNeighbourhood: 'Security',
  officeDays: ['Monday', 'Tuesday', 'Thursday'] as string[],
  accessibilityNeeds: [] as string[],
}

type ProfileData = typeof INITIAL_PROFILE

const TEXT_ROWS: { key: Exclude<keyof ProfileData, 'officeDays' | 'accessibilityNeeds'>; label: string; editable: boolean }[] = [
  { key: 'fullName', label: 'Name', editable: false },
  { key: 'role', label: 'Role', editable: false },
  { key: 'team', label: 'Team', editable: false },
  { key: 'email', label: 'Email', editable: false },
  { key: 'location', label: 'Location', editable: true },
  { key: 'lineManager', label: 'Line manager', editable: false },
  { key: 'preferredNeighbourhood', label: 'Preferred neighbourhood', editable: true },
]

function Profile() {
  const [profile, setProfile] = useState<ProfileData>(INITIAL_PROFILE)
  const [draft, setDraft] = useState<ProfileData>(INITIAL_PROFILE)
  const [isEditing, setIsEditing] = useState(false)
  const [compareQuery, setCompareQuery] = useState('')
  const [selectedColleague, setSelectedColleague] = useState<Colleague | null>(null)

  const compareResults = compareQuery.trim()
    ? COLLEAGUES
        .filter(c => c.name.toLowerCase().includes(compareQuery.trim().toLowerCase()))
        .slice(0, 5)
    : []

  function pickColleague(c: Colleague) {
    setSelectedColleague(c)
    setCompareQuery('')
  }

  function clearComparison() {
    setSelectedColleague(null)
    setCompareQuery('')
  }

  function startEdit() {
    setDraft(profile)
    setIsEditing(true)
  }

  function done() {
    setProfile(draft)
    setIsEditing(false)
  }

  function cancel() {
    setIsEditing(false)
  }

  function updateText(key: typeof TEXT_ROWS[number]['key'], value: string) {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  function toggleDay(day: string) {
    setDraft(prev => ({
      ...prev,
      officeDays: prev.officeDays.includes(day)
        ? prev.officeDays.filter(d => d !== day)
        : [...prev.officeDays, day],
    }))
  }

  function toggleAccessibility(option: string) {
    setDraft(prev => ({
      ...prev,
      accessibilityNeeds: prev.accessibilityNeeds.includes(option)
        ? prev.accessibilityNeeds.filter(o => o !== option)
        : [...prev.accessibilityNeeds, option],
    }))
  }

  const officeDaysSorted = (days: string[]) =>
    WEEKDAYS.filter(d => days.includes(d)).join(', ')

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-hero-content">
          <h1 className="profile-hero-title">My Profile.</h1>
          <p className="profile-hero-subtitle">Your account, preferences, and bookings.</p>
          {!isEditing && (
            <div className="profile-hero-actions">
              <button className="profile-btn profile-btn-primary" onClick={startEdit}>Edit details</button>
              <button className="profile-btn profile-btn-secondary">Change password</button>
            </div>
          )}
        </div>
      </section>

      <div className="profile-content">
      <section className="profile-details">
        <header className="profile-details-header">
          <h2 className="profile-details-heading">Preferences.</h2>
        </header>
        <div className="profile-details-body">
          {TEXT_ROWS.map(row => (
            <div className="profile-row" key={row.key}>
              <label className="profile-label" htmlFor={`field-${row.key}`}>{row.label}</label>
              {isEditing && row.editable ? (
                <input
                  id={`field-${row.key}`}
                  className="profile-input"
                  value={draft[row.key]}
                  onChange={e => updateText(row.key, e.target.value)}
                />
              ) : (
                <span className="profile-value">{profile[row.key]}</span>
              )}
            </div>
          ))}

          <div className="profile-row">
            <span className="profile-label">Office days</span>
            {isEditing ? (
              <div className="profile-checkbox-group">
                {WEEKDAYS.map(day => (
                  <label key={day} className="profile-checkbox-label">
                    <input
                      type="checkbox"
                      checked={draft.officeDays.includes(day)}
                      onChange={() => toggleDay(day)}
                    />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
            ) : (
              <span className="profile-value">{officeDaysSorted(profile.officeDays) || 'None'}</span>
            )}
          </div>

          <div className="profile-row">
            <span className="profile-label">Accessibility preferences</span>
            {isEditing ? (
              <div className="profile-checkbox-group">
                {ACCESSIBILITY_OPTIONS.map(option => (
                  <label key={option} className="profile-checkbox-label">
                    <input
                      type="checkbox"
                      checked={draft.accessibilityNeeds.includes(option)}
                      onChange={() => toggleAccessibility(option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <span className="profile-value">
                {profile.accessibilityNeeds.length > 0 ? profile.accessibilityNeeds.join(', ') : 'None'}
              </span>
            )}
          </div>

          {isEditing && (
            <div className="profile-edit-actions">
              <button className="profile-btn profile-btn-primary" onClick={done}>Done</button>
              <button className="profile-btn profile-btn-secondary" onClick={cancel}>Cancel</button>
            </div>
          )}
        </div>
      </section>

      <section className="profile-stats">
        <header className="profile-stats-header">
          <h2 className="profile-stats-heading">Stats.</h2>
        </header>
        <div className="profile-stats-body">
          <div className="profile-stat">
            <PieIcon />
            <div>
              <p className="profile-stat-label">Your check in rate is:</p>
              <p className="profile-stat-value">80%.</p>
            </div>
          </div>
          <div className="profile-stat">
            <ClockIcon />
            <div>
              <p className="profile-stat-label">Your average check in time is:</p>
              <p className="profile-stat-value">9:00am</p>
            </div>
          </div>
          <div className="profile-stat">
            <DeskIcon />
            <div>
              <p className="profile-stat-label">So far this year you've booked:</p>
              <p className="profile-stat-value">100 Desks</p>
            </div>
          </div>
          <h3 className="profile-compare-title">Competitive?</h3>
          <p className="profile-compare-text">Search for a colleague to see how you compare.</p>

          <input
            className="profile-input"
            placeholder="Type a colleague's name..."
            value={compareQuery}
            onChange={(e) => setCompareQuery(e.target.value)}
          />

          {compareResults.length > 0 && (
            <ul className="profile-compare-results">
              {compareResults.map(c => (
                <li key={c.id}>
                  <button className="profile-compare-result" onClick={() => pickColleague(c)}>
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedColleague && (
            <div className="profile-compare-card">
              <div className="profile-compare-card-header">
                <span className="profile-compare-card-name">{selectedColleague.name}</span>
                <button className="profile-compare-clear" onClick={clearComparison} aria-label="Clear">×</button>
              </div>
              <div className="profile-stat">
                <PieIcon />
                <div>
                  <p className="profile-stat-label">Check in rate:</p>
                  <p className="profile-stat-value">
                    {selectedColleague.checkInRate}%
                    <span className="profile-diff"> ({numDiffLabel(selectedColleague.checkInRate, MY_STATS.checkInRate, '%')})</span>
                  </p>
                </div>
              </div>
              <div className="profile-stat">
                <ClockIcon />
                <div>
                  <p className="profile-stat-label">Average check in:</p>
                  <p className="profile-stat-value">
                    {selectedColleague.avgCheckIn}
                    <span className="profile-diff"> ({timeDiffLabel(selectedColleague.avgCheckIn, MY_STATS.avgCheckIn)})</span>
                  </p>
                </div>
              </div>
              <div className="profile-stat">
                <DeskIcon />
                <div>
                  <p className="profile-stat-label">Desks booked this year:</p>
                  <p className="profile-stat-value">
                    {selectedColleague.desksBooked}
                    <span className="profile-diff"> ({numDiffLabel(selectedColleague.desksBooked, MY_STATS.desksBooked)})</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      </div>

    </div>
  )
}

export default Profile

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

const INITIAL_PROFILE = {
  fullName: 'Daniel Judge',
  role: 'Senior Engineer',
  team: 'Security',
  email: 'daniel.judge@example.com',
  location: 'Leeds',
  lineManager: 'Sam Carter',
  preferredNeighbourhood: 'Security',
  officeDays: ['Monday', 'Tuesday', 'Thursday'] as string[],
}

type ProfileData = typeof INITIAL_PROFILE

const TEXT_ROWS: { key: Exclude<keyof ProfileData, 'officeDays'>; label: string; editable: boolean }[] = [
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
        </div>
      </section>
      </div>
    </div>
  )
}

export default Profile

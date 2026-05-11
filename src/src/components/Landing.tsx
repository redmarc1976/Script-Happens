import './Landing.css'
import clock from '../assets/Clock.png'

interface LandingProps {
  onOpenFloorPlan: () => void
  onOpenSearch: () => void
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

function Landing({ onOpenFloorPlan, onOpenSearch, onOpenProfile }: LandingProps) {
  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">Hi Daniel.<br />Your workspace, ready when you are.</h1>
          <p className="landing-hero-subtitle">Find your space in seconds below.</p>
          <div className="landing-hero-actions">
            <button className="landing-btn landing-btn-primary" onClick={onOpenFloorPlan}>Book now</button>
            <button className="landing-btn landing-btn-secondary">Check in</button>
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
        <button className="landing-quicklink">
          <PeopleIcon />
          <h3 className="landing-quicklink-title">Team Bookings</h3>
          <p className="landing-quicklink-text">Book for your team, or for your forgetful colleague.</p>
        </button>
        <button className="landing-quicklink" onClick={onOpenSearch}>
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
    </div>
  )
}

export default Landing

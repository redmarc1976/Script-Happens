import { useState, useRef, useEffect } from 'react'
import './Sidebar.css'
import Calendar from './Calendar'
import type { User } from '../data/users'
import { getDeskById } from '../data/desks'

interface SidebarProps {
  isOpen: boolean
  selectedFloor: string
  onFloorChange: (floor: string) => void
  selectedDate: Date
  onDateChange: (date: Date) => void
  selectedColleagues: User[]
  activeColleagueId: string | null
  assignments: Map<string, string>
  onColleagueClick: (id: string) => void
  canBook: boolean
  onBook: () => void
}

const FLOORS = [
  { id: 'ground', label: 'Ground' },
  { id: 'first', label: 'First' },
]

const SITES = [
  { id: 'bristol', label: 'Bristol' },
  { id: 'edinburgh', label: 'Edinburgh' },
  { id: 'halifax', label: 'Halifax' },
  { id: 'leeds', label: 'Leeds' },
  { id: 'london', label: 'London' },
  { id: 'manchester', label: 'Manchester' },
]

function Sidebar({
  isOpen,
  selectedFloor,
  onFloorChange,
  selectedDate,
  onDateChange,
  selectedColleagues,
  activeColleagueId,
  assignments,
  onColleagueClick,
  canBook,
  onBook,
}: SidebarProps) {
  const [selectedSite, setSelectedSite] = useState('leeds')
  const [siteMenuOpen, setSiteMenuOpen] = useState(false)
  const siteRef = useRef<HTMLDivElement>(null)
  const [waitlistJoined, setWaitlistJoined] = useState(false)
  const [showWaitlistPopup, setShowWaitlistPopup] = useState(false)

  const MOCK_QUEUE_START = 5

  function joinWaitlist() {
    setWaitlistJoined(true)
    setShowWaitlistPopup(true)
  }

  const dayName = selectedDate.toLocaleDateString(undefined, { weekday: 'long' })
  const floorLabel = selectedFloor.charAt(0).toUpperCase() + selectedFloor.slice(1)
  const groupSize = selectedColleagues.length
  const queueEnd = MOCK_QUEUE_START + Math.max(groupSize - 1, 0)
  const isGroup = groupSize > 1

  useEffect(() => {
    if (!siteMenuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (siteRef.current && !siteRef.current.contains(e.target as Node)) {
        setSiteMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [siteMenuOpen])

  const selectedSiteLabel = SITES.find(s => s.id === selectedSite)?.label

  return (
    <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-section">
        <div className="sidebar-section-label">Site</div>
        <div className="sidebar-site-dropdown" ref={siteRef}>
          <button
            className="sidebar-nav-item active sidebar-site-trigger"
            onClick={() => setSiteMenuOpen(!siteMenuOpen)}
            aria-expanded={siteMenuOpen}
          >
            <span>{selectedSiteLabel}</span>
            <span className={`sidebar-site-chevron ${siteMenuOpen ? 'open' : ''}`}>▾</span>
          </button>
          {siteMenuOpen && (
            <div className="sidebar-site-options" role="menu">
              {SITES.map(site => (
                <button
                  key={site.id}
                  className={`sidebar-nav-item ${selectedSite === site.id ? 'active' : ''}`}
                  role="menuitem"
                  onClick={() => {
                    setSelectedSite(site.id)
                    setSiteMenuOpen(false)
                  }}
                >
                  {site.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="sidebar-section">
        <div className="sidebar-section-label">Floor</div>
        {FLOORS.map(floor => (
          <button
            key={floor.id}
            className={`sidebar-nav-item ${selectedFloor === floor.id ? 'active' : ''}`}
            onClick={() => onFloorChange(floor.id)}
          >
            {floor.label}
          </button>
        ))}
      </div>
      {selectedColleagues.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-section-label">Select Desks</div>
          {selectedColleagues.map(user => {
            const deskId = assignments.get(user.id)
            const desk = deskId ? getDeskById(deskId) : null
            const isActive = activeColleagueId === user.id
            return (
              <button
                key={user.id}
                type="button"
                className={`sidebar-colleague${isActive ? ' active' : ''}`}
                onClick={() => onColleagueClick(user.id)}
                aria-pressed={isActive}
              >
                <span className="sidebar-colleague-name">{user.fullName}</span>
                <span className={`sidebar-colleague-desk${desk ? ' assigned' : ''}`}>
                  {desk ? desk.name : 'Pick a desk'}
                </span>
              </button>
            )
          })}
          {canBook && (
            <button
              type="button"
              className="sidebar-book-btn"
              onClick={onBook}
            >
              Book
            </button>
          )}
        </div>
      )}
      <div className="sidebar-waitlist-row">
        <button
          type="button"
          className={`sidebar-waitlist-btn${waitlistJoined ? ' joined' : ''}`}
          onClick={() => waitlistJoined ? setWaitlistJoined(false) : joinWaitlist()}
        >
          {waitlistJoined ? '✓ On waitlist' : '+ Join waitlist'}
        </button>
      </div>
      <Calendar selectedDate={selectedDate} onDateChange={onDateChange} />

      {showWaitlistPopup && (
        <div className="booking-confirm-backdrop" role="presentation">
          <div
            className="booking-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="waitlist-title"
          >
            <div className="booking-confirm-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="36" height="36">
                <circle cx="12" cy="12" r="11" fill="#006a4d" />
                <path d="M12 7v5l3 2" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <h2 id="waitlist-title" className="booking-confirm-title">
              {isGroup ? 'Your group is on the waitlist' : 'You\'re on the waitlist'}
            </h2>
            <p className="booking-confirm-text">
              {isGroup ? (
                <>
                  Your group of <strong>{groupSize}</strong> are positions <strong>{MOCK_QUEUE_START}–{queueEnd}</strong> in the queue for <strong>{dayName}</strong> on the <strong>{floorLabel} Floor</strong>.<br /><br />
                  Desks will be automatically assigned in order as they become available. If anyone in the group books a desk independently, they'll be removed from the waitlist.
                </>
              ) : (
                <>
                  You're <strong>#{MOCK_QUEUE_START}</strong> in the queue for <strong>{dayName}</strong> on the <strong>{floorLabel} Floor</strong>.<br /><br />
                  You'll automatically be assigned a desk once one becomes available. If you book a desk yourself, you'll be removed from the waitlist.
                </>
              )}
            </p>
            <button
              type="button"
              className="booking-confirm-btn"
              onClick={() => setShowWaitlistPopup(false)}
              autoFocus
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar

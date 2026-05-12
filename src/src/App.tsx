
import './App.css'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import MainPanel from './components/MainPanel'
import ChatPanel from './components/ChatPanel'
import Landing from './components/Landing'
import Search from './components/Search'
import Profile from './components/Profile'
import Tour from './components/Tour'
import AlertBanner from './components/AlertBanner'
import { useMemo, useState } from 'react'
import { USERS } from './data/users'
import { getBookingForUser } from './data/bookings'
import { getDeskById } from './data/desks'

const CURRENT_USER_ID = '00000000-0000-0000-0000-000000000001'
const GOOD_HABITS = [
  "When you're not in, release your desk so others can book it.",
  'Always check in when you arrive at the office.',
  "Don't overbook — only reserve desks for days you're planning to be in.",
  'Keep your profile and Outlook days up to date so your team knows when to expect you.',
]

type View = 'landing' | 'floorplan' | 'search' | 'simplesearch' | 'profile'

function App() {
  const [chatOpen, setChatOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState('ground')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<View>('landing')
  const [groupBookingIds, setGroupBookingIds] = useState<Set<string>>(new Set())
  const [activeColleagueId, setActiveColleagueId] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map())
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [bookingConflict, setBookingConflict] = useState<{ userName: string; deskName: string; floor: string } | null>(null)
  const [showHabits, setShowHabits] = useState(false)
  const [showTour, setShowTour] = useState(true)

  const selectedColleagues = useMemo(() => {
    return USERS
      .filter(u => groupBookingIds.has(u.id))
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
  }, [groupBookingIds])

  const allAssigned =
    selectedColleagues.length > 0 &&
    selectedColleagues.every(u => assignments.has(u.id))

  const confirmBooking = () => {
    for (const user of selectedColleagues) {
      const existing = getBookingForUser(user.id, selectedDate)
      if (existing) {
        const desk = getDeskById(existing.deskId)
        setBookingConflict({
          userName: user.fullName,
          deskName: desk?.name.toUpperCase() ?? existing.deskId.toUpperCase(),
          floor: desk ? desk.floor.charAt(0).toUpperCase() + desk.floor.slice(1) + ' Floor' : 'Unknown Floor',
        })
        return
      }
    }
    setBookingConfirmed(true)
  }

  const dismissBookingConfirmation = () => {
    setBookingConfirmed(false)
    setGroupBookingIds(new Set())
    setAssignments(new Map())
    setActiveColleagueId(null)
    setCurrentView('landing')
  }

  const toggleGroupBooking = (userId: string) => {
    setGroupBookingIds(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
    setAssignments(prev => {
      if (!prev.has(userId)) return prev
      const next = new Map(prev)
      next.delete(userId)
      return next
    })
    setActiveColleagueId(prev => (prev === userId ? null : prev))
  }

  const assignDeskToActive = (deskId: string) => {
    if (!activeColleagueId) return
    setAssignments(prev => {
      const next = new Map(prev)
      for (const [cid, did] of next) {
        if (did === deskId) next.delete(cid)
      }
      next.set(activeColleagueId, deskId)
      return next
    })
    // Auto-advance to the next unassigned colleague in group bookings.
    // In single-user mode keep the user active so they can change their desk.
    if (selectedColleagues.length <= 1) return
    const orderedIds = selectedColleagues.map(u => u.id)
    const startIdx = orderedIds.indexOf(activeColleagueId)
    let nextActive: string | null = null
    for (let i = 1; i <= orderedIds.length; i++) {
      const candidate = orderedIds[(startIdx + i) % orderedIds.length]
      if (candidate === activeColleagueId) continue
      if (!assignments.has(candidate)) {
        nextActive = candidate
        break
      }
    }
    setActiveColleagueId(nextActive)
  }

  const showHabitsIfFirst = () => {
    setShowHabits(true)
  }

  const openFloorPlan = () => {
    setCurrentView('floorplan')
    showHabitsIfFirst()
    if (!activeColleagueId) {
      const first = selectedColleagues.find(u => !assignments.has(u.id))
      if (first) setActiveColleagueId(first.id)
    }
  }

  const openSelfBooking = () => {
    setGroupBookingIds(new Set([CURRENT_USER_ID]))
    setAssignments(new Map())
    setActiveColleagueId(CURRENT_USER_ID)
    setCurrentView('floorplan')
    showHabitsIfFirst()
  }

  const openSelfBookingWithDesk = (deskId: string) => {
    const desk = getDeskById(deskId)
    setGroupBookingIds(new Set([CURRENT_USER_ID]))
    setAssignments(new Map([[CURRENT_USER_ID, deskId]]))
    setActiveColleagueId(CURRENT_USER_ID)
    if (desk) setSelectedFloor(desk.floor)
    setCurrentView('floorplan')
    showHabitsIfFirst()
  }

  const dismissHabits = () => {
    setShowHabits(false)
  }

  return (
    <div className={`app-container ${chatOpen ? 'chat-open' : ''} ${currentView !== 'floorplan' ? 'landing-view' : ''}`}>
      <TopBar
        onToggle={() => setChatOpen(!chatOpen)}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onHome={() => setCurrentView('landing')}
        onProfile={() => setCurrentView('profile')}
      />
      <AlertBanner />
      {currentView === 'landing' ? (
        <Landing
          onOpenFloorPlan={openSelfBooking}
          onBookSuggestedDesk={openSelfBookingWithDesk}
          onOpenSearch={() => setCurrentView('search')}
          onOpenSimpleSearch={() => setCurrentView('simplesearch')}
          onOpenProfile={() => setCurrentView('profile')}
          onStartTour={() => setShowTour(true)}
        />
      ) : currentView === 'search' ? (
        <Search
          onOpenFloorPlan={openFloorPlan}
          groupBookingIds={groupBookingIds}
          onToggleGroupBooking={toggleGroupBooking}
          onSetGroupBooking={(ids) => {
            setGroupBookingIds(ids)
            setAssignments(new Map())
            setActiveColleagueId(null)
            openFloorPlan()
          }}
        />
      ) : currentView === 'simplesearch' ? (
        <Search simpleMode />
      ) : currentView === 'profile' ? (
        <Profile />
      ) : (
        <>
          <Sidebar
            isOpen={sidebarOpen}
            selectedFloor={selectedFloor}
            onFloorChange={setSelectedFloor}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedColleagues={selectedColleagues}
            activeColleagueId={activeColleagueId}
            assignments={assignments}
            onColleagueClick={setActiveColleagueId}
            canBook={allAssigned}
            onBook={confirmBooking}
          />
          <MainPanel
            selectedFloor={selectedFloor}
            selectedDate={selectedDate}
            activeColleagueId={activeColleagueId}
            activeColleagueName={selectedColleagues.find(u => u.id === activeColleagueId)?.fullName ?? null}
            assignments={assignments}
            onAssignDesk={assignDeskToActive}
          />
        </>
      )}
      {chatOpen && <ChatPanel />}
      {currentView === 'landing' && showTour && (
        <Tour onDismiss={() => setShowTour(false)} />
      )}

      {bookingConflict && (
        <div className="booking-confirm-backdrop" role="presentation">
          <div
            className="booking-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-conflict-title"
          >
            <div className="booking-confirm-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="36" height="36">
                <circle cx="12" cy="12" r="11" fill="#dc2626" />
                <path d="M12 7v5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1.2" fill="#ffffff" />
              </svg>
            </div>
            <h2 id="booking-conflict-title" className="booking-confirm-title">Desk already booked</h2>
            <p className="booking-confirm-text">
              <strong>{bookingConflict.userName}</strong> already has a desk booked on this date.<br /><br />
              Existing booking: <strong>{bookingConflict.deskName}</strong> on the <strong>{bookingConflict.floor}</strong>.<br /><br />
              Only one desk can be booked per person per day. Please select a different date.
            </p>
            <button
              type="button"
              className="booking-confirm-btn"
              onClick={() => setBookingConflict(null)}
              autoFocus
            >
              OK
            </button>
          </div>
        </div>
      )}


      {showHabits && (
        <div className="booking-confirm-backdrop" role="presentation">
          <div
            className="booking-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="habits-title"
          >
            <div className="booking-confirm-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="36" height="36">
                <circle cx="12" cy="12" r="11" fill="#024731" />
                <path d="M12 6a4 4 0 0 1 2 7.46V15a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1.54A4 4 0 0 1 12 6z" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M10 18h4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M10 20h4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h2 id="habits-title" className="booking-confirm-title">Good booking habits</h2>
            <ul className="habits-list">
              {GOOD_HABITS.map((tip, i) => (
                <li key={i} className="habits-item">{tip}</li>
              ))}
            </ul>
            <div className="habits-actions">
              <button
                type="button"
                className="booking-confirm-btn"
                onClick={dismissHabits}
                autoFocus
              >
                Got it
              </button>
              <button
                type="button"
                className="booking-confirm-btn"
                onClick={() => { dismissHabits(); setCurrentView('profile') }}
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {bookingConfirmed && (
        <div className="booking-confirm-backdrop" role="presentation">
          <div
            className="booking-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-confirm-title"
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
            <h2 id="booking-confirm-title" className="booking-confirm-title">
              {selectedColleagues.length === 1 && selectedColleagues[0].id === CURRENT_USER_ID
                ? 'Desk booked'
                : 'Group booking confirmed'}
            </h2>
            <p className="booking-confirm-text">
              {selectedColleagues.length === 1 && selectedColleagues[0].id === CURRENT_USER_ID
                ? 'Your desk has been booked. An email confirmation will be sent to you shortly.'
                : `${selectedColleagues.length} desk${selectedColleagues.length === 1 ? '' : 's'} booked. An email confirmation will be sent to you and each colleague shortly.`}
            </p>
            <button
              type="button"
              className="booking-confirm-btn"
              onClick={dismissBookingConfirmation}
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

export default App

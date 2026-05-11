
import './App.css'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import MainPanel from './components/MainPanel'
import ChatPanel from './components/ChatPanel'
import Landing from './components/Landing'
import Search from './components/Search'
import { useMemo, useState } from 'react'
import { USERS } from './data/users'

type View = 'landing' | 'floorplan' | 'search'

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

  const selectedColleagues = useMemo(() => {
    return USERS
      .filter(u => groupBookingIds.has(u.id))
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
  }, [groupBookingIds])

  const allAssigned =
    selectedColleagues.length > 0 &&
    selectedColleagues.every(u => assignments.has(u.id))

  const confirmBooking = () => {
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
    // Auto-advance: pick next colleague (in alphabetical order) without an assignment
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

  const openFloorPlan = () => {
    setCurrentView('floorplan')
    // Auto-select the first unassigned colleague so the user can start clicking desks
    if (!activeColleagueId) {
      const first = selectedColleagues.find(u => !assignments.has(u.id))
      if (first) setActiveColleagueId(first.id)
    }
  }

  return (
    <div className={`app-container ${chatOpen ? 'chat-open' : ''} ${currentView === 'landing' || currentView === 'search' ? 'landing-view' : ''}`}>
      <TopBar
        onToggle={() => setChatOpen(!chatOpen)}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onHome={() => setCurrentView('landing')}
      />
      {currentView === 'landing' ? (
        <Landing
          onOpenFloorPlan={() => setCurrentView('floorplan')}
          onOpenSearch={() => setCurrentView('search')}
        />
      ) : currentView === 'search' ? (
        <Search
          onOpenFloorPlan={openFloorPlan}
          groupBookingIds={groupBookingIds}
          onToggleGroupBooking={toggleGroupBooking}
        />
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
            activeColleagueId={activeColleagueId}
            activeColleagueName={selectedColleagues.find(u => u.id === activeColleagueId)?.fullName ?? null}
            assignments={assignments}
            onAssignDesk={assignDeskToActive}
          />
        </>
      )}
      {chatOpen && <ChatPanel />}

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
              Group booking confirmed
            </h2>
            <p className="booking-confirm-text">
              {selectedColleagues.length} desk{selectedColleagues.length === 1 ? '' : 's'} booked.
              An email confirmation will be sent to you and each colleague shortly.
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

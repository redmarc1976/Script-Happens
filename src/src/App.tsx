
import './App.css'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import MainPanel from './components/MainPanel'
import ChatPanel from './components/ChatPanel'
import Landing from './components/Landing'
import Search from './components/Search'
import Profile from './components/Profile'
import { useState } from 'react'

type View = 'landing' | 'floorplan' | 'search' | 'profile'

function App() {
  const [chatOpen, setChatOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState('ground')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<View>('landing')

  return (
    <div className={`app-container ${chatOpen ? 'chat-open' : ''} ${currentView !== 'floorplan' ? 'landing-view' : ''}`}>
      <TopBar
        onToggle={() => setChatOpen(!chatOpen)}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onHome={() => setCurrentView('landing')}
        onProfile={() => setCurrentView('profile')}
      />
      {currentView === 'landing' ? (
        <Landing
          onOpenFloorPlan={() => setCurrentView('floorplan')}
          onOpenSearch={() => setCurrentView('search')}
        />
      ) : currentView === 'search' ? (
        <Search />
      ) : currentView === 'profile' ? (
        <Profile />
      ) : (
        <>
          <Sidebar isOpen={sidebarOpen} selectedFloor={selectedFloor} onFloorChange={setSelectedFloor} selectedDate={selectedDate} onDateChange={setSelectedDate} />
          <MainPanel selectedFloor={selectedFloor} />
        </>
      )}
      {chatOpen && <ChatPanel />}
    </div>
  )
}

export default App

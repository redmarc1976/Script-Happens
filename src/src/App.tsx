
import './App.css'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import MainPanel from './components/MainPanel'
import ChatPanel from './components/ChatPanel'
import Landing from './components/Landing'
import Search from './components/Search'
import { useState } from 'react'

type View = 'landing' | 'floorplan' | 'search'

function App() {
  const [chatOpen, setChatOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState('ground')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<View>('landing')

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
        <Search />
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

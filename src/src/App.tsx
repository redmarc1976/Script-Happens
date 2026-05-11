
import './App.css'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import MainPanel from './components/MainPanel'
import ChatPanel from './components/ChatPanel'
import Landing from './components/Landing'
import { useState } from 'react'

type View = 'landing' | 'floorplan'

function App() {
  const [chatOpen, setChatOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState('ground')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<View>('landing')

  return (
    <div className={`app-container ${chatOpen ? 'chat-open' : ''} ${currentView === 'landing' ? 'landing-view' : ''}`}>
      <TopBar
        onToggle={() => setChatOpen(!chatOpen)}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onHome={() => setCurrentView('landing')}
      />
      {currentView === 'landing' ? (
        <Landing onOpenFloorPlan={() => setCurrentView('floorplan')} />
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

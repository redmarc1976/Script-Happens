
import './App.css'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import MainPanel from './components/MainPanel'
import ChatPanel from './components/ChatPanel'
import { useState } from 'react'



function App() {
  //state of chat window pane
  const [chatOpen, setChatOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState('ground')

  return (
    <div className={`app-container ${chatOpen ? 'chat-open' : ''}`}>
      <TopBar
        onToggle={() => setChatOpen(!chatOpen)}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <Sidebar isOpen={sidebarOpen} selectedFloor={selectedFloor} onFloorChange={setSelectedFloor} />
      <MainPanel selectedFloor={selectedFloor} />
      {chatOpen && <ChatPanel />}
    </div>
  )
}

export default App

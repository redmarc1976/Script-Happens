import './TopBar.css'

interface TopBarProps {
  onToggle: () => void
  onMenuToggle: () => void
}

function TopBar({ onToggle, onMenuToggle }: TopBarProps) {
  return (
    <div className="topbar">
      <div className="topbar-brand">
        <button className="topbar-hamburger" onClick={onMenuToggle}>☰</button>
        <span className="topbar-logo">⬡</span>
        <span className="topbar-title">NexaSpace</span>
      </div>
      <button className="topbar-chat-btn" onClick={onToggle}>💬 Assistant</button>
    </div>
  )
}

export default TopBar





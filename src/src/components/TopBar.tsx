import './TopBar.css'
import logo from '../assets/Logo.png'

interface TopBarProps {
  onToggle: () => void
  onMenuToggle: () => void
}

function TopBar({ onToggle, onMenuToggle }: TopBarProps) {
  return (
    <div className="topbar">
      <div className="topbar-brand">
        <button className="topbar-hamburger" onClick={onMenuToggle}>☰</button>
        <img src={logo} alt="Bucking@LBG logo" className="topbar-logo" />
        <span className="topbar-title">Bucking@LBG</span>
      </div>
      <button className="topbar-chat-btn" onClick={onToggle}>💬 Assistant</button>
    </div>
  )
}

export default TopBar





import { useState, useRef, useEffect } from 'react'
import './TopBar.css'
import logo from '../assets/Logo.png'
import profile from '../assets/Profile.png'

interface TopBarProps {
  onToggle: () => void
  onMenuToggle: () => void
}

function TopBar({ onToggle, onMenuToggle }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <div className="topbar">
      <div className="topbar-brand">
        <button className="topbar-hamburger" onClick={onMenuToggle}>☰</button>
        <img src={logo} alt="Bucking@LBG logo" className="topbar-logo" />
        <span className="topbar-title">Bucking@LBG</span>
      </div>
      <div className="topbar-actions">
        <button className="topbar-chat-btn" onClick={onToggle}>💬 Assistant</button>
        <div className="topbar-profile-wrapper" ref={profileRef}>
          <button
            className="topbar-profile-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Profile menu"
            aria-expanded={menuOpen}
          >
            <img src={profile} alt="Profile" className="topbar-profile-img" />
          </button>
          {menuOpen && (
            <div className="topbar-profile-menu" role="menu">
              <button className="topbar-profile-item" role="menuitem" onClick={() => setMenuOpen(false)}>Profile</button>
              <button className="topbar-profile-item" role="menuitem" onClick={() => setMenuOpen(false)}>Settings</button>
              <button className="topbar-profile-item" role="menuitem" onClick={() => setMenuOpen(false)}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TopBar

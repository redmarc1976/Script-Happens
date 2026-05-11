import { useState, useRef, useEffect } from 'react'
import './TopBar.css'
import logo from '../assets/Logo.png'
import home from '../assets/Home.png'
import profile from '../assets/Profile.png'
import { useMe } from '../hooks/useMe'

interface TopBarProps {
  onToggle: () => void
  onMenuToggle: () => void
  onHome: () => void
  onProfile: () => void
}

function TopBar({ onToggle, onMenuToggle, onHome, onProfile }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const { me, loading, error } = useMe()

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
        <button className="topbar-brand-btn" onClick={onHome} aria-label="Home">
          <img src={logo} alt="Bucking@LBG logo" className="topbar-logo" />
          <span className="topbar-title">Bucking@LBG</span>
        </button>
        <button className="topbar-home-btn" onClick={onHome} aria-label="Home">
          <img src={home} alt="Home" className="topbar-home-icon" />
        </button>
      </div>
      <div className="topbar-actions">
        <button className="topbar-chat-btn" onClick={onToggle}>💬 Assistant</button>
        {!loading && !me && !error ? (
          <a className="topbar-signin-btn" href="/.auth/login/aad">Sign in</a>
        ) : (
          <div className="topbar-profile-wrapper" ref={profileRef}>
            <button
              className="topbar-profile-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Profile menu"
              aria-expanded={menuOpen}
            >
              <img
                src="/api/me/photo"
                alt={me?.full_name ?? 'Profile'}
                className="topbar-profile-img"
                onError={e => { (e.target as HTMLImageElement).src = profile }}
              />
              {me && <span className="topbar-profile-name">{me.full_name}</span>}
            </button>
            {menuOpen && (
              <div className="topbar-profile-menu" role="menu">
                {me && <div className="topbar-profile-item topbar-profile-name">{me.full_name}</div>}
                <button className="topbar-profile-item" role="menuitem" onClick={() => { onProfile(); setMenuOpen(false) }}>Profile</button>
                <button className="topbar-profile-item" role="menuitem" onClick={() => setMenuOpen(false)}>Settings</button>
                <a className="topbar-profile-item" role="menuitem" href="/.auth/logout?post_logout_redirect_uri=/">Logout</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TopBar

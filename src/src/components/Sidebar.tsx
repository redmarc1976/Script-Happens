import { useState, useRef, useEffect } from 'react'
import './Sidebar.css'
import Calendar from './Calendar'

interface SidebarProps {
  isOpen: boolean
  selectedFloor: string
  onFloorChange: (floor: string) => void
  selectedDate: Date
  onDateChange: (date: Date) => void
}

const FLOORS = [
  { id: 'ground', label: 'Ground' },
  { id: 'first', label: 'First' },
]

const SITES = [
  { id: 'bristol', label: 'Bristol' },
  { id: 'edinburgh', label: 'Edinburgh' },
  { id: 'halifax', label: 'Halifax' },
  { id: 'leeds', label: 'Leeds' },
  { id: 'london', label: 'London' },
  { id: 'manchester', label: 'Manchester' },
]

function Sidebar({ isOpen, selectedFloor, onFloorChange, selectedDate, onDateChange }: SidebarProps) {
  const [selectedSite, setSelectedSite] = useState('leeds')
  const [siteMenuOpen, setSiteMenuOpen] = useState(false)
  const siteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!siteMenuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (siteRef.current && !siteRef.current.contains(e.target as Node)) {
        setSiteMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [siteMenuOpen])

  const selectedSiteLabel = SITES.find(s => s.id === selectedSite)?.label

  return (
    <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-section">
        <div className="sidebar-section-label">Site</div>
        <div className="sidebar-site-dropdown" ref={siteRef}>
          <button
            className="sidebar-nav-item active sidebar-site-trigger"
            onClick={() => setSiteMenuOpen(!siteMenuOpen)}
            aria-expanded={siteMenuOpen}
          >
            <span>{selectedSiteLabel}</span>
            <span className={`sidebar-site-chevron ${siteMenuOpen ? 'open' : ''}`}>▾</span>
          </button>
          {siteMenuOpen && (
            <div className="sidebar-site-options" role="menu">
              {SITES.map(site => (
                <button
                  key={site.id}
                  className={`sidebar-nav-item ${selectedSite === site.id ? 'active' : ''}`}
                  role="menuitem"
                  onClick={() => {
                    setSelectedSite(site.id)
                    setSiteMenuOpen(false)
                  }}
                >
                  {site.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="sidebar-section">
        <div className="sidebar-section-label">Floor</div>
        {FLOORS.map(floor => (
          <button
            key={floor.id}
            className={`sidebar-nav-item ${selectedFloor === floor.id ? 'active' : ''}`}
            onClick={() => onFloorChange(floor.id)}
          >
            {floor.label}
          </button>
        ))}
      </div>
      <Calendar selectedDate={selectedDate} onDateChange={onDateChange} />
    </div>
  )
}

export default Sidebar

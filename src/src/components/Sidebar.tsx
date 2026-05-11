import { useState } from 'react'
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
  { id: 'london', label: 'London' },
  { id: 'bristol', label: 'Bristol' },
  { id: 'edinburgh', label: 'Edinburgh' },
  { id: 'halifax', label: 'Halifax' },
  { id: 'manchester', label: 'Manchester' },
]

function Sidebar({ isOpen, selectedFloor, onFloorChange, selectedDate, onDateChange }: SidebarProps) {
  const [selectedSite, setSelectedSite] = useState('london')

  return (
    <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-section">
        <div className="sidebar-section-label">Site</div>
        <select
          className="sidebar-site-select"
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
        >
          {SITES.map(site => (
            <option key={site.id} value={site.id}>{site.label}</option>
          ))}
        </select>
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

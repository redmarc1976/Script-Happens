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

function Sidebar({ isOpen, selectedFloor, onFloorChange, selectedDate, onDateChange }: SidebarProps) {
  return (
    <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-section">
        <div className="sidebar-section-label">Site</div>
        <button className="sidebar-nav-item active">Site 1</button>
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

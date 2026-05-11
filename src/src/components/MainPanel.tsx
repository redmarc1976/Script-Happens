import { useState } from 'react'
import groundImg from '../assets/floorplans/ground.png'
import firstImg from '../assets/floorplans/first.png'
import { getDesksByFloor } from '../data/desks'
import type { Floor, Desk } from '../data/desks'
import './MainPanel.css'

interface MainPanelProps {
  selectedFloor: string
}

const FLOOR_IMAGES: Record<string, string> = {
  ground: groundImg,
  first: firstImg,
}

function MainPanel({ selectedFloor }: MainPanelProps) {
  const image = FLOOR_IMAGES[selectedFloor]
  const desks = getDesksByFloor(selectedFloor as Floor)
  const [hoveredDesk, setHoveredDesk] = useState<Desk | null>(null)

  return (
    <div className="main-panel">
      {image && (
        <div className="floor-plan-wrapper">
          <img
            src={image}
            alt={`${selectedFloor} floor plan`}
            className="floor-plan-image"
          />
          {desks.map(desk => (
            <div
              key={desk.id}
              className="desk-dot"
              style={{ left: `${desk.x}%`, top: `${desk.y}%` }}
              onMouseEnter={() => setHoveredDesk(desk)}
              onMouseLeave={() => setHoveredDesk(null)}
            />
          ))}
          {hoveredDesk && (
            <div
              className="desk-tooltip"
              style={{
                left: `${hoveredDesk.x}%`,
                top: `${hoveredDesk.y}%`,
              }}
            >
              <div className="desk-tooltip-name">{hoveredDesk.name}</div>
              <div className="desk-tooltip-row">
                <span className="desk-tooltip-label">Floor</span>
                <span>{hoveredDesk.floor.charAt(0).toUpperCase() + hoveredDesk.floor.slice(1)}</span>
              </div>
              <div className="desk-tooltip-row">
                <span className="desk-tooltip-label">Area</span>
                <span>{hoveredDesk.neighbourhood}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MainPanel

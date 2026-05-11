import { useMemo, useState } from 'react'
import groundImg from '../assets/floorplans/ground.png'
import firstImg from '../assets/floorplans/first.png'
import { getDesksByFloor } from '../data/desks'
import type { Desk, Floor } from '../data/desks'
import { useDesks } from '../hooks/useDesks'
import './MainPanel.css'

interface MainPanelProps {
  selectedFloor: string
  activeColleagueId: string | null
  activeColleagueName: string | null
  assignments: Map<string, string>
  onAssignDesk: (deskId: string) => void
}

const FLOOR_IMAGES: Record<string, string> = {
  ground: groundImg,
  first: firstImg,
}

function MainPanel({
  selectedFloor,
  activeColleagueId,
  activeColleagueName,
  assignments,
  onAssignDesk,
}: MainPanelProps) {
  const image = FLOOR_IMAGES[selectedFloor]
  const { desks: apiDesks } = useDesks()
  const desks = apiDesks.length > 0
    ? apiDesks.filter(d => d.floor === selectedFloor)
    : getDesksByFloor(selectedFloor as Floor)
  const [hoveredDesk, setHoveredDesk] = useState<Desk | null>(null)

  const deskToColleague = useMemo(() => {
    const m = new Map<string, string>()
    for (const [cid, did] of assignments) m.set(did, cid)
    return m
  }, [assignments])

  const inGroupBookingMode = activeColleagueId !== null || assignments.size > 0

  return (
    <div className="main-panel">
      {image && (
        <div className="floor-plan-wrapper">
          {inGroupBookingMode && (
            <div className="floor-plan-banner">
              {activeColleagueName
                ? `Click a desk to assign it to ${activeColleagueName}.`
                : 'All selected colleagues have a desk. Click a name in the sidebar to reassign.'}
            </div>
          )}
          <img
            src={image}
            alt={`${selectedFloor} floor plan`}
            className="floor-plan-image"
          />
          {desks.map(desk => {
            const assignedTo = deskToColleague.get(desk.id)
            const classes = ['desk-dot']
            if (assignedTo) classes.push('desk-dot-assigned')
            if (activeColleagueId && assignedTo === activeColleagueId) classes.push('desk-dot-active')
            return (
              <div
                key={desk.id}
                className={classes.join(' ')}
                style={{ left: `${desk.x}%`, top: `${desk.y}%` }}
                onMouseEnter={() => setHoveredDesk(desk)}
                onMouseLeave={() => setHoveredDesk(null)}
                onClick={() => {
                  if (activeColleagueId) onAssignDesk(desk.id)
                }}
                role={activeColleagueId ? 'button' : undefined}
                aria-label={activeColleagueId ? `Assign ${desk.name} to ${activeColleagueName}` : undefined}
              />
            )
          })}
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
              {deskToColleague.has(hoveredDesk.id) && (
                <div className="desk-tooltip-row">
                  <span className="desk-tooltip-label">Assigned</span>
                  <span>booked</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MainPanel

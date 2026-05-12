import { useEffect, useRef, useState } from 'react'
import './Tour.css'

interface TourStep {
  selector: string
  title: string
  description: string
}

const STEPS: TourStep[] = [
  {
    selector: '#tour-book-now',
    title: 'Book a desk',
    description: 'Click here to browse the floor plan and pick your desk for the day.',
  },
  {
    selector: '#tour-check-in',
    title: 'Check in',
    description: 'Already at the office? Tap here to record your arrival.',
  },
  {
    selector: '#tour-upcoming',
    title: 'Upcoming bookings',
    description: 'Your upcoming desk bookings appear here. Use Release to free a desk if your plans change, or Handover to transfer it directly to a colleague.',
  },
  {
    selector: '#tour-suggested',
    title: 'Suggested booking',
    description: 'Based on your office days and preferences, we suggest a desk for your next office day.',
  },
  {
    selector: '#tour-floorplan',
    title: 'Floor plan',
    description: 'Explore the office layout and see where your colleagues are sitting.',
  },
  {
    selector: '#tour-team',
    title: 'Team bookings',
    description: 'Book desks for your entire team in one go — great for anchor days.',
  },
  {
    selector: '#tour-search',
    title: 'Search',
    description: 'Looking for a colleague? Search by name to find where they\'re sitting.',
  },
]

const TOOLTIP_W = 300
const TOOLTIP_H_ESTIMATE = 170
const GAP = 14
const EDGE_PADDING = 10

interface SpotlightRect { top: number; left: number; width: number; height: number }

function getRect(selector: string): SpotlightRect | null {
  const el = document.querySelector(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

function Tour({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0)
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const currentStep = STEPS[step]
  const isLast = step === STEPS.length - 1

  useEffect(() => {
    const update = () => {
      const rect = getRect(currentStep.selector)
      setSpotlight(rect)
      if (rect) {
        document.querySelector(currentStep.selector)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [currentStep.selector])

  // Position tooltip below or above the spotlight
  let tooltipTop: number
  let tooltipLeft: number

  if (spotlight) {
    const tooltipH = tooltipRef.current?.offsetHeight ?? TOOLTIP_H_ESTIMATE
    const spBottom = spotlight.top + spotlight.height

    tooltipTop = spBottom + GAP + tooltipH <= window.innerHeight
      ? spBottom + GAP
      : spotlight.top - GAP - tooltipH

    const centerX = spotlight.left + spotlight.width / 2
    tooltipLeft = Math.max(
      EDGE_PADDING,
      Math.min(window.innerWidth - TOOLTIP_W - EDGE_PADDING, centerX - TOOLTIP_W / 2)
    )
  } else {
    tooltipTop = (window.innerHeight - TOOLTIP_H_ESTIMATE) / 2
    tooltipLeft = (window.innerWidth - TOOLTIP_W) / 2
  }

  return (
    <>
      <div className="tour-backdrop" />
      {spotlight && (
        <div
          className="tour-spotlight"
          style={{
            top: spotlight.top - 4,
            left: spotlight.left - 4,
            width: spotlight.width + 8,
            height: spotlight.height + 8,
          }}
        />
      )}
      <div
        ref={tooltipRef}
        className="tour-tooltip"
        style={{ top: tooltipTop, left: tooltipLeft, width: TOOLTIP_W }}
      >
        <p className="tour-step-count">{step + 1} / {STEPS.length}</p>
        <h3 className="tour-title">{currentStep.title}</h3>
        <p className="tour-description">{currentStep.description}</p>
        <div className="tour-actions">
          <button className="tour-skip" onClick={onDismiss}>Skip tour</button>
          <div className="tour-nav">
            {step > 0 && (
              <button className="tour-btn tour-btn-back" onClick={() => setStep(s => s - 1)}>Back</button>
            )}
            <button
              className="tour-btn tour-btn-next"
              onClick={() => isLast ? onDismiss() : setStep(s => s + 1)}
              autoFocus
            >
              {isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Tour

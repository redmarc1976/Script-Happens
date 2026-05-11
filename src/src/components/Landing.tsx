import './Landing.css'

interface LandingProps {
  onOpenFloorPlan: () => void
}

function Landing({ onOpenFloorPlan }: LandingProps) {
  return (
    <div className="landing">
      <button className="landing-cta" onClick={onOpenFloorPlan}>
        View Floor Plan
      </button>
    </div>
  )
}

export default Landing

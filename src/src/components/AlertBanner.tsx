import './AlertBanner.css'

interface Alert {
  day: string
  message: string
}

const ALERTS: Alert[] = [
  { day: 'Tuesday', message: 'Heatwave warning — temperatures forecast at 34°C. Stay hydrated and keep windows open.' },
  { day: 'Wednesday', message: 'Heavy rain & travel disruption expected — allow extra time for your commute.' },
  { day: 'Thursday', message: 'High pollen count — air quality may be poor for those with allergies.' },
  { day: 'Friday', message: 'Thunderstorm warning — strong winds forecast, check your travel plans.' },
]

function AlertBanner() {
  const items = [...ALERTS, ...ALERTS]

  return (
    <div className="alert-banner" role="marquee" aria-label="Environmental alerts">
      <span className="alert-banner-label">ALERTS</span>
      <div className="alert-banner-track-wrapper">
        <div className="alert-banner-track">
          {items.map((alert, i) => (
            <span key={i} className="alert-banner-item">
              <span className="alert-banner-day">{alert.day}:</span>
              {' '}{alert.message}
              <span className="alert-banner-sep" aria-hidden="true">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AlertBanner

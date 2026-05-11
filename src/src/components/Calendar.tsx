import { useState } from 'react'
import './Calendar.css'

interface CalendarProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function Calendar({ selectedDate, onDateChange }: CalendarProps) {
  const [viewDate, setViewDate] = useState(new Date(selectedDate))

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1)
  // Monday-first: convert Sunday(0) to 6, others shift by -1
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const isSelected = (day: number) =>
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === month &&
    selectedDate.getFullYear() === year

  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === month &&
    today.getFullYear() === year

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button className="calendar-nav" onClick={prevMonth}>‹</button>
        <span className="calendar-month">{MONTHS[month]} {year}</span>
        <button className="calendar-nav" onClick={nextMonth}>›</button>
      </div>
      <div className="calendar-grid">
        {DAYS.map(d => (
          <div key={d} className="calendar-day-label">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={[
              'calendar-cell',
              day === null ? 'empty' : '',
              day !== null && isToday(day) ? 'today' : '',
              day !== null && isSelected(day) ? 'selected' : '',
            ].join(' ').trim()}
            onClick={() => day !== null && onDateChange(new Date(year, month, day))}
          >
            {day ?? ''}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Calendar

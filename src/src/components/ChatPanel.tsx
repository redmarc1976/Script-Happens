import { useEffect, useRef, useState } from 'react'
import { useMe } from '../hooks/useMe'
import './ChatPanel.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface BookingResult {
  date: string
  desk_id?: string
  desk_name?: string
  skipped_reason?: string
}

interface MemberResult {
  member: string
  booked: BookingResult[]
  skipped: BookingResult[]
}

interface GroupBookResponse {
  team: string
  members: MemberResult[]
}

function mondayOfWeek(offset: number): Date {
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getWeekRange(offset: number): { start: string; end: string } {
  const monday = mondayOfWeek(offset)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  return { start: isoDate(monday), end: isoDate(friday) }
}

interface ParsedIntent {
  team?: string
  start: string
  end: string
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function nextOccurrence(dayIndex: number): string {
  const today = new Date()
  const todayIndex = today.getDay()
  const delta = dayIndex === todayIndex ? 7 : (dayIndex - todayIndex + 7) % 7
  const target = new Date(today)
  target.setDate(today.getDate() + delta)
  return isoDate(target)
}

function parseIntent(text: string): ParsedIntent | null {
  const lower = text.toLowerCase()
  if (!lower.includes('book')) return null

  let range: { start: string; end: string } | null = null
  const nWeeksMatch = lower.match(/next\s+(\d+)\s+weeks?/)
  const nDaysMatch = lower.match(/next\s+(\d+)\s+days?/)

  if (nWeeksMatch) {
    const n = parseInt(nWeeksMatch[1], 10)
    const start = isoDate(mondayOfWeek(1))
    const end = new Date(mondayOfWeek(1))
    end.setDate(end.getDate() + n * 7 - 3) // end on Friday of last week
    range = { start, end: isoDate(end) }
  } else if (nDaysMatch) {
    const n = parseInt(nDaysMatch[1], 10)
    const start = new Date()
    start.setDate(start.getDate() + 1)
    const end = new Date(start)
    end.setDate(start.getDate() + n - 1)
    range = { start: isoDate(start), end: isoDate(end) }
  } else if (lower.includes('next week')) {
    range = getWeekRange(1)
  } else if (lower.includes('this week')) {
    range = getWeekRange(0)
  } else if (lower.includes('tomorrow')) {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    const ds = isoDate(d)
    range = { start: ds, end: ds }
  } else if (lower.includes('today')) {
    const ds = isoDate(new Date())
    range = { start: ds, end: ds }
  } else {
    const matchedDay = DAY_NAMES.find(name => lower.includes(name))
    if (matchedDay) {
      const ds = nextOccurrence(DAY_NAMES.indexOf(matchedDay))
      range = { start: ds, end: ds }
    } else {
      const m = text.match(/(\d{4}-\d{2}-\d{2}).*?(\d{4}-\d{2}-\d{2})/)
      if (m) range = { start: m[1], end: m[2] }
    }
  }
  if (!range) return null

  if (lower.includes('my team')) return { ...range }

  const m = text.match(/book\s+(?:the\s+)?([A-Za-z][A-Za-z\s]+?)\s+team/i)
  if (m) return { team: m[1].trim(), ...range }

  return null
}

function formatResponse(data: GroupBookResponse): string {
  const lines: string[] = [`Booked desks for the ${data.team} team:\n`]
  for (const m of data.members) {
    const name = m.member.split('@')[0]
    if (m.booked.length === 0) {
      lines.push(`• ${name}: nothing booked`)
    } else {
      const summary = m.booked
        .map(b => `${b.date} → ${b.desk_name ?? b.desk_id}`)
        .join(', ')
      lines.push(`• ${name}: ${summary}`)
    }
  }
  return lines.join('\n')
}

const HINT =
  'Try: "book my team tomorrow", "book my team next week", or "book the Platform Engineering team on Monday".'

function ChatPanel() {
  const { me } = useMe()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I can book desks for your team. ${HINT}`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (msg: Message) =>
    setMessages(prev => [...prev, msg])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    addMessage({ role: 'user', content: text })

    const intent = parseIntent(text)
    if (!intent) {
      addMessage({
        role: 'assistant',
        content: `I didn't understand that. ${HINT}`,
      })
      return
    }

    const teamLabel = intent.team ?? me?.team ?? 'your team'
    addMessage({
      role: 'assistant',
      content: `Booking desks for the ${teamLabel} team (${intent.start} – ${intent.end})…`,
    })

    setLoading(true)
    try {
      const res = await fetch('/api/group-book', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: intent.team, start: intent.start, end: intent.end }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        addMessage({ role: 'assistant', content: `Error: ${err.detail ?? 'Something went wrong.'}` })
      } else {
        const data: GroupBookResponse = await res.json()
        addMessage({ role: 'assistant', content: formatResponse(data) })
      }
    } catch {
      addMessage({ role: 'assistant', content: 'Network error — please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">Assistant</div>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row">
        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. book my team next week"
          disabled={loading}
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={loading}>
          {loading ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}

export default ChatPanel

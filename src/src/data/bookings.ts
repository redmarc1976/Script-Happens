export interface Booking {
  userId: string
  date: string  // YYYY-MM-DD
  deskId: string
}

function nextWeekdays(count: number): Date[] {
  const days: Date[] = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  while (days.length < count) {
    cursor.setDate(cursor.getDate() + 1)
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) days.push(new Date(cursor))
  }
  return days
}

export function dateKey(d: Date): string {
  return d.toISOString().split('T')[0]
}

const DANIEL_ID = '00000000-0000-0000-0000-000000000001'
const upcoming = nextWeekdays(3)

export const MOCK_BOOKINGS: Booking[] = [
  { userId: DANIEL_ID, date: dateKey(upcoming[0]), deskId: 'g-w-b1-tl' },
  { userId: DANIEL_ID, date: dateKey(upcoming[1]), deskId: 'g-w-b2-br' },
  { userId: DANIEL_ID, date: dateKey(upcoming[2]), deskId: 'f-nw-r1c2-tr' },
]

export function getBookingForUser(userId: string, date: Date): Booking | undefined {
  const key = dateKey(date)
  return MOCK_BOOKINGS.find(b => b.userId === userId && b.date === key)
}

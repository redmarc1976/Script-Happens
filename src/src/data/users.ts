export type WorkingDay = 'office' | 'remote' | 'not-working'

export interface WorkingPattern {
  monday: WorkingDay
  tuesday: WorkingDay
  wednesday: WorkingDay
  thursday: WorkingDay
  friday: WorkingDay
}

export interface LineManager {
  name: string
  email: string
}

export interface User {
  id: string
  employeeId: number
  fullName: string
  email: string
  location: string
  team: string
  role: string
  lineManager: LineManager
  anchorDays: string[]
  defaultWorkingPattern: WorkingPattern
  preferredNeighbourhood: string
  deskPreferences: string[]
  bookingWindowDays: number
  accessibilityNeeds: string | null
}

import rawUsers from './users.json'

export const USERS: User[] = rawUsers as User[]

export const getUserById = (id: string) => USERS.find(u => u.id === id)
export const getUsersByLocation = (location: string) =>
  USERS.filter(u => u.location.toLowerCase() === location.toLowerCase())

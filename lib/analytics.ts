// Analytics utilities for generating insights and statistics

import { getAllSessions } from "./db"

export interface AnalyticsInsights {
  streak: number
  mostActiveDay: string
  averageSessionsPerDay: number
  totalFocusTime: number
  weekTrend: "increasing" | "decreasing" | "stable"
}

export async function getAnalyticsInsights(): Promise<AnalyticsInsights> {
  const sessions = await getAllSessions()

  if (sessions.length === 0) {
    return {
      streak: 0,
      mostActiveDay: "N/A",
      averageSessionsPerDay: 0,
      totalFocusTime: 0,
      weekTrend: "stable",
    }
  }

  // Calculate streak
  const uniqueDates = new Set(sessions.map((s) => new Date(s.startTime).toDateString()))
  let streak = 0
  const currentDate = new Date()
  while (uniqueDates.has(currentDate.toDateString())) {
    streak++
    currentDate.setDate(currentDate.getDate() - 1)
  }

  // Find most active day
  const dayMap = new Map<string, number>()
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  sessions.forEach((session) => {
    const dayIndex = new Date(session.startTime).getDay()
    const dayName = days[dayIndex]
    dayMap.set(dayName, (dayMap.get(dayName) || 0) + 1)
  })

  let mostActiveDay = "N/A"
  let maxCount = 0
  dayMap.forEach((count, day) => {
    if (count > maxCount) {
      maxCount = count
      mostActiveDay = day
    }
  })

  // Calculate averages
  const daysSpan = Math.max(
    1,
    Math.floor(
      (Math.max(...sessions.map((s) => s.startTime)) - Math.min(...sessions.map((s) => s.startTime))) /
        (24 * 60 * 60 * 1000),
    ),
  )
  const averageSessionsPerDay = sessions.length / daysSpan
  const totalFocusTime = sessions.reduce((sum, s) => sum + s.duration, 0)

  // Calculate week trend
  const now = Date.now()
  const thisWeek = sessions.filter((s) => s.startTime > now - 7 * 24 * 60 * 60 * 1000).length
  const lastWeek = sessions.filter(
    (s) => s.startTime > now - 14 * 24 * 60 * 60 * 1000 && s.startTime <= now - 7 * 24 * 60 * 60 * 1000,
  ).length

  let weekTrend: "increasing" | "decreasing" | "stable" = "stable"
  if (thisWeek > lastWeek * 1.1) weekTrend = "increasing"
  else if (thisWeek < lastWeek * 0.9) weekTrend = "decreasing"

  return {
    streak,
    mostActiveDay,
    averageSessionsPerDay: Math.round(averageSessionsPerDay * 10) / 10,
    totalFocusTime,
    weekTrend,
  }
}

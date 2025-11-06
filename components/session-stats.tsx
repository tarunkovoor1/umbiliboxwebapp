"use client"

import { useEffect, useState } from "react"
import { getAllSessions } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, TrendingUp, BarChart3 } from "lucide-react"

interface Session {
  id: string
  duration: number
  startTime: number
  endTime?: number
  isActive: boolean
  notes?: string
}

export default function SessionStats() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalLockTime: 0,
    averageDuration: 0,
    longestSession: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAndCalculate = async () => {
      try {
        const allSessions = await getAllSessions()
        setSessions(allSessions)

        if (allSessions.length === 0) {
          setLoading(false)
          return
        }

        const completedSessions = allSessions.filter((s) => !s.isActive)

        if (completedSessions.length === 0) {
          setLoading(false)
          return
        }

        const totalLockTime = completedSessions.reduce((sum, session) => {
          const endTime = session.endTime || Date.now()
          return sum + (endTime - session.startTime)
        }, 0)

        const averageDuration = totalLockTime / completedSessions.length
        const longestSession = Math.max(...completedSessions.map((s) => s.duration))

        setStats({
          totalSessions: allSessions.length,
          totalLockTime: Math.floor(totalLockTime / 1000),
          averageDuration: Math.floor(averageDuration / 1000),
          longestSession,
        })
      } catch (error) {
        console.error("Failed to calculate stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAndCalculate()
    const interval = setInterval(fetchAndCalculate, 5000)
    return () => clearInterval(interval)
  }, [])

  const formatSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  if (loading) {
    return null
  }

  const statCards = [
    {
      icon: BarChart3,
      label: "Total Sessions",
      value: stats.totalSessions.toString(),
      color: "text-blue-500",
    },
    {
      icon: Clock,
      label: "Total Lock Time",
      value: formatSeconds(stats.totalLockTime),
      color: "text-purple-500",
    },
    {
      icon: TrendingUp,
      label: "Average Duration",
      value: formatSeconds(stats.averageDuration),
      color: "text-green-500",
    },
    {
      icon: Clock,
      label: "Longest Session",
      value: formatSeconds(stats.longestSession),
      color: "text-orange-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <Icon className={`h-6 w-6 ${stat.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

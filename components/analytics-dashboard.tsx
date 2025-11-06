"use client"

import { useEffect, useState } from "react"
import { getAllSessions } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface Session {
  id: string
  duration: number
  startTime: number
  endTime?: number
  isActive: boolean
  notes?: string
}

interface ChartData {
  date: string
  sessions: number
  totalTime: number
}

interface DurationData {
  range: string
  count: number
}

export default function AnalyticsDashboard() {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [durationData, setDurationData] = useState<DurationData[]>([])
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

  useEffect(() => {
    const fetchAndProcess = async () => {
      try {
        const allSessions = await getAllSessions()

        // Process daily chart data (last 7 days)
        const dailyMap = new Map<string, { count: number; time: number }>()
        const now = Date.now()
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now - i * 24 * 60 * 60 * 1000)
          const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          dailyMap.set(dateStr, { count: 0, time: 0 })
        }

        allSessions.forEach((session) => {
          const date = new Date(session.startTime)
          const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          if (dailyMap.has(dateStr)) {
            const data = dailyMap.get(dateStr)!
            data.count++
            data.time += session.duration
          }
        })

        const chartDataArr = Array.from(dailyMap.entries()).map(([date, data]) => ({
          date,
          sessions: data.count,
          totalTime: Math.floor(data.time / 60),
        }))
        setChartData(chartDataArr)

        // Process duration distribution
        const durationCounts = {
          "< 15 min": 0,
          "15-30 min": 0,
          "30-60 min": 0,
          "1-2 hours": 0,
          "> 2 hours": 0,
        }

        allSessions.forEach((session) => {
          const mins = session.duration / 60
          if (mins < 15) durationCounts["< 15 min"]++
          else if (mins < 30) durationCounts["15-30 min"]++
          else if (mins < 60) durationCounts["30-60 min"]++
          else if (mins < 120) durationCounts["1-2 hours"]++
          else durationCounts["> 2 hours"]++
        })

        const durationArr = Object.entries(durationCounts).map(([range, count]) => ({
          range,
          count,
        }))
        setDurationData(durationArr)

        // Process weekly breakdown
        const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        const weekMap = new Map<number, number>()
        weekDays.forEach((_, i) => weekMap.set(i, 0))

        allSessions.forEach((session) => {
          const dayOfWeek = new Date(session.startTime).getDay()
          weekMap.set(dayOfWeek, (weekMap.get(dayOfWeek) || 0) + 1)
        })

        const weeklyArr = weekDays.map((day, i) => ({
          day,
          count: weekMap.get(i) || 0,
        }))
        setWeeklyData(weeklyArr)
      } catch (error) {
        console.error("Failed to process analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAndProcess()
    const interval = setInterval(fetchAndProcess, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lock Activity (Last 7 Days)</CardTitle>
          <CardDescription>Daily sessions and total lock time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" label={{ value: "Sessions", angle: -90, position: "insideLeft" }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: "Minutes", angle: 90, position: "insideRight" }}
              />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="sessions"
                stroke="#3b82f6"
                name="Sessions"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="totalTime"
                stroke="#10b981"
                name="Minutes"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lock Duration Distribution</CardTitle>
            <CardDescription>How long are your typical sessions?</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={durationData} dataKey="count" nameKey="range" cx="50%" cy="50%" outerRadius={100} label>
                  {durationData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessions by Day of Week</CardTitle>
            <CardDescription>Which days are most productive?</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

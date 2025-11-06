"use client"

import { useEffect, useState } from "react"
import { getAnalyticsInsights, type AnalyticsInsights } from "@/lib/analytics"
import { Card, CardContent } from "@/components/ui/card"
import { Flame, Target, TrendingUp, Clock } from "lucide-react"

export default function InsightsPanel() {
  const [insights, setInsights] = useState<AnalyticsInsights | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const data = await getAnalyticsInsights()
        setInsights(data)
      } catch (error) {
        console.error("Failed to fetch insights:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
    const interval = setInterval(fetchInsights, 15000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !insights) {
    return null
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const insightCards = [
    {
      icon: Flame,
      label: "Current Streak",
      value: `${insights.streak} days`,
      color: "text-red-500",
    },
    {
      icon: Target,
      label: "Most Active",
      value: insights.mostActiveDay,
      color: "text-blue-500",
    },
    {
      icon: Clock,
      label: "Total Focus Time",
      value: formatTime(insights.totalFocusTime),
      color: "text-purple-500",
    },
    {
      icon: TrendingUp,
      label: "Week Trend",
      value: insights.weekTrend.charAt(0).toUpperCase() + insights.weekTrend.slice(1),
      color: "text-green-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {insightCards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-xl font-bold mt-2">{card.value}</p>
                </div>
                <Icon className={`h-5 w-5 ${card.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

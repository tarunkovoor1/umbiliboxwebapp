"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getActiveSessions, updateSession } from "@/lib/db"

interface Session {
  id: string
  duration: number
  startTime: number
  endTime?: number
  isActive: boolean
  notes?: string
}

export default function ActiveTimer() {
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActiveSession = async () => {
      try {
        const sessions = await getActiveSessions()
        if (sessions.length > 0) {
          setActiveSession(sessions[0])
        }
      } catch (error) {
        console.error("Failed to fetch active session:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveSession()
  }, [])

  useEffect(() => {
    if (!activeSession || isPaused) return

    const interval = setInterval(() => {
      const elapsed = (Date.now() - activeSession.startTime) / 1000
      const remaining = Math.max(0, activeSession.duration - elapsed)
      setTimeRemaining(remaining)

      if (remaining === 0) {
        handleTimerComplete()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [activeSession, isPaused])

  const handleTimerComplete = async () => {
    if (activeSession) {
      try {
        await updateSession(activeSession.id, {
          isActive: false,
          endTime: Date.now(),
        })
        setActiveSession(null)
        setTimeRemaining(0)
      } catch (error) {
        console.error("Failed to complete session:", error)
      }
    }
  }

  const handlePauseResume = async () => {
    setIsPaused(!isPaused)
  }

  const handleUnlock = async () => {
    if (activeSession && confirm("Are you sure you want to unlock early?")) {
      try {
        await updateSession(activeSession.id, {
          isActive: false,
          endTime: Date.now(),
        })
        setActiveSession(null)
        setTimeRemaining(0)
      } catch (error) {
        console.error("Failed to unlock:", error)
      }
    }
  }

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return null
  }

  if (!activeSession) {
    return null
  }

  const progressPercentage = (timeRemaining / activeSession.duration) * 100

  return (
    <Card className="border-blue-500/50 bg-gradient-to-br from-blue-50 to-blue-25 dark:from-blue-950/30 dark:to-blue-900/20">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Phone Locked</h2>
            <div className="text-6xl font-bold font-mono text-foreground tracking-wider">
              {formatTimeRemaining(timeRemaining)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{isPaused ? "Paused" : "Counting down"}</p>
          </div>

          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handlePauseResume} variant="outline" className="w-full bg-transparent">
              {isPaused ? "Resume" : "Pause"}
            </Button>
            <Button onClick={handleUnlock} variant="destructive" className="w-full">
              Unlock
            </Button>
          </div>

          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              Focus mode active. Your phone is in lockbox mode.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

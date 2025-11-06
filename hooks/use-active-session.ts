"use client"

import { useEffect, useState, useCallback } from "react"
import { getActiveSessions } from "@/lib/db"

interface Session {
  id: string
  duration: number
  startTime: number
  endTime?: number
  isActive: boolean
  notes?: string
}

export function useActiveSession() {
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchActiveSession = useCallback(async () => {
    try {
      const sessions = await getActiveSessions()
      if (sessions.length > 0) {
        setActiveSession(sessions[0])
      } else {
        setActiveSession(null)
      }
    } catch (error) {
      console.error("Failed to fetch active session:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActiveSession()
    const interval = setInterval(fetchActiveSession, 2000)
    return () => clearInterval(interval)
  }, [fetchActiveSession])

  return { activeSession, isLoading }
}

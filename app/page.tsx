"use client"

import { useEffect, useState } from "react"
import { initDB } from "@/lib/db"
import LockboxHeader from "@/components/lockbox-header"
import ActiveTimer from "@/components/active-timer"
import QuickLockButton from "@/components/quick-lock-button"
import BluetoothConnection from "@/components/bluetooth-connection"
import InsightsPanel from "@/components/insights-panel"
import SessionStats from "@/components/session-stats"
import AnalyticsDashboard from "@/components/analytics-dashboard"
import SessionsList from "@/components/sessions-list"

export default function Home() {
  const [isDBReady, setIsDBReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const setupDB = async () => {
      try {
        await initDB()
        setIsDBReady(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize database")
      }
    }

    setupDB()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <LockboxHeader />
      <main className="container mx-auto px-4 py-8">
        {error && <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>}
        {isDBReady ? (
          <div className="space-y-8">
            <ActiveTimer />
            <BluetoothConnection />
            <QuickLockButton />
            {/* Added insights and analytics */}
            <InsightsPanel />
            <SessionStats />
            <AnalyticsDashboard />
            <SessionsList />
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Initializing lockbox...</p>
          </div>
        )}
      </main>
    </div>
  )
}

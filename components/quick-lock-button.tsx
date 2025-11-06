"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createSession } from "@/lib/db"

export default function QuickLockButton() {
  const [loading, setLoading] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [success, setSuccess] = useState(false)

  const durations = [
    { label: "15 min", value: 900 },
    { label: "30 min", value: 1800 },
    { label: "1 hour", value: 3600 },
    { label: "2 hours", value: 7200 },
  ]

  const handleStartLock = async (duration: number) => {
    setLoading(true)
    setSuccess(false)
    try {
      await createSession(duration)
      setSelectedDuration(duration)
      setSuccess(true)
      setTimeout(() => {
        setSelectedDuration(null)
        setSuccess(false)
        setLoading(false)
      }, 1500)
    } catch (error) {
      console.error("Failed to create session:", error)
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Lock</CardTitle>
        <CardDescription>Choose a duration to lock your phone</CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
            Lock session started! Your phone is now in lockbox mode.
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {durations.map((duration) => (
            <Button
              key={duration.value}
              onClick={() => handleStartLock(duration.value)}
              disabled={loading}
              variant={selectedDuration === duration.value ? "default" : "outline"}
              className="w-full"
            >
              {duration.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

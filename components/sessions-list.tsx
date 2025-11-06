"use client"

import { useEffect, useState } from "react"
import { getAllSessions, deleteSession } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Eye } from "lucide-react"

interface Session {
  id: string
  duration: number
  startTime: number
  endTime?: number
  isActive: boolean
  notes?: string
}

type FilterType = "all" | "completed" | "active"

export default function SessionsList() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>("all")
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const allSessions = await getAllSessions()
        setSessions(allSessions.sort((a, b) => b.startTime - a.startTime))
      } catch (error) {
        console.error("Failed to fetch sessions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
    const interval = setInterval(fetchSessions, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleDeleteSession = async (id: string) => {
    if (confirm("Are you sure you want to delete this session?")) {
      try {
        await deleteSession(id)
        setSessions(sessions.filter((s) => s.id !== id))
        if (selectedSession?.id === id) {
          setSelectedSession(null)
          setShowDetails(false)
        }
      } catch (error) {
        console.error("Failed to delete session:", error)
      }
    }
  }

  const handleViewDetails = (session: Session) => {
    setSelectedSession(session)
    setShowDetails(true)
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const getSessionDuration = (session: Session) => {
    const endTime = session.endTime || Date.now()
    return Math.floor((endTime - session.startTime) / 1000)
  }

  const filteredSessions = sessions.filter((session) => {
    if (filter === "completed") return !session.isActive
    if (filter === "active") return session.isActive
    return true
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading sessions...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Session History</CardTitle>
              <CardDescription>View and manage your lock sessions</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{filteredSessions.length}</p>
              <p className="text-xs text-muted-foreground">sessions</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
              All
            </Button>
            <Button variant={filter === "active" ? "default" : "outline"} size="sm" onClick={() => setFilter("active")}>
              Active
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("completed")}
            >
              Completed
            </Button>
          </div>

          {filteredSessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {filter === "all" && "No sessions yet. Start your first lock!"}
              {filter === "active" && "No active sessions."}
              {filter === "completed" && "No completed sessions."}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono font-semibold text-base">{formatDuration(session.duration)}</span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          session.isActive
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {session.isActive ? "Active" : "Completed"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatTime(session.startTime)}</p>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(session)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSession(session.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showDetails && selectedSession && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Session Details</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Planned Duration</p>
                <p className="font-semibold">{formatDuration(selectedSession.duration)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Actual Duration</p>
                <p className="font-semibold">{formatDuration(getSessionDuration(selectedSession))}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Started</p>
                <p className="text-sm">{formatTime(selectedSession.startTime)}</p>
              </div>
              {selectedSession.endTime && (
                <div className="p-3 bg-muted rounded-lg col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Ended</p>
                  <p className="text-sm">{formatTime(selectedSession.endTime)}</p>
                </div>
              )}
              <div className="p-3 bg-muted rounded-lg col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <p className="text-sm font-medium">{selectedSession.isActive ? "Currently Active" : "Completed"}</p>
              </div>
              {selectedSession.notes && (
                <div className="p-3 bg-muted rounded-lg col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selectedSession.notes}</p>
                </div>
              )}
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                handleDeleteSession(selectedSession.id)
                setShowDetails(false)
              }}
              className="w-full"
            >
              Delete Session
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

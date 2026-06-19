"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Check, X, Calendar, MapPin, Clock, Target, Mail, Inbox } from "lucide-react"
import Link from "next/link"

interface Application {
  id: string
  status: "PENDING" | "ACCEPTED" | "REJECTED"
  message: string | null
  createdAt: string
  applyingTeam: {
    id: string
    name: string
    logo: string | null
    members: { user: { name: string | null; username: string; email: string } }[]
  }
  appliedBy: {
    id: string
    name: string | null
    username: string
    email: string
    profilePhoto: string | null
  }
  matchRequest: {
    id: string
    date: string
    time: string
    city: string
    futsalLocation: string | null
    requestingTeam: { name: string }
  }
}

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  ACCEPTED: "default",
  REJECTED: "destructive",
}

export default function MatchApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/match-applications")
      if (res.ok) {
        const data = await res.json()
        setApplications(data.applications || [])
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async (id: string, action: "ACCEPT" | "REJECT") => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/match-applications/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        fetchApplications()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to respond")
      }
    } catch (error) {
      console.error("Error responding to application:", error)
      alert("Failed to respond")
    } finally {
      setProcessing(null)
    }
  }

  const pending = applications.filter((a) => a.status === "PENDING")
  const resolved = applications.filter((a) => a.status !== "PENDING")

  const renderApplication = (app: Application) => {
    const owner = app.applyingTeam.members[0]?.user
    const contactEmail = app.appliedBy?.email || owner?.email
    return (
      <Card key={app.id}>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={app.applyingTeam.logo || undefined} />
                <AvatarFallback className="text-lg">
                  {app.applyingTeam.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="font-semibold text-lg">{app.applyingTeam.name}</div>
                <div className="text-sm text-muted-foreground">
                  Applied to match vs {app.matchRequest.requestingTeam.name}
                </div>
                {contactEmail && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{contactEmail}</span>
                  </div>
                )}
                {app.message && (
                  <p className="text-sm text-muted-foreground italic">&quot;{app.message}&quot;</p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(app.matchRequest.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {app.matchRequest.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {app.matchRequest.city}
                  </span>
                  {app.matchRequest.futsalLocation && (
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {app.matchRequest.futsalLocation}
                    </span>
                  )}
                  <span>Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {app.status === "PENDING" ? (
                <>
                  <Button
                    onClick={() => handleRespond(app.id, "ACCEPT")}
                    disabled={processing === app.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleRespond(app.id, "REJECT")}
                    disabled={processing === app.id}
                    variant="destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </>
              ) : (
                <Badge variant={statusVariant[app.status]}>{app.status}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href="/match-finder">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Match Finder
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Pending Match Requests</h1>
          <p className="text-muted-foreground">Review and respond to teams applying to your match requests</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading applications...</div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
              <p className="text-muted-foreground">
                When teams apply to your match requests, they&apos;ll show up here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Pending ({pending.length})
              </h2>
              {pending.length > 0 ? (
                <div className="space-y-4">{pending.map(renderApplication)}</div>
              ) : (
                <p className="text-muted-foreground">No pending applications.</p>
              )}
            </div>

            {resolved.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">History</h2>
                <div className="space-y-4 opacity-80">{resolved.map(renderApplication)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

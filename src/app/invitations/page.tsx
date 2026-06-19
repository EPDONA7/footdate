"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus, Check, X, Users, Crown, Shield } from "lucide-react"
import Link from "next/link"

interface Invitation {
  id: string
  status: string
  createdAt: string
  team: {
    id: string
    name: string
    city: string
    logo: string | null
  }
  invitingUser: {
    id: string
    name: string | null
    username: string
    profilePhoto: string | null
  }
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    try {
      const response = await fetch("/api/user/invitations")
      if (response.ok) {
        const data = await response.json()
        setInvitations(data)
      }
    } catch (error) {
      console.error("Error fetching invitations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleResponse = async (invitationId: string, action: "ACCEPT" | "DECLINE") => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        // Refresh invitations
        fetchInvitations()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to respond to invitation")
      }
    } catch (error) {
      console.error("Error responding to invitation:", error)
      alert("Failed to respond to invitation")
    }
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === "PENDING")
  const otherInvitations = invitations.filter((inv) => inv.status !== "PENDING")

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">Loading invitations...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Team Invitations</h1>
          <p className="text-muted-foreground">Manage your team invitations</p>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Pending Invitations ({pendingInvitations.length})
            </h2>
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <Card key={invitation.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={invitation.team.logo || undefined} />
                          <AvatarFallback className="text-2xl">
                            {invitation.team.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-lg">{invitation.team.name}</div>
                          <div className="text-sm text-muted-foreground">{invitation.team.city}</div>
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <span>Invited by</span>
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={invitation.invitingUser.profilePhoto || undefined} />
                              <AvatarFallback className="text-xs">
                                {invitation.invitingUser.name?.charAt(0) || invitation.invitingUser.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{invitation.invitingUser.name || invitation.invitingUser.username}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleResponse(invitation.id, "ACCEPT")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleResponse(invitation.id, "DECLINE")}
                          variant="destructive"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Other Invitations */}
        {otherInvitations.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Past Invitations</h2>
            <div className="space-y-4">
              {otherInvitations.map((invitation) => (
                <Card key={invitation.id} className="opacity-60">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={invitation.team.logo || undefined} />
                          <AvatarFallback>
                            {invitation.team.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{invitation.team.name}</div>
                          <div className="text-sm text-muted-foreground">{invitation.team.city}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={invitation.status === "ACCEPTED" ? "default" : "secondary"}
                        >
                          {invitation.status}
                        </Badge>
                        {invitation.status === "ACCEPTED" && (
                          <Link href={`/team/${invitation.team.id}`}>
                            <Button variant="outline" size="sm">
                              View Team
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {invitations.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No invitations yet</h3>
              <p className="text-muted-foreground mb-4">
                When teams invite you to join, you'll see them here
              </p>
              <Link href="/marketplace">
                <Button>
                  <Users className="mr-2 h-4 w-4" />
                  Browse Player Marketplace
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface JoinRequest {
  id: string
  playerProfile: {
    user: {
      id: string
      username: string
      name: string | null
      profilePhoto: string | null
    }
    bio: string | null
    skillLevel: string | null
    preferredPosition: string | null
    availability: string[]
  }
}

interface JoinRequestsTabProps {
  joinRequests: JoinRequest[]
  teamId: string
}

export function JoinRequestsTab({ joinRequests, teamId }: JoinRequestsTabProps) {
  const respondToJoinRequest = async (requestId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/join-requests/${requestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        window.location.reload()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to respond to request")
      }
    } catch (error) {
      console.error("Error responding to join request:", error)
      alert("Failed to respond to request")
    }
  }

  if (joinRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Join Requests</CardTitle>
          <CardDescription>Review players who want to join your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No pending join requests
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Join Requests</CardTitle>
          <CardDescription>Review players who want to join your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {joinRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={request.playerProfile.user.profilePhoto || undefined} />
                    <AvatarFallback>
                      {request.playerProfile.user.name?.charAt(0) || request.playerProfile.user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{request.playerProfile.user.name || request.playerProfile.user.username}</div>
                    <div className="text-sm text-muted-foreground">@{request.playerProfile.user.username}</div>
                    {request.playerProfile.bio && (
                      <div className="text-sm text-muted-foreground mt-1">{request.playerProfile.bio}</div>
                    )}
                    <div className="flex gap-2 mt-2">
                      {request.playerProfile.skillLevel && (
                        <Badge variant="secondary">{request.playerProfile.skillLevel}</Badge>
                      )}
                      {request.playerProfile.preferredPosition && (
                        <Badge variant="outline">{request.playerProfile.preferredPosition}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => respondToJoinRequest(request.id, "ACCEPTED")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => respondToJoinRequest(request.id, "REJECTED")}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
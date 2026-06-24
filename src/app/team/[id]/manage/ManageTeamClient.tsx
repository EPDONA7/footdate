"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Calendar, Settings, UserPlus, Crown, Shield, Inbox } from "lucide-react"
import Link from "next/link"
import { TeamSettingsForm } from "@/components/team-settings-form"
import { DeleteTeamButton } from "@/components/delete-team-button"
import { JoinRequestsTab } from "@/components/join-requests-tab"
import { TeamChatTab } from "@/components/team-chat-tab"

interface ManageTeamClientProps {
  team: any;
  currentUserId: string;
}

export default function ManageTeamClient({ team, currentUserId }: ManageTeamClientProps) {
  // Check ownership using the prop passed down from the server
  const isOwner = team.members?.find((m: any) => m.userId === currentUserId)?.role === "OWNER"

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href={`/team/${team.id}`}>
            <Button variant="ghost" className="mb-4">
              ← Back to Team
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Manage Team</h1>
          <p className="text-muted-foreground">{team.name} - {team.city}</p>
        </div>

        <Tabs defaultValue="roster" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="roster">
              <Users className="mr-2 h-4 w-4" />
              Roster
            </TabsTrigger>
            <TabsTrigger value="invitations">
              <UserPlus className="mr-2 h-4 w-4" />
              Invitations
            </TabsTrigger>
            <TabsTrigger value="joinRequests">
              <UserPlus className="mr-2 h-4 w-4" />
              Join Requests
            </TabsTrigger>
            <TabsTrigger value="teamChat">
              <Inbox className="mr-2 h-4 w-4" />
              Team Chat
            </TabsTrigger>
            <TabsTrigger value="matches">
              <Calendar className="mr-2 h-4 w-4" />
              Matches
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Roster Tab */}
          <TabsContent value="roster">
            <Card>
              <CardHeader>
                <CardTitle>Team Roster</CardTitle>
                <CardDescription>{team.members.length} members ({team.capacity} capacity)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {team.members.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={member.user.profilePhoto || undefined} />
                          <AvatarFallback>
                            {member.user.name?.charAt(0) || member.user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{member.user.name || member.user.username}</div>
                          <div className="text-sm text-muted-foreground">@{member.user.username}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          {member.role === 'OWNER' && <Crown className="h-3 w-3" />}
                          {member.role === 'CAPTAIN' && <Shield className="h-3 w-3" />}
                          {member.role}
                        </Badge>
                        {isOwner && member.userId !== currentUserId && member.role !== 'OWNER' && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {member.role === 'CAPTAIN' ? 'Captain' : 'Player'}
                            </span>
                            <form action={`/api/teams/${team.id}/members/${member.id}/role`} method="POST">
                              <input type="hidden" name="role" value={member.role === 'CAPTAIN' ? 'PLAYER' : 'CAPTAIN'} />
                              <Button type="submit" variant="ghost" size="sm">
                                {member.role === 'CAPTAIN' ? 'Make Player' : 'Make Captain'}
                              </Button>
                            </form>
                            <KickButton teamId={team.id} memberId={member.id} memberName={member.user.name || member.user.username} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations">
            <div className="space-y-6">
              {/* Invite Player */}
              <Card>
                <CardHeader>
                  <CardTitle>Invite Player</CardTitle>
                  <CardDescription>Search for players by username to invite them to your team</CardDescription>
                </CardHeader>
                <CardContent>
                  <InviteForm teamId={team.id} teamName={team.name} />
                </CardContent>
              </Card>

              {/* Pending Invitations */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Invitations</CardTitle>
                  <CardDescription>{team.invitations.length} pending invitations</CardDescription>
                </CardHeader>
                <CardContent>
                  {team.invitations.length > 0 ? (
                    <div className="space-y-4">
                      {team.invitations.map((invitation: any) => (
                        <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={invitation.user.profilePhoto || undefined} />
                              <AvatarFallback>
                                {invitation.user.name?.charAt(0) || invitation.user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold">{invitation.user.name || invitation.user.username}</div>
                              <div className="text-sm text-muted-foreground">@{invitation.user.username}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelInvitation(invitation.id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No pending invitations</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Join Requests Tab */}
          <TabsContent value="joinRequests">
            <JoinRequestsTab teamId={team.id} joinRequests={team.joinRequests} />
          </TabsContent>

          {/* Team Chat Tab */}
          <TabsContent value="teamChat">
            <TeamChatTab teamId={team.id} teamName={team.name} />
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Matches</CardTitle>
                <CardDescription>View and manage your team's scheduled matches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">No upcoming matches</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <TeamSettingsForm
                teamId={team.id}
                initialName={team.name}
                initialDescription={team.description || ""}
                initialCity={team.city}
                initialCapacity={team.capacity}
                initialLogo={team.logo || null}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Danger Zone</CardTitle>
                  <CardDescription>Irreversible team actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <DeleteTeamButton teamId={team.id} teamName={team.name} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function KickButton({ teamId, memberId, memberName }: { teamId: string, memberId: string, memberName: string }) {
  const handleKick = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to kick ${memberName} from the team? This action cannot be undone.`
    )
    
    if (!confirmed) return

    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}/kick`, {
        method: "DELETE"
      })

      if (response.ok) {
        alert(`${memberName} has been kicked from the team`)
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to kick player")
      }
    } catch (error) {
      console.error("Error kicking player:", error)
      alert("Failed to kick player")
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleKick}>
      Kick
    </Button>
  )
}

function cancelInvitation(invitationId: string) {
  fetch(`/api/invitations/${invitationId}/cancel`, { method: "POST" })
    .then(() => window.location.reload())
    .catch(() => alert("Failed to cancel invitation"))
}

function InviteForm({ teamId, teamName }: { teamId: string, teamName: string }) {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      })

      if (response.ok) {
        alert(`Invitation sent to ${username}!`)
        setUsername("")
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to send invitation")
      }
    } catch (error) {
      console.error("Error sending invitation:", error)
      alert("Failed to send invitation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleInvite} className="flex gap-2">
      <Input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
        disabled={loading}
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Inviting..." : "Invite"}
      </Button>
    </form>
  )
}
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/clerk"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Calendar, Settings, Trophy, UserPlus, Trash2, Crown, Shield } from "lucide-react"
import Link from "next/link"

interface TeamManagePageProps {
  params: {
    id: string
  }
}

export default async function TeamManagePage({ params }: TeamManagePageProps) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/sign-in")
    return null
  }

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: {
          user: true
        },
        orderBy: {
          role: 'asc'
        }
      },
      invitations: {
        include: {
          user: true
        },
        where: {
          status: 'PENDING'
        }
      }
    }
  })

  if (!team) {
    notFound()
  }

  const member = user && team.members.find(m => m.userId === user.id)
  const isOwner = member?.role === 'OWNER'

  if (!isOwner) {
    redirect(`/team/${team.id}`)
  }

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="roster">
              <Users className="mr-2 h-4 w-4" />
              Roster
            </TabsTrigger>
            <TabsTrigger value="invitations">
              <UserPlus className="mr-2 h-4 w-4" />
              Invitations
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
                  {team.members.map((member) => (
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
                        {isOwner && member.userId !== user.id && (
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
                  <form action={`/api/teams/${team.id}/invite`} method="POST" className="flex gap-2">
                    <Input name="username" placeholder="Enter username" required />
                    <Button type="submit">Invite</Button>
                  </form>
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
                      {team.invitations.map((invitation) => (
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
                          <form action={`/api/invitations/${invitation.id}/cancel`} method="POST">
                            <Button variant="ghost" size="sm" type="submit">
                              Cancel
                            </Button>
                          </form>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No pending invitations
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches">
            <div className="space-y-6">
              {/* Upcoming Matches */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Matches</CardTitle>
                  <CardDescription>Your scheduled matches</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    No upcoming matches scheduled
                  </div>
                </CardContent>
              </Card>

              {/* Pending Match Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Match Requests</CardTitle>
                  <CardDescription>Incoming and outgoing match requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    No pending match requests
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Settings</CardTitle>
                  <CardDescription>Update your team information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={`/api/teams/${team.id}/settings`} method="PUT" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="team-name">Team Name</Label>
                      <Input id="team-name" name="name" defaultValue={team.name} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team-description">Description</Label>
                      <Input id="team-description" name="description" defaultValue={team.description || ''} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team-city">City</Label>
                      <Input id="team-city" name="city" defaultValue={team.city} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team-capacity">Team Capacity</Label>
                      <Input id="team-capacity" name="capacity" type="number" defaultValue={team.capacity} min="5" max="50" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team-logo">Team Logo</Label>
                      <Input id="team-logo" type="file" accept="image/*" disabled />
                      <p className="text-xs text-muted-foreground">Logo upload coming soon</p>
                    </div>
                    <Button type="submit">Save Changes</Button>
                  </form>
                </CardContent>
              </Card>

              {isOwner && (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions for your team</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form action={`/api/teams/${team.id}/delete`} method="DELETE">
                      <Button variant="destructive" className="w-full" type="submit">
                        Delete Team
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

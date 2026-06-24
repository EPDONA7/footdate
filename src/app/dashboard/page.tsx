import { redirect } from "next/navigation"
import { syncUserWithClerk } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Users, Trophy, Bell, MessageSquare, Plus, UserPlus, Shield } from "lucide-react"
import Link from "next/link"
import { DashboardChatWidget } from "@/components/dashboard-chat-widget"

export default async function DashboardPage() {
  try {
    const user = await syncUserWithClerk()

    if (!user) {
      redirect("/sign-in")
    }

  // Fetch pending invitations
  const pendingInvitations = await prisma.teamInvitation.findMany({
    where: {
      userId: user.id,
      status: "PENDING"
    },
    include: {
      team: true,
      invitingUser: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 5
  })

  // Fetch user's team
  const teamMembership = await prisma.teamMember.findFirst({
    where: { userId: user.id },
    include: {
      team: true
    }
  })

  // Fetch recent notifications
  const recentNotifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5
  })

  // Fetch upcoming matches (visible to all users)
  const upcomingMatches = await prisma.match.findMany({
    where: {
      status: {
        in: ['SCHEDULED', 'PENDING_CONFIRMATION']
      }
    },
    include: {
      homeTeam: {
        select: {
          id: true,
          name: true,
          logo: true,
          city: true
        }
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          logo: true,
          city: true
        }
      }
    },
    orderBy: {
      date: 'asc'
    },
    take: 5
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name || user.username}!</h1>
            <p className="text-muted-foreground">Here's what's happening with your football journey</p>
          </div>
          <Link href="/profile/edit">
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Manage My Profile
            </Button>
          </Link>
        </div>

        {/* Pending Invitations Alert */}
        {pendingInvitations.length > 0 && (
          <Card className="mb-8 border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                You have {pendingInvitations.length} pending team invitation{pendingInvitations.length > 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={invitation.team.logo || undefined} />
                        <AvatarFallback>{invitation.team.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{invitation.team.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Invited by {invitation.invitingUser.name || invitation.invitingUser.username}
                        </div>
                      </div>
                    </div>
                    <Link href="/invitations">
                      <Button size="sm">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Matches Played</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.matchesPlayed}</div>
              <p className="text-xs text-muted-foreground">Total matches</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user.matchesPlayed > 0 ? Math.round((user.wins / user.matchesPlayed) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">{user.wins} wins</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Player Rating</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.playerRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Overall rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Goals Scored</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.goals}</div>
              <p className="text-xs text-muted-foreground">{user.assists} assists</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Find a Match</CardTitle>
              <CardDescription>Discover opponents and schedule matches</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/match-finder">
                <Button className="w-full">
                  <Calendar className="mr-2 h-4 w-4" />
                  Browse Matches
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Join a Team</CardTitle>
              <CardDescription>Find teams looking for players or create your profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/players/browse" className="block">
                <Button className="w-full" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Browse Players
                </Button>
              </Link>
              <Link href="/teams/browse" className="block">
                <Button className="w-full" variant="outline">
                  <Shield className="mr-2 h-4 w-4" />
                  Browse Teams
                </Button>
              </Link>
              <Link href="/player-profile" className="block">
                <Button className="w-full" variant="ghost">
                  <UserPlus className="mr-2 h-4 w-4" />
                  My Player Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Create Team</CardTitle>
              <CardDescription>Start your own football team</CardDescription>
            </CardHeader>
            <CardContent>
              {teamMembership ? (
                <Link href={`/team/${teamMembership.team.id}/manage`}>
                  <Button className="w-full" variant="secondary">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Team
                  </Button>
                </Link>
              ) : (
                <Link href="/team/create">
                  <Button className="w-full" variant="secondary">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Team
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Global Chat</CardTitle>
              <CardDescription>Chat with players worldwide</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/global-chat">
                <Button className="w-full" variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Join Chat
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Matches</CardTitle>
              <CardDescription>Scheduled matches on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingMatches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No upcoming matches scheduled
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingMatches.map((match) => (
                    <div key={match.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={match.homeTeam.logo || undefined} />
                            <AvatarFallback>
                              {match.homeTeam.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{match.homeTeam.name}</div>
                            <div className="text-xs text-muted-foreground">{match.homeTeam.city}</div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold">VS</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(match.date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">{match.time}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="font-semibold">{match.awayTeam.name}</div>
                            <div className="text-xs text-muted-foreground">{match.awayTeam.city}</div>
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={match.awayTeam.logo || undefined} />
                            <AvatarFallback>
                              {match.awayTeam.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      {match.city && (
                        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                          📍 {match.city} {match.venue && `- ${match.venue}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>Stay updated with your activity</CardDescription>
            </CardHeader>
            <CardContent>
              {recentNotifications.length > 0 ? (
                <div className="space-y-3">
                  {recentNotifications.map((notification) => (
                    <div key={notification.id} className="p-3 border rounded-lg">
                      <div className="font-semibold text-sm">{notification.title}</div>
                      <div className="text-sm text-muted-foreground">{notification.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  <Link href="/notifications">
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      View All Notifications
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No new notifications
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <DashboardChatWidget />
    </div>
  )
  } catch (error) {
    console.error("Dashboard error:", error)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Dashboard</h1>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
          <Link href="/sign-in">
            <Button>Try Again</Button>
          </Link>
        </div>
      </div>
    )
  }
}

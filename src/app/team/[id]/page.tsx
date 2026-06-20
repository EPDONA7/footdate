import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/clerk"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Trophy, Users, Settings, Shield, Crown } from "lucide-react"
import Link from "next/link"
import { revalidatePath } from "next/cache"

interface TeamPageProps {
  params: {
    id: string
  }
}

export default async function TeamPage({ params }: TeamPageProps) {
  const user = await getCurrentUser()

  // Revalidate to ensure fresh data
  revalidatePath(`/team/${params.id}`)

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
      homeMatches: {
        where: {
          status: {
            in: ['SCHEDULED', 'PENDING_CONFIRMATION']
          }
        },
        include: {
          awayTeam: true
        },
        orderBy: {
          date: 'asc'
        },
        take: 3
      },
      awayMatches: {
        where: {
          status: {
            in: ['SCHEDULED', 'PENDING_CONFIRMATION']
          }
        },
        include: {
          homeTeam: true
        },
        orderBy: {
          date: 'asc'
        },
        take: 3
      }
    }
  })

  if (!team) {
    redirect('/dashboard')
  }

  const member = user && team.members.find(m => m.userId === user.id)
  const isOwner = member?.role === 'OWNER'

  const upcomingMatches = [...team.homeMatches, ...team.awayMatches]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Team Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-32 w-32">
              <AvatarImage src={team.logo || undefined} />
              <AvatarFallback className="text-4xl">
                {team.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{team.name}</h1>
                {team.logo && <Badge variant="outline">Verified</Badge>}
              </div>
              <p className="text-muted-foreground mb-4">{team.description || "No description"}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {team.city}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {team.members.length} / {team.capacity} members
                </div>
              </div>
            </div>
            {isOwner && (
              <Link href={`/team/${team.id}/manage`}>
                <Button>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Team
                </Button>
              </Link>
            )}
            {member && member.role !== 'OWNER' && (
              <form action={`/api/teams/${team.id}/leave`} method="POST" onSubmit={(e) => {
                e.preventDefault()
                fetch(`/api/teams/${team.id}/leave`, { method: 'POST' })
                  .then(res => res.json())
                  .then(data => {
                    if (data.message) {
                      window.location.href = '/dashboard'
                    } else {
                      alert(data.error || 'Failed to leave team')
                    }
                  })
                  .catch(err => {
                    console.error(err)
                    alert('Failed to leave team')
                  })
              }}>
                <Button variant="destructive" type="submit">
                  Leave Team
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Matches Played</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{team.matchesPlayed}</div>
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
                {team.matchesPlayed > 0 ? Math.round((team.wins / team.matchesPlayed) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">{team.wins} wins</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{team.points}</div>
              <p className="text-xs text-muted-foreground">League points</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Goal Diff</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{team.goalsFor - team.goalsAgainst}</div>
              <p className="text-xs text-muted-foreground">{team.goalsFor} for, {team.goalsAgainst} against</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Members */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>{team.members.length} members</CardDescription>
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
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {member.role === 'OWNER' && <Crown className="h-3 w-3" />}
                        {member.role === 'MANAGER' && <Shield className="h-3 w-3" />}
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Matches */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Matches</CardTitle>
                <CardDescription>Next 3 matches</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingMatches.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingMatches.map((match: any) => (
                      <div key={match.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-semibold">
                            {match.homeTeam?.name} vs {match.awayTeam?.name}
                          </div>
                          <Badge variant="outline">{match.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(match.date).toLocaleDateString()} at {match.time}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {match.city}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No upcoming matches
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

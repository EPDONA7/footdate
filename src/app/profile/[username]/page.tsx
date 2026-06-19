import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Trophy, Target, Users, MessageCircle, UserPlus } from "lucide-react"
import Link from "next/link"

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: {
      teamMemberships: {
        include: {
          team: true
        }
      }
    }
  })

  if (!user) {
    notFound()
  }

  const currentTeam = user.teamMemberships[0]?.team

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-32 w-32">
              <AvatarImage src={user.profilePhoto || undefined} />
              <AvatarFallback className="text-3xl">
                {user.name?.charAt(0) || user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{user.name || user.username}</h1>
                <Badge variant="outline">@{user.username}</Badge>
              </div>
              <p className="text-muted-foreground mb-4">{user.bio || "No bio yet"}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {user.city || "No location"}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {user.age ? `${user.age} years old` : "Age not specified"}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/messages/new?username=${user.username}`}>
                <Button variant="outline">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message
                </Button>
              </Link>
              <Button disabled>
                <UserPlus className="mr-2 h-4 w-4" />
                Follow
              </Button>
            </div>
          </div>
        </div>

        {/* Team Badge */}
        {currentTeam && (
          <Link href={`/team/${currentTeam.id}`}>
            <Card className="mb-6 hover:bg-accent/50 cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={currentTeam.logo || undefined} />
                    <AvatarFallback>{currentTeam.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{currentTeam.name}</div>
                    <div className="text-sm text-muted-foreground">Current Team</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Football Information */}
            <Card>
              <CardHeader>
                <CardTitle>Football Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Primary Position</div>
                    <Badge variant="secondary">{user.primaryPosition || "Not specified"}</Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Secondary Position</div>
                    <Badge variant="secondary">{user.secondaryPosition || "Not specified"}</Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Skill Level</div>
                  <Badge variant="outline">{user.skillLevel || "Not specified"}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user.matchesPlayed}</div>
                    <div className="text-sm text-muted-foreground">Matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user.wins}</div>
                    <div className="text-sm text-muted-foreground">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user.goals}</div>
                    <div className="text-sm text-muted-foreground">Goals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user.assists}</div>
                    <div className="text-sm text-muted-foreground">Assists</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user.mvpAwards}</div>
                    <div className="text-sm text-muted-foreground">MVP Awards</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user.playerRating.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user.draws}</div>
                    <div className="text-sm text-muted-foreground">Draws</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user.losses}</div>
                    <div className="text-sm text-muted-foreground">Losses</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Available Days</div>
                    <div className="flex flex-wrap gap-2">
                      {user.availableDays && user.availableDays.length > 0 ? (
                        user.availableDays.map((day) => (
                          <Badge key={day} variant="outline">{day}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">Not specified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Preferred Times</div>
                    <div className="flex flex-wrap gap-2">
                      {user.preferredTimes && user.preferredTimes.length > 0 ? (
                        user.preferredTimes.map((time) => (
                          <Badge key={time} variant="secondary">{time}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">Not specified</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/messages/new?username=${user.username}`} className="block">
                  <Button className="w-full" variant="outline">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </Link>
                {currentTeam ? (
                  <>
                    <Link href={`/marketplace`} className="block">
                      <Button className="w-full" variant="secondary">
                        <Users className="mr-2 h-4 w-4" />
                        Invite to Team
                      </Button>
                    </Link>
                    {user.teamMemberships[0]?.role !== 'OWNER' && (
                      <form action={`/api/teams/${currentTeam.id}/leave`} method="POST" onSubmit={(e) => {
                        e.preventDefault()
                        fetch(`/api/teams/${currentTeam.id}/leave`, { method: 'POST' })
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
                        <Button className="w-full" variant="destructive" type="submit">
                          Leave Team
                        </Button>
                      </form>
                    )}
                  </>
                ) : (
                  <Link href="/team/create">
                    <Button className="w-full" variant="secondary">
                      <Users className="mr-2 h-4 w-4" />
                      Create Team First
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Rating History */}
            <Card>
              <CardHeader>
                <CardTitle>Rating History</CardTitle>
                <CardDescription>Recent performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Rating history coming soon
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

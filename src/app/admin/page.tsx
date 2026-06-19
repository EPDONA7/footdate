import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Shield, AlertTriangle, TrendingUp, Calendar, Trophy } from "lucide-react"

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/sign-in")
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [userCount, teamCount, matchCount, disputeCount] = await Promise.all([
    prisma.user.count(),
    prisma.team.count(),
    prisma.match.count(),
    prisma.matchDispute.count({ where: { status: "OPEN" } })
  ])

  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: "desc" }
  })

  const openDisputes = await prisma.matchDispute.findMany({
    where: { status: "OPEN" },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      match: {
        include: {
          homeTeam: true,
          awayTeam: true
        }
      }
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, disputes, and platform analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userCount}</div>
              <p className="text-xs text-muted-foreground">Registered players</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamCount}</div>
              <p className="text-xs text-muted-foreground">Active teams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matchCount}</div>
              <p className="text-xs text-muted-foreground">Matches played</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{disputeCount}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage platform users and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsers.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={user.profilePhoto || undefined} />
                          <AvatarFallback>
                            {user.name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{user.name || user.username}</div>
                          <div className="text-sm text-muted-foreground">@{user.username}</div>
                          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">View Profile</Button>
                        {user.role !== "ADMIN" && (
                          <Button size="sm">Make Admin</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes">
            <Card>
              <CardHeader>
                <CardTitle>Dispute Resolution</CardTitle>
                <CardDescription>Resolve match disputes reported by teams</CardDescription>
              </CardHeader>
              <CardContent>
                {openDisputes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No open disputes
                  </div>
                ) : (
                  <div className="space-y-4">
                    {openDisputes.map((dispute: any) => (
                      <div key={dispute.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold">
                            {dispute.match.homeTeam.name} vs {dispute.match.awayTeam.name}
                          </div>
                          <Badge variant="destructive">Open</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {dispute.reason}
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm">Resolve</Button>
                          <Button size="sm" variant="outline">View Details</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Growth</CardTitle>
                  <CardDescription>User registration over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p>Analytics dashboard coming soon</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Match Statistics</CardTitle>
                  <CardDescription>Match completion rates and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4" />
                    <p>Detailed analytics coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

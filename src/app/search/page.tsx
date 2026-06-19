import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Users, Calendar, MapPin } from "lucide-react"
import Link from "next/link"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string }
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/sign-in")
  }

  const query = searchParams.q || ""
  const type = searchParams.type || "all"

  let users: any[] = []
  let teams: any[] = []
  let matches: any[] = []

  if (query) {
    if (type === "all" || type === "players") {
      users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } }
          ]
        },
        take: 10,
        include: {
          teamMemberships: {
            include: {
              team: true
            }
          }
        }
      })
    }

    if (type === "all" || type === "teams") {
      teams = await prisma.team.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } }
          ]
        },
        take: 10
      })
    }

    if (type === "all" || type === "matches") {
      matches = await prisma.match.findMany({
        where: {
          OR: [
            { city: { contains: query, mode: "insensitive" } },
            { venue: { contains: query, mode: "insensitive" } }
          ]
        },
        take: 10,
        include: {
          homeTeam: true,
          awayTeam: true
        }
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Search</h1>
          <p className="text-muted-foreground">Find players, teams, and matches</p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search for players, teams, or matches..." 
                  className="pl-10"
                  defaultValue={query}
                />
              </div>
              <Select defaultValue={type}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="players">Players</SelectItem>
                  <SelectItem value="teams">Teams</SelectItem>
                  <SelectItem value="matches">Matches</SelectItem>
                </SelectContent>
              </Select>
              <Button>Search</Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {!query && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Start Searching</h3>
              <p className="text-muted-foreground">
                Enter a search term to find players, teams, or matches
              </p>
            </CardContent>
          </Card>
        )}

        {query && (
          <div className="space-y-8">
            {/* Players */}
            {(type === "all" || type === "players") && users.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players ({users.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.map((player: any) => (
                    <Link key={player.id} href={`/profile/${player.username}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={player.profilePhoto || undefined} />
                              <AvatarFallback>
                                {player.name?.charAt(0) || player.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">
                                {player.name || player.username}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                @{player.username}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <MapPin className="h-3 w-3" />
                                <span className="text-xs">{player.city}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Teams */}
            {(type === "all" || type === "teams") && teams.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Teams ({teams.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.map((team: any) => (
                    <Link key={team.id} href={`/team/${team.id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                              {team.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">{team.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <MapPin className="h-3 w-3" />
                                <span className="text-xs text-muted-foreground">{team.city}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Matches */}
            {(type === "all" || type === "matches") && matches.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Matches ({matches.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches.map((match: any) => (
                    <Card key={match.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                              {match.homeTeam.name.charAt(0)}
                            </div>
                            <span className="font-semibold">{match.homeTeam.name}</span>
                          </div>
                          <span className="text-2xl font-bold">VS</span>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{match.awayTeam.name}</span>
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                              {match.awayTeam.name.charAt(0)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(match.date).toLocaleDateString()}</span>
                          <MapPin className="h-4 w-4 ml-2" />
                          <span>{match.city}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {query && users.length === 0 && teams.length === 0 && matches.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No results found for "{query}"</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

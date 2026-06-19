"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Calendar, Trophy, Target, Users, Search, UserPlus } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  username: string
  name: string | null
  bio: string | null
  city: string | null
  age: number | null
  primaryPosition: string | null
  secondaryPosition: string | null
  skillLevel: string | null
  matchesPlayed: number
  wins: number
  goals: number
  assists: number
  playerRating: number
  availableDays: string[]
  preferredTimes: string[]
  profilePhoto: string | null
}

interface Team {
  id: string
  name: string
  role: string
}

export default function MarketplacePage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userTeams, setUserTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCity, setFilterCity] = useState("")
  const [filterPosition, setFilterPosition] = useState("")
  const [filterSkillLevel, setFilterSkillLevel] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchQuery, filterCity, filterPosition, filterSkillLevel, users])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
        setFilteredUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (user.city && user.city.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (filterCity) {
      filtered = filtered.filter((user) => user.city === filterCity)
    }

    if (filterPosition) {
      filtered = filtered.filter(
        (user) => user.primaryPosition === filterPosition || user.secondaryPosition === filterPosition
      )
    }

    if (filterSkillLevel) {
      filtered = filtered.filter((user) => user.skillLevel === filterSkillLevel)
    }

    setFilteredUsers(filtered)
  }

  const handleInviteClick = async (user: User) => {
    setSelectedUser(user)
    try {
      const response = await fetch("/api/user/teams")
      if (response.ok) {
        const teams = await response.json()
        setUserTeams(teams)
        if (teams.length > 0) {
          setSelectedTeam(teams[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching user teams:", error)
    }
    setInviteDialogOpen(true)
  }

  const handleSendInvitation = async () => {
    if (!selectedUser || !selectedTeam) return

    try {
      const response = await fetch(`/api/teams/${selectedTeam}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: selectedUser.username }),
      })

      if (response.ok) {
        alert("Invitation sent successfully!")
        setInviteDialogOpen(false)
        setSelectedUser(null)
        setSelectedTeam("")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to send invitation")
      }
    } catch (error) {
      console.error("Error sending invitation:", error)
      alert("Failed to send invitation")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">Loading players...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Player Marketplace</h1>
          <p className="text-muted-foreground">Find players looking to join teams</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCity || "all"} onValueChange={(value) => setFilterCity(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {Array.from(new Set(users.map((u) => u.city).filter((c): c is string => Boolean(c)))).map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPosition || "all"} onValueChange={(value) => setFilterPosition(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="GOALKEEPER">Goalkeeper</SelectItem>
                  <SelectItem value="DEFENDER">Defender</SelectItem>
                  <SelectItem value="MIDFIELDER">Midfielder</SelectItem>
                  <SelectItem value="FORWARD">Forward</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSkillLevel || "all"} onValueChange={(value) => setFilterSkillLevel(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                  <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Player Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.profilePhoto || undefined} />
                    <AvatarFallback className="text-2xl">
                      {user.name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{user.name || user.username}</CardTitle>
                    <CardDescription>@{user.username}</CardDescription>
                    {user.city && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {user.city}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.bio && <p className="text-sm text-muted-foreground">{user.bio}</p>}

                <div className="flex flex-wrap gap-2">
                  {user.primaryPosition && <Badge variant="secondary">{user.primaryPosition}</Badge>}
                  {user.secondaryPosition && <Badge variant="outline">{user.secondaryPosition}</Badge>}
                  {user.skillLevel && <Badge variant="outline">{user.skillLevel}</Badge>}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold">{user.matchesPlayed}</div>
                    <div className="text-xs text-muted-foreground">Matches</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{user.wins}</div>
                    <div className="text-xs text-muted-foreground">Wins</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{user.playerRating.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/profile/${user.username}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                  <Dialog open={inviteDialogOpen && selectedUser?.id === user.id} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => handleInviteClick(user)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite {selectedUser?.name || selectedUser?.username}</DialogTitle>
                        <DialogDescription>Select which team to invite this player to</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {userTeams.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            You don't have any teams where you can invite players. Create a team first.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            <Label>Select Team</Label>
                            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a team" />
                              </SelectTrigger>
                              <SelectContent>
                                {userTeams.map((team) => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name} ({team.role})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSendInvitation} disabled={!selectedTeam || userTeams.length === 0}>
                          Send Invitation
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No players found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

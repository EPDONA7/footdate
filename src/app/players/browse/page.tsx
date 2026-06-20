"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, UserPlus, MapPin, Calendar } from "lucide-react"
import Link from "next/link"

interface PlayerProfile {
  id: string
  bio: string | null
  rank: string | null
  availability: string[]
  preferredPosition: string | null
  skillLevel: string | null
  lookingForTeam: boolean
  user: {
    id: string
    username: string
    name: string | null
    profilePhoto: string | null
    skillLevel: string | null
    primaryPosition: string | null
    city: string | null
  }
}

export default function BrowsePlayersPage() {
  const [profiles, setProfiles] = useState<PlayerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    skillLevel: "",
    position: "",
    city: ""
  })

  useEffect(() => {
    fetchProfiles()
  }, [filters])

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.skillLevel) params.append("skillLevel", filters.skillLevel)
      if (filters.position) params.append("position", filters.position)
      if (filters.city) params.append("city", filters.city)

      const res = await fetch(`/api/players/browse?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProfiles(data.profiles || [])
      }
    } catch (error) {
      console.error("Error fetching profiles:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendJoinInvitation = async (playerUserId: string) => {
    // This would be handled by team invitations system
    alert("Team invitation feature coming soon!")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2">Browse Players</h1>
            <p className="text-muted-foreground">Find players looking for teams</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Skill Level</label>
                <select
                  value={filters.skillLevel}
                  onChange={(e) => setFilters(prev => ({ ...prev, skillLevel: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All Levels</option>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                  <option value="PROFESSIONAL">Professional</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Position</label>
                <select
                  value={filters.position}
                  onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All Positions</option>
                  <option value="GOALKEEPER">Goalkeeper</option>
                  <option value="DEFENDER">Defender</option>
                  <option value="MIDFIELDER">Midfielder</option>
                  <option value="FORWARD">Forward</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">City</label>
                <Input
                  placeholder="Filter by city"
                  value={filters.city}
                  onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players Grid */}
        {loading ? (
          <div className="text-center py-12">Loading players...</div>
        ) : profiles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No players found</h3>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={profile.user.profilePhoto || undefined} />
                      <AvatarFallback>
                        {profile.user.name?.charAt(0) || profile.user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {profile.user.name || profile.user.username}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">@{profile.user.username}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {profile.skillLevel && (
                        <Badge variant="secondary">{profile.skillLevel}</Badge>
                      )}
                      {profile.preferredPosition && (
                        <Badge variant="outline">{profile.preferredPosition}</Badge>
                      )}
                      {profile.rank && (
                        <Badge variant="outline">{profile.rank}</Badge>
                      )}
                    </div>

                    {profile.user.city && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {profile.user.city}
                      </div>
                    )}

                    {profile.availability.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{profile.availability.slice(0, 3).join(", ")}
                          {profile.availability.length > 3 && "..."}
                        </span>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => sendJoinInvitation(profile.user.id)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite to Team
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
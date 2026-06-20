"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, MapPin, Users, Shield, UserPlus } from "lucide-react"
import Link from "next/link"

interface Team {
  id: string
  name: string
  description: string | null
  logo: string | null
  city: string
  capacity: number
  members: any[]
  _count: {
    members: number
  }
}

export default function BrowseTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    city: "",
    search: ""
  })

  useEffect(() => {
    fetchTeams()
  }, [filters])

  const fetchTeams = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.city) params.append("city", filters.city)
      if (filters.search) params.append("search", filters.search)

      const res = await fetch(`/api/teams?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTeams(data.teams || [])
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const requestToJoin = async (teamId: string) => {
    try {
      const res = await fetch("/api/team-join-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId })
      })

      if (res.ok) {
        alert("Join request sent successfully!")
      } else {
        const error = await res.json()
        alert(error.error || "Failed to send join request")
      }
    } catch (error) {
      console.error("Error sending join request:", error)
      alert("Failed to send join request")
    }
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
            <h1 className="text-3xl font-bold mb-2">Browse Teams</h1>
            <p className="text-muted-foreground">Discover teams on the platform</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Search Teams</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
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

        {/* Teams Grid */}
        {loading ? (
          <div className="text-center py-12">Loading teams...</div>
        ) : teams.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No teams found</h3>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const owner = team.members.find((m: any) => m.role === "OWNER")
              return (
                <Card key={team.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={team.logo || undefined} />
                        <AvatarFallback className="text-2xl">{team.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2">{team.description || "No description"}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {team.city}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {team._count.members} / {team.capacity} members
                      </div>

                      {owner && (
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          Owner: {owner.user.name || owner.user.username}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Link href={`/team/${team.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            View Profile
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => requestToJoin(team.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Request to Join
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
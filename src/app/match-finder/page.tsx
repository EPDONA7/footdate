"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Calendar, Clock, Target, Search, Plus, Globe, Users, Eye, Inbox, Star } from "lucide-react"
import Link from "next/link"

type Tab = "random" | "specific" | "watch"

export default function MatchFinderPage() {
  const [activeTab, setActiveTab] = useState<Tab>("random")
  const [randomRequests, setRandomRequests] = useState<any[]>([])
  const [specificRequests, setSpecificRequests] = useState<any[]>([])
  const [watchGames, setWatchGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatchRequests()
    fetchWatchGames()
  }, [])

  const fetchMatchRequests = async () => {
    try {
      const [randomRes, specificRes] = await Promise.all([
        fetch("/api/match-requests?type=random"),
        fetch("/api/match-requests?type=specific"),
      ])

      if (randomRes.ok) {
        const randomData = await randomRes.json()
        setRandomRequests(randomData.matchRequests || [])
      }

      if (specificRes.ok) {
        const specificData = await specificRes.json()
        setSpecificRequests(specificData.matchRequests || [])
      }
    } catch (error) {
      console.error("Error fetching match requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWatchGames = async () => {
    try {
      const res = await fetch("/api/matches/watch")
      if (res.ok) {
        const data = await res.json()
        setWatchGames(data.matches || [])
      }
    } catch (error) {
      console.error("Error fetching watch games:", error)
    }
  }

  const handleApply = async (requestId: string) => {
    try {
      const response = await fetch(`/api/match-requests/${requestId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        alert("Application sent! The match creator has been notified.")
        fetchMatchRequests()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to apply")
      }
    } catch (error) {
      console.error("Error applying:", error)
      alert("Failed to apply")
    }
  }

  const handleSpectate = async (matchId: string, status: "INTERESTED" | "GOING", current: string | null) => {
    try {
      if (current === status) {
        await fetch(`/api/matches/${matchId}/spectate`, { method: "DELETE" })
      } else {
        await fetch(`/api/matches/${matchId}/spectate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        })
      }
      fetchWatchGames()
    } catch (error) {
      console.error("Error updating spectator status:", error)
      alert("Failed to update")
    }
  }

  const renderRequestCard = (request: any, isRandom: boolean) => (
    <Card key={request.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline">Futsal</Badge>
          {request.skillLevel && <Badge variant="secondary">{request.skillLevel}</Badge>}
          <Badge variant={isRandom ? "default" : "secondary"}>
            {isRandom ? <Globe className="h-3 w-3 mr-1" /> : <Users className="h-3 w-3 mr-1" />}
            {isRandom ? "Random" : "Specific"}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={request.requestingTeam?.logo} />
              <AvatarFallback>
                {request.requestingTeam?.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{request.requestingTeam?.name}</CardTitle>
              <CardDescription>Requesting Team</CardDescription>
            </div>
          </div>
          <div className="text-2xl font-bold">VS</div>
          <div className="flex items-center gap-3">
            {request.targetTeam ? (
              <>
                <div className="text-right">
                  <CardTitle className="text-lg">{request.targetTeam.name}</CardTitle>
                  <CardDescription>Target Team</CardDescription>
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={request.targetTeam.logo} />
                  <AvatarFallback>
                    {request.targetTeam.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </>
            ) : (
              <>
                <div className="text-right">
                  <CardTitle className="text-lg">Looking for Opponent</CardTitle>
                  <CardDescription>Open Request</CardDescription>
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {request.image && (
          <img src={request.image} alt="Match" className="h-40 w-full rounded-md object-cover" />
        )}
        {request.description && (
          <p className="text-sm text-muted-foreground">{request.description}</p>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(request.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{request.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{request.city}</span>
          </div>
          {request.futsalLocation && (
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>{request.futsalLocation}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!request.targetTeam && (
            request.hasApplied ? (
              <Button className="flex-1" variant="secondary" disabled>
                {request.myApplicationStatus === "REJECTED" ? "Application Rejected" : "Applied"}
              </Button>
            ) : (
              <Button className="flex-1" onClick={() => handleApply(request.id)}>
                Apply
              </Button>
            )
          )}
          <Button variant="outline" className="flex-1">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderWatchCard = (match: any) => (
    <Card key={match.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline">Futsal</Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {match.spectatorCount} interested
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={match.homeTeam?.logo} />
              <AvatarFallback>{match.homeTeam?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-lg">{match.homeTeam?.name}</CardTitle>
          </div>
          <div className="text-2xl font-bold">VS</div>
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{match.awayTeam?.name}</CardTitle>
            <Avatar className="h-12 w-12">
              <AvatarImage src={match.awayTeam?.logo} />
              <AvatarFallback>{match.awayTeam?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {match.image && (
          <img src={match.image} alt="Match" className="h-40 w-full rounded-md object-cover" />
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(match.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{match.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{match.city}</span>
          </div>
          {match.futsalLocation && (
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>{match.futsalLocation}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{match.interestedCount} interested</span>
          <span>{match.goingCount} going to watch</span>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1"
            variant={match.myStatus === "INTERESTED" ? "default" : "outline"}
            onClick={() => handleSpectate(match.id, "INTERESTED", match.myStatus)}
          >
            <Star className="mr-2 h-4 w-4" />
            I&apos;m Interested
          </Button>
          <Button
            className="flex-1"
            variant={match.myStatus === "GOING" ? "default" : "outline"}
            onClick={() => handleSpectate(match.id, "GOING", match.myStatus)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Going to Watch
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Match Finder</h1>
            <p className="text-muted-foreground">Find opponents, schedule matches, and watch local games</p>
          </div>
          <div className="flex gap-2">
            <Link href="/match-finder/applications">
              <Button variant="outline">
                <Inbox className="mr-2 h-4 w-4" />
                Pending Requests
              </Button>
            </Link>
            <Link href="/match-finder/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Match Request
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <Button
            variant={activeTab === "random" ? "default" : "outline"}
            onClick={() => setActiveTab("random")}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            Random Requests
            <Badge variant="secondary">{randomRequests.length}</Badge>
          </Button>
          <Button
            variant={activeTab === "specific" ? "default" : "outline"}
            onClick={() => setActiveTab("specific")}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Specific Invitations
            <Badge variant="secondary">{specificRequests.length}</Badge>
          </Button>
          <Button
            variant={activeTab === "watch" ? "default" : "outline"}
            onClick={() => setActiveTab("watch")}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Watch Games
            <Badge variant="secondary">{watchGames.length}</Badge>
          </Button>
        </div>

        {/* Filters */}
        {activeTab !== "watch" && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search requests..." className="pl-10" />
                </div>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    <SelectItem value="addis-ababa">Addis Ababa</SelectItem>
                    <SelectItem value="dire-dawa">Dire Dawa</SelectItem>
                    <SelectItem value="mekelle">Mekelle</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Skill Level" />
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
        )}

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Loading match requests...</p>
          </div>
        ) : activeTab === "random" ? (
          randomRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No random requests found. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {randomRequests.map((request) => renderRequestCard(request, true))}
            </div>
          )
        ) : activeTab === "specific" ? (
          specificRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No specific invitations found. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {specificRequests.map((request) => renderRequestCard(request, false))}
            </div>
          )
        ) : (
          watchGames.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No upcoming games open for spectators yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {watchGames.map((match) => renderWatchCard(match))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

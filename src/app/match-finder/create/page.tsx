"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, Clock, MapPin, Target, Users, Globe } from "lucide-react"
import Link from "next/link"

export default function CreateMatchPage() {
  const [loading, setLoading] = useState(false)
  const [requestType, setRequestType] = useState<"random" | "specific">("random")
  const [teams, setTeams] = useState<any[]>([])
  const [allTeams, setAllTeams] = useState<any[]>([])
  const [userTeam, setUserTeam] = useState<any>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formData, setFormData] = useState({
    requestingTeamId: "",
    targetTeamId: "",
    date: "",
    time: "",
    city: "",
    venue: "",
    futsalLocation: "",
    image: "",
    skillLevel: "",
    description: "",
  })

  useEffect(() => {
    fetchTeams()
    fetchAllTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/user/teams")
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
        if (data.length > 0) {
          setUserTeam(data[0])
          setFormData(prev => ({ ...prev, requestingTeamId: data[0].id, city: data[0].city }))
        }
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
  }

  const fetchAllTeams = async () => {
    try {
      const response = await fetch("/api/teams")
      if (response.ok) {
        const data = await response.json()
        setAllTeams(data.teams || [])
      }
    } catch (error) {
      console.error("Error fetching all teams:", error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    const uploadData = new FormData()
    uploadData.append("file", file)
    uploadData.append("folder", "match-images")

    try {
      const response = await fetch("/api/upload", { method: "POST", body: uploadData })
      const data = await response.json()
      if (response.ok) {
        setFormData((prev) => ({ ...prev, image: data.url }))
      } else {
        alert(data.error || "Failed to upload image")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.futsalLocation.trim()) {
      alert("Futsal location is required")
      return
    }
    setLoading(true)

    try {
      const response = await fetch("/api/match-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          requestType,
        }),
      })

      if (response.ok) {
        const matchRequest = await response.json()
        window.location.href = "/match-finder"
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create match request")
      }
    } catch (error) {
      console.error("Error creating match request:", error)
      alert("Failed to create match request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href="/match-finder">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Match Finder
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Create Match Request</h1>
          <p className="text-muted-foreground">Choose how you want to find opponents</p>
        </div>

        {!userTeam ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>No Team Found</CardTitle>
              <CardDescription>You need to be a member of a team to create a match request</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/team/create">
                <Button>Create a Team</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Request Type
              </CardTitle>
              <CardDescription>Choose how you want to find opponents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Button
                  type="button"
                  variant={requestType === "random" ? "default" : "outline"}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => setRequestType("random")}
                >
                  <Globe className="h-6 w-6" />
                  <span className="font-semibold">Random Request</span>
                  <span className="text-xs text-center">Ask everyone, choose opponent later</span>
                </Button>
                <Button
                  type="button"
                  variant={requestType === "specific" ? "default" : "outline"}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => setRequestType("specific")}
                >
                  <Users className="h-6 w-6" />
                  <span className="font-semibold">Specific Team</span>
                  <span className="text-xs text-center">Invite a specific team</span>
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="requestingTeam">Your Team</Label>
                  <Select value={formData.requestingTeamId} disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Your team will be the requesting team</p>
                </div>

                {requestType === "specific" && (
                  <div className="space-y-2">
                    <Label htmlFor="targetTeam">Opponent Team *</Label>
                    <Select value={formData.targetTeamId} onValueChange={(value) => setFormData({ ...formData, targetTeamId: value })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select opponent team" />
                      </SelectTrigger>
                      <SelectContent>
                        {allTeams.filter(t => t.id !== formData.requestingTeamId).map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name} ({team.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {requestType === "random" && (
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Describe what you're looking for (optional)"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      maxLength={500}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    placeholder="Enter venue (optional)"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="futsalLocation">Futsal Location *</Label>
                  <Input
                    id="futsalLocation"
                    placeholder="Enter the futsal location"
                    value={formData.futsalLocation}
                    onChange={(e) => setFormData({ ...formData, futsalLocation: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="matchImage">Match Image</Label>
                  <Input
                    id="matchImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <p className="text-xs text-muted-foreground">Uploading image...</p>}
                  {formData.image && (
                    <img src={formData.image} alt="Match" className="mt-2 h-32 w-full rounded-md object-cover" />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="skillLevel">Skill Level</Label>
                    <Select value={formData.skillLevel} onValueChange={(value) => setFormData({ ...formData, skillLevel: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select skill level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEGINNER">Beginner</SelectItem>
                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                        <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="hidden md:block" />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating Request..." : requestType === "random" ? "Post Random Request" : "Send Invitation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

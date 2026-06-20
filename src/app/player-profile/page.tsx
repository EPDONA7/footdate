"use client"

import { useState, useEffect } from "react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, Save } from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"

export default function PlayerProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    bio: "",
    rank: "",
    availability: [] as string[],
    preferredPosition: "" as any,
    skillLevel: "" as any,
    lookingForTeam: false
  })
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const userRes = await fetch("/api/users/me")
      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData.user)
      }

      const profileRes = await fetch("/api/player-profile")
      if (profileRes.ok) {
        const data = await profileRes.json()
        if (data.profile) {
          setProfile({
            bio: data.profile.bio || "",
            rank: data.profile.rank || "",
            availability: data.profile.availability || [],
            preferredPosition: data.profile.preferredPosition || "",
            skillLevel: data.profile.skillLevel || "",
            lookingForTeam: data.profile.lookingForTeam || false
          })
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/player-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      })

      if (response.ok) {
        alert("Profile updated successfully!")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const toggleAvailability = (day: string) => {
    setProfile(prev => ({
      ...prev,
      availability: prev.availability.includes(day)
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center py-12">Loading profile...</div>
        </div>
      </div>
    )
  }

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const positions = ["GOALKEEPER", "DEFENDER", "MIDFIELDER", "FORWARD"]
  const skillLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"]

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
            <h1 className="text-3xl font-bold mb-2">Player Profile</h1>
            <p className="text-muted-foreground">Manage your recruitment profile</p>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Set your availability and preferences for team recruitment</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Looking for Team Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Looking for Team</h3>
                  <p className="text-sm text-muted-foreground">Make your profile visible to team owners</p>
                </div>
                <input
                  type="checkbox"
                  checked={profile.lookingForTeam}
                  onChange={(e) => setProfile(prev => ({ ...prev, lookingForTeam: e.target.checked }))}
                  className="h-5 w-5"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  placeholder="Tell teams about yourself"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  maxLength={500}
                />
              </div>

              {/* Rank */}
              <div className="space-y-2">
                <Label htmlFor="rank">Rank/Level</Label>
                <Input
                  id="rank"
                  placeholder="e.g., Gold, Diamond, etc."
                  value={profile.rank}
                  onChange={(e) => setProfile(prev => ({ ...prev, rank: e.target.value }))}
                  maxLength={50}
                />
              </div>

              {/* Skill Level */}
              <div className="space-y-2">
                <Label htmlFor="skillLevel">Skill Level</Label>
                <select
                  id="skillLevel"
                  value={profile.skillLevel}
                  onChange={(e) => setProfile(prev => ({ ...prev, skillLevel: e.target.value as any }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select skill level</option>
                  {skillLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* Preferred Position */}
              <div className="space-y-2">
                <Label htmlFor="position">Preferred Position</Label>
                <select
                  id="position"
                  value={profile.preferredPosition}
                  onChange={(e) => setProfile(prev => ({ ...prev, preferredPosition: e.target.value as any }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select position</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              {/* Availability */}
              <div className="space-y-2">
                <Label>Availability</Label>
                <div className="flex flex-wrap gap-2">
                  {days.map(day => (
                    <Badge
                      key={day}
                      variant={profile.availability.includes(day) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleAvailability(day)}
                    >
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
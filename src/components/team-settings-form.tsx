"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TeamSettingsFormProps {
  teamId: string
  initialName: string
  initialDescription: string
  initialCity: string
  initialCapacity: number
  initialLogo: string | null
}

export function TeamSettingsForm({
  teamId,
  initialName,
  initialDescription,
  initialCity,
  initialCapacity,
  initialLogo,
}: TeamSettingsFormProps) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [city, setCity] = useState(initialCity)
  const [capacity, setCapacity] = useState(initialCapacity)
  const [logo, setLogo] = useState(initialLogo || "")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const uploadData = new FormData()
    uploadData.append("file", file)
    uploadData.append("folder", "team-logos")

    try {
      const res = await fetch("/api/upload", { method: "POST", body: uploadData })
      const data = await res.json()
      if (res.ok) {
        setLogo(data.url)
      } else {
        alert(data.error || "Failed to upload logo")
      }
    } catch (error) {
      console.error("Error uploading logo:", error)
      alert("Failed to upload logo")
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          city,
          capacity: Number(capacity),
          logo: logo || undefined,
        }),
      })
      if (res.ok) {
        alert("Team settings saved!")
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={logo || undefined} />
          <AvatarFallback className="text-2xl">{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <Label htmlFor="team-logo">Team Logo</Label>
          <Input id="team-logo" type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
          {uploading && <p className="text-xs text-muted-foreground">Uploading logo...</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="team-name">Team Name</Label>
        <Input id="team-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={50} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="team-description">Description</Label>
        <textarea
          id="team-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full p-2 border rounded-md"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="team-city">City</Label>
        <Input id="team-city" value={city} onChange={(e) => setCity(e.target.value)} required minLength={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="team-capacity">Team Capacity</Label>
        <Input
          id="team-capacity"
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(parseInt(e.target.value))}
          min={5}
          max={50}
          required
        />
      </div>
      <Button type="submit" disabled={saving || uploading}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  )
}

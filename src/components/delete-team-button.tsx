"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface DeleteTeamButtonProps {
  teamId: string
  teamName: string
}

export function DeleteTeamButton({ teamId, teamName }: DeleteTeamButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this team? This action cannot be undone and will permanently delete "${teamName}" and all associated data.`
    )

    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/delete`, {
        method: "DELETE",
      })

      if (response.ok) {
        window.location.href = "/dashboard"
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete team")
        setIsDeleting(false)
      }
    } catch (error) {
      console.error("Error deleting team:", error)
      alert("Failed to delete team")
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant="destructive"
      className="w-full"
      disabled={isDeleting}
      onClick={handleDelete}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {isDeleting ? "Deleting..." : "Delete Team"}
    </Button>
  )
}
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        members: true
      }
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if user is owner
    const member = team.members.find(m => m.userId === user.id)
    if (!member || member.role !== "OWNER") {
      return NextResponse.json({ error: "Only team owners can delete the team" }, { status: 403 })
    }

    // Delete team (cascade will handle related records)
    await prisma.team.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Team deleted successfully" })
  } catch (error) {
    console.error("Error deleting team:", error)
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 })
  }
}

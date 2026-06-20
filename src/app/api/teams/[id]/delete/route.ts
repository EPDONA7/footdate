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
        members: {
          include: {
            user: true
          }
        }
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

    // Notify all team members before deletion
    const notificationPromises = team.members
      .filter(m => m.userId !== user.id)
      .map(member =>
        prisma.notification.create({
          data: {
            userId: member.userId,
            type: "TEAM_ANNOUNCEMENT",
            title: "Team Deleted",
            message: `The team "${team.name}" has been deleted by the owner.`,
            link: "/dashboard"
          }
        })
      )
    
    await Promise.all(notificationPromises)

    // Delete team (cascade will handle related records)
    await prisma.team.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Team deleted successfully" })
  } catch (error) {
    console.error("Error deleting team:", error)
    if (error instanceof Error) {
      console.error("Error details:", error.message)
    }
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 })
  }
}

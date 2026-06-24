import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, memberId: string } }
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
      return NextResponse.json({ error: "Only team owners can kick players" }, { status: 403 })
    }

    // Find the member to kick
    const memberToKick = team.members.find(m => m.id === params.memberId)
    if (!memberToKick) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Prevent owner from kicking themselves
    if (memberToKick.userId === user.id) {
      return NextResponse.json({ error: "You cannot kick yourself from the team" }, { status: 400 })
    }

    // Kick the member (cascade will handle related records)
    await prisma.teamMember.delete({
      where: { id: params.memberId }
    })

    // Notify the kicked player
    await prisma.notification.create({
      data: {
        userId: memberToKick.userId,
        type: "TEAM_ANNOUNCEMENT",
        title: "Removed from Team",
        message: `You have been removed from ${team.name} by the team owner.`,
        link: "/dashboard"
      }
    })

    return NextResponse.json({ message: "Player removed from team successfully" })
  } catch (error) {
    console.error("Error kicking player:", error)
    if (error instanceof Error) {
      console.error("Error details:", error.message)
    }
    return NextResponse.json({ error: "Failed to kick player" }, { status: 500 })
  }
}

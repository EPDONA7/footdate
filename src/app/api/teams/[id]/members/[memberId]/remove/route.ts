import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
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
      return NextResponse.json({ error: "Only team owners can remove members" }, { status: 403 })
    }

    const targetMember = team.members.find(m => m.id === params.memberId)
    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Cannot remove owner
    if (targetMember.role === "OWNER") {
      return NextResponse.json({ error: "Cannot remove team owner" }, { status: 400 })
    }

    // Remove member
    await prisma.teamMember.delete({
      where: { id: params.memberId }
    })

    return NextResponse.json({ message: "Member removed successfully" })
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}

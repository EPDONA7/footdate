import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: params.id },
      include: {
        team: true
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    // Check if user is owner of the team
    const member = await prisma.teamMember.findFirst({
      where: {
        teamId: invitation.teamId,
        userId: user.id,
        role: "OWNER"
      }
    })

    if (!member) {
      return NextResponse.json({ error: "Only team owners can cancel invitations" }, { status: 403 })
    }

    // Update invitation status
    await prisma.teamInvitation.update({
      where: { id: params.id },
      data: { status: "CANCELLED" }
    })

    return NextResponse.json({ message: "Invitation cancelled" })
  } catch (error) {
    console.error("Error cancelling invitation:", error)
    return NextResponse.json({ error: "Failed to cancel invitation" }, { status: 500 })
  }
}

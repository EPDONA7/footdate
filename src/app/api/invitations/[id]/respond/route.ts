import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const respondSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE"])
})

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

    // Check if invitation is for this user
    if (invitation.userId !== user.id) {
      return NextResponse.json({ error: "This invitation is not for you" }, { status: 403 })
    }

    // Check if invitation is still pending
    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: "Invitation is no longer pending" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = respondSchema.parse(body)

    if (validatedData.action === "ACCEPT") {
      // Check if team is at capacity
      const teamMemberCount = await prisma.teamMember.count({
        where: { teamId: invitation.teamId }
      })

      if (teamMemberCount >= invitation.team.capacity) {
        return NextResponse.json({ error: "Team is at full capacity" }, { status: 400 })
      }

      // Check if user is already in a team
      const existingMembership = await prisma.teamMember.findFirst({
        where: { userId: user.id }
      })

      if (existingMembership) {
        return NextResponse.json({ error: "You are already a member of a team" }, { status: 400 })
      }

      // Add user to team
      await prisma.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId: user.id,
          role: "PLAYER"
        }
      })

      // Update invitation status
      await prisma.teamInvitation.update({
        where: { id: params.id },
        data: { status: "ACCEPTED" }
      })

      // Create notification for team owner
      const teamOwner = await prisma.teamMember.findFirst({
        where: {
          teamId: invitation.teamId,
          role: "OWNER"
        }
      })

      if (teamOwner) {
        await prisma.notification.create({
          data: {
            userId: teamOwner.userId,
            type: "INVITATION_ACCEPTED",
            title: "Invitation Accepted",
            message: `${user.name || user.username} accepted your invitation to join ${invitation.team.name}`,
            link: `/team/${invitation.teamId}`
          }
        })
      }

      return NextResponse.json({ message: "Invitation accepted" })
    } else {
      // Update invitation status to declined
      await prisma.teamInvitation.update({
        where: { id: params.id },
        data: { status: "DECLINED" }
      })

      // Create notification for team owner
      const teamOwner = await prisma.teamMember.findFirst({
        where: {
          teamId: invitation.teamId,
          role: "OWNER"
        }
      })

      if (teamOwner) {
        await prisma.notification.create({
          data: {
            userId: teamOwner.userId,
            type: "INVITATION_DECLINED",
            title: "Invitation Declined",
            message: `${user.name || user.username} declined your invitation to join ${invitation.team.name}`,
            link: `/team/${invitation.teamId}/manage`
          }
        })
      }

      return NextResponse.json({ message: "Invitation declined" })
    }
  } catch (error) {
    console.error("Error responding to invitation:", error)
    return NextResponse.json({ error: "Failed to respond to invitation" }, { status: 500 })
  }
}

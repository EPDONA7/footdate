import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const inviteByUserIdSchema = z.object({
  userId: z.string()
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

    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        members: true
      }
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if user is owner or manager
    const member = team.members.find(m => m.userId === user.id)
    if (!member || (member.role !== "OWNER" && member.role !== "MANAGER")) {
      return NextResponse.json({ error: "Only team owners and managers can send invitations" }, { status: 403 })
    }

    // Check if team is at capacity
    if (team.members.length >= team.capacity) {
      return NextResponse.json({ error: "Team is at full capacity" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = inviteByUserIdSchema.parse(body)

    // Verify the user exists
    const invitedUser = await prisma.user.findUnique({
      where: { id: validatedData.userId }
    })

    if (!invitedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = team.members.find(m => m.userId === invitedUser.id)
    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this team" }, { status: 400 })
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        teamId: params.id,
        userId: invitedUser.id,
        status: "PENDING"
      }
    })

    if (existingInvitation) {
      return NextResponse.json({ error: "User already has a pending invitation" }, { status: 400 })
    }

    // Create invitation
    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId: params.id,
        userId: invitedUser.id,
        invitedBy: user.id,
        status: "PENDING"
      },
      include: {
        team: true,
        user: true,
        invitingUser: true
      }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: invitedUser.id,
        type: "TEAM_INVITATION",
        title: "Team Invitation",
        message: `You have been invited to join ${team.name}`,
        link: `/invitations`
      }
    })

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }
    console.error("Error creating invitation:", error)
    if (error instanceof Error) {
      console.error("Error details:", error.message)
    }
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 })
  }
}
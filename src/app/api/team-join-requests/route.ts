import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createJoinRequestSchema = z.object({
  teamId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createJoinRequestSchema.parse(body)

    // Check if user is already a member of this team
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: validatedData.teamId,
        userId: user.id
      }
    })

    if (existingMembership) {
      return NextResponse.json({ error: "You are already a member of this team" }, { status: 400 })
    }

    // Check if user already has a pending request to this team
    const existingRequest = await prisma.joinRequest.findFirst({
      where: {
        teamId: validatedData.teamId,
        status: "PENDING",
        playerProfile: {
          userId: user.id
        }
      }
    })

    if (existingRequest) {
      return NextResponse.json({ error: "You already have a pending request to this team" }, { status: 400 })
    }

    // Get or create player profile
    let profile = await prisma.playerProfile.findUnique({
      where: { userId: user.id },
      include: { user: true }
    })

    if (!profile) {
      profile = await prisma.playerProfile.create({
        data: {
          userId: user.id,
          status: "AVAILABLE"
        },
        include: { user: true }
      })
    }

    // Create join request
    const joinRequest = await prisma.joinRequest.create({
      data: {
        playerProfileId: profile.id,
        teamId: validatedData.teamId
      },
      include: {
        team: {
          include: {
            members: {
              where: { role: "OWNER" },
              include: { user: true }
            }
          }
        },
        playerProfile: {
          include: { user: true }
        }
      }
    })

    // Notify team owners
    const notifications = joinRequest.team.members
      .filter(m => m.role === "OWNER")
      .map(member =>
        prisma.notification.create({
          data: {
            userId: member.userId,
            type: "TEAM_INVITATION",
            title: "New Join Request",
            message: `${profile.user.name || profile.user.username} wants to join your team`,
            link: `/team/${joinRequest.teamId}/manage`
          }
        })
      )

    await Promise.all(notifications)

    return NextResponse.json({ joinRequest }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }
    console.error("Error creating join request:", error)
    return NextResponse.json({ error: "Failed to create join request" }, { status: 500 })
  }
}
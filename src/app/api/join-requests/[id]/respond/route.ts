import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const respondSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"])
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

    const body = await request.json()
    const validatedData = respondSchema.parse(body)

    // Get the join request
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: params.id },
      include: {
        team: {
          include: {
            members: true
          }
        },
        playerProfile: {
          include: {
            user: true
          }
        }
      }
    })

    if (!joinRequest) {
      return NextResponse.json({ error: "Join request not found" }, { status: 404 })
    }

    // Check if user is owner of the team
    const isOwner = joinRequest.team.members.some(
      m => m.userId === user.id && m.role === "OWNER"
    )

    if (!isOwner) {
      return NextResponse.json({ error: "Only team owners can respond to requests" }, { status: 403 })
    }

    // Update join request
    const updatedRequest = await prisma.joinRequest.update({
      where: { id: params.id },
      data: {
        status: validatedData.status,
        respondedAt: new Date()
      },
      include: {
        playerProfile: {
          include: { user: true }
        }
      }
    })

    // Notify the player
    await prisma.notification.create({
      data: {
        userId: joinRequest.playerProfile.userId,
        type: validatedData.status === "ACCEPTED" ? "INVITATION_ACCEPTED" : "INVITATION_DECLINED",
        title: validatedData.status === "ACCEPTED" ? "Join Request Accepted" : "Join Request Declined",
        message: `Your request to join ${joinRequest.team.name} was ${validatedData.status.toLowerCase()}`,
        link: `/team/${joinRequest.teamId}`
      }
    })

    // If accepted, add player to team
    if (validatedData.status === "ACCEPTED") {
      await prisma.teamMember.create({
        data: {
          teamId: joinRequest.teamId,
          userId: joinRequest.playerProfile.userId,
          role: "PLAYER"
        }
      })

      // Update player profile status
      await prisma.playerProfile.update({
        where: { id: joinRequest.playerProfileId },
        data: {
          lookingForTeam: false,
          status: "COMMITTED"
        }
      })
    }

    return NextResponse.json({ joinRequest: updatedRequest })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }
    console.error("Error responding to join request:", error)
    return NextResponse.json({ error: "Failed to respond to request" }, { status: 500 })
  }
}
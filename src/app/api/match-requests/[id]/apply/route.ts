import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const applySchema = z.object({
  message: z.string().max(500).optional(),
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

    let body: unknown = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }
    const { message } = applySchema.parse(body)

    // Get user's team
    const userTeam = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      include: { team: true }
    })

    if (!userTeam) {
      return NextResponse.json({ error: "You need to be part of a team to apply" }, { status: 404 })
    }

    // Get the match request
    const matchRequest = await prisma.matchRequest.findUnique({
      where: { id: params.id },
      include: {
        requestingTeam: true,
      }
    })

    if (!matchRequest) {
      return NextResponse.json({ error: "Match request not found" }, { status: 404 })
    }

    // Only open random requests can be applied to
    if (matchRequest.targetTeamId) {
      return NextResponse.json({ error: "This is a specific invitation, not an open request" }, { status: 400 })
    }

    if (matchRequest.status !== "OPEN") {
      return NextResponse.json({ error: "This match request is no longer accepting applications" }, { status: 400 })
    }

    // Check if user's team is the requesting team
    if (matchRequest.requestingTeamId === userTeam.teamId) {
      return NextResponse.json({ error: "You cannot apply to your own request" }, { status: 400 })
    }

    // Prevent duplicate applications
    const existing = await prisma.matchApplication.findUnique({
      where: {
        matchRequestId_applyingTeamId: {
          matchRequestId: matchRequest.id,
          applyingTeamId: userTeam.teamId,
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: "Your team has already applied to this match request" }, { status: 400 })
    }

    const application = await prisma.matchApplication.create({
      data: {
        matchRequestId: matchRequest.id,
        applyingTeamId: userTeam.teamId,
        appliedById: user.id,
        message: message || null,
      },
      include: {
        applyingTeam: true,
      }
    })

    // Notify the match request creator
    await prisma.notification.create({
      data: {
        userId: matchRequest.createdById,
        type: "MATCH_APPLICATION",
        title: "New Match Application",
        message: `${userTeam.team.name} applied to your match request in ${matchRequest.city}`,
        link: `/match-finder/applications`,
      }
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }
    console.error("Error applying to match request:", error)
    return NextResponse.json({ error: "Failed to apply to match request" }, { status: 500 })
  }
}

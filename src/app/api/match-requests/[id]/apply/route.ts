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

    // Get user's team
    const userTeam = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      include: { team: true }
    })

    if (!userTeam) {
      return NextResponse.json({ error: "No team found" }, { status: 404 })
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

    // Check if it's a random request
    if (matchRequest.targetTeamId) {
      return NextResponse.json({ error: "This is a specific invitation, not a random request" }, { status: 400 })
    }

    // Check if user's team is the requesting team
    if (matchRequest.requestingTeamId === userTeam.teamId) {
      return NextResponse.json({ error: "You cannot apply to your own request" }, { status: 400 })
    }

    // Update the match request to PENDING with the applying team
    const updatedRequest = await prisma.matchRequest.update({
      where: { id: params.id },
      data: {
        targetTeamId: userTeam.teamId,
        status: "PENDING",
      },
      include: {
        requestingTeam: true,
        targetTeam: true,
      }
    })

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error("Error applying to match request:", error)
    return NextResponse.json({ error: "Failed to apply to match request" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const team = await prisma.team.findUnique({
      where: { id: params.id }
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if user is a team member
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: params.id,
        userId: user.id
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: "You must be a team member to access team chat" }, { status: 403 })
    }

    // Get or create team conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        teamId: params.id,
        type: "team"
      }
    })

    if (!conversation) {
      // Create team conversation
      conversation = await prisma.conversation.create({
        data: {
          user1Id: teamMember.userId, // Use first member as user1
          user2Id: teamMember.userId, // Use same user for user2 since it's a team chat
          type: "team",
          teamId: params.id
        }
      })
    }

    return NextResponse.json({ conversationId: conversation.id })
  } catch (error) {
    console.error("Error fetching team conversation:", error)
    return NextResponse.json({ error: "Failed to fetch team conversation" }, { status: 500 })
  }
}

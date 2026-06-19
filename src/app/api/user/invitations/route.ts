import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invitations = await prisma.teamInvitation.findMany({
      where: {
        userId: user.id
      },
      include: {
        team: true,
        invitingUser: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(invitations)
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
  }
}

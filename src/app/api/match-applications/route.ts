import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Teams the user belongs to (so a creator who left can still be matched by creator id)
    const memberships = await prisma.teamMember.findMany({
      where: { userId: user.id },
      select: { teamId: true }
    })
    const teamIds = memberships.map((m) => m.teamId)

    // Incoming applications: on match requests this user created or that belong to their team
    const applications = await prisma.matchApplication.findMany({
      where: {
        matchRequest: {
          OR: [
            { createdById: user.id },
            { requestingTeamId: { in: teamIds } },
          ],
        },
      },
      include: {
        applyingTeam: {
          include: {
            members: {
              where: { role: "OWNER" },
              include: { user: true },
            },
          },
        },
        appliedBy: {
          select: { id: true, name: true, username: true, email: true, profilePhoto: true },
        },
        matchRequest: {
          include: { requestingTeam: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error("Error fetching match applications:", error)
    return NextResponse.json({ error: "Failed to fetch match applications" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teamMemberships = await prisma.teamMember.findMany({
      where: {
        userId: user.id,
        role: {
          in: ["OWNER", "MANAGER", "CAPTAIN"]
        }
      },
      include: {
        team: true
      }
    })

    const teams = teamMemberships.map((tm: any) => ({
      id: tm.team.id,
      name: tm.team.name,
      city: tm.team.city,
      description: tm.team.description,
      logo: tm.team.logo,
      role: tm.role
    }))

    return NextResponse.json(teams)
  } catch (error) {
    console.error("Error fetching user teams:", error)
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
  }
}

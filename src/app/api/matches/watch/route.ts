import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city")

    const where: any = {
      status: "SCHEDULED",
      openForSpectators: true,
      date: { gte: new Date() },
    }
    if (city) {
      where.city = city
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        spectators: {
          select: { id: true, userId: true, status: true },
        },
      },
      orderBy: { date: "asc" },
    })

    const result = matches.map((match) => {
      const mine = match.spectators.find((s) => s.userId === user.id)
      return {
        id: match.id,
        date: match.date,
        time: match.time,
        city: match.city,
        venue: match.venue,
        futsalLocation: match.futsalLocation,
        matchType: match.matchType,
        skillLevel: match.skillLevel,
        image: match.image,
        homeTeam: { id: match.homeTeam.id, name: match.homeTeam.name, logo: match.homeTeam.logo },
        awayTeam: { id: match.awayTeam.id, name: match.awayTeam.name, logo: match.awayTeam.logo },
        spectatorCount: match.spectators.length,
        interestedCount: match.spectators.filter((s) => s.status === "INTERESTED").length,
        goingCount: match.spectators.filter((s) => s.status === "GOING").length,
        myStatus: mine ? mine.status : null,
      }
    })

    return NextResponse.json({ matches: result })
  } catch (error) {
    console.error("Error fetching watch games:", error)
    return NextResponse.json({ error: "Failed to fetch watch games" }, { status: 500 })
  }
}

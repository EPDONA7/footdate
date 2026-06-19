import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createMatchSchema = z.object({
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  date: z.string(),
  time: z.string(),
  city: z.string(),
  venue: z.string().optional(),
  futsalLocation: z.string().optional(),
  matchType: z.enum(["FOOTBALL", "FUTSAL"]).optional(),
  skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"]).optional(),
  notes: z.string().optional(),
  openForSpectators: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Received match creation data:", body)

    const validatedData = createMatchSchema.parse(body)
    console.log("Validated data:", validatedData)

    // Check if user is a member of the home team
    const homeTeamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: validatedData.homeTeamId,
        userId: user.id
      }
    })

    if (!homeTeamMember) {
      return NextResponse.json({ error: "You are not a member of the home team" }, { status: 403 })
    }

    // Verify away team exists
    const awayTeam = await prisma.team.findUnique({
      where: { id: validatedData.awayTeamId }
    })

    if (!awayTeam) {
      return NextResponse.json({ error: "Away team not found" }, { status: 404 })
    }

    console.log("Away team found:", awayTeam)

    // Create match
    const match = await prisma.match.create({
      data: {
        homeTeamId: validatedData.homeTeamId,
        awayTeamId: validatedData.awayTeamId,
        date: new Date(validatedData.date),
        time: validatedData.time,
        city: validatedData.city,
        venue: validatedData.venue,
        futsalLocation: validatedData.futsalLocation,
        matchType: validatedData.matchType ?? "FUTSAL",
        skillLevel: validatedData.skillLevel,
        notes: validatedData.notes,
        status: "SCHEDULED",
        openForSpectators: validatedData.openForSpectators ?? true,
        createdById: user.id
      },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    })

    return NextResponse.json(match, { status: 201 })
  } catch (error) {
    console.error("Error creating match:", error)
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city")
    const matchType = searchParams.get("matchType")
    const skillLevel = searchParams.get("skillLevel")
    const status = searchParams.get("status") || "SCHEDULED"
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = parseInt(searchParams.get("skip") || "0")

    interface MatchWhereInput {
      status: string
      city?: string
      matchType?: string
      skillLevel?: string
      homeTeam?: { city: string }
    }

    const where: MatchWhereInput = {
      status
    }

    if (city) {
      where.homeTeam = { city }
    }

    if (matchType) {
      where.matchType = matchType
    }

    if (skillLevel) {
      where.skillLevel = skillLevel
    }

    const matches = await prisma.match.findMany({
      where: where as any,
      take: limit,
      skip,
      include: {
        homeTeam: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        },
        awayTeam: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: {
        date: "asc"
      }
    })

    const total = await prisma.match.count({ where: where as any })

    return NextResponse.json({
      matches,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total
      }
    })
  } catch (error) {
    console.error("Error fetching matches:", error)
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 })
  }
}

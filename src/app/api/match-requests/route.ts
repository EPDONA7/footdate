import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createMatchRequestSchema = z.object({
  requestType: z.enum(["random", "specific"]),
  requestingTeamId: z.string(),
  targetTeamId: z.string().optional(),
  date: z.string(),
  time: z.string(),
  city: z.string(),
  venue: z.string().optional(),
  futsalLocation: z.string().min(1, "Futsal location is required"),
  image: z.string().optional(),
  skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"]).optional(),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Received match request data:", body)

    const validatedData = createMatchRequestSchema.parse(body)
    console.log("Validated data:", validatedData)

    // Check if user is a member of the requesting team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: validatedData.requestingTeamId,
        userId: user.id
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: "You are not a member of this team" }, { status: 403 })
    }

    // For specific requests, verify target team exists
    if (validatedData.requestType === "specific" && validatedData.targetTeamId) {
      const targetTeam = await prisma.team.findUnique({
        where: { id: validatedData.targetTeamId }
      })

      if (!targetTeam) {
        return NextResponse.json({ error: "Target team not found" }, { status: 404 })
      }
    }

    // Create match request
    const matchRequest = await prisma.matchRequest.create({
      data: {
        requestingTeamId: validatedData.requestingTeamId,
        targetTeamId: validatedData.requestType === "specific" ? validatedData.targetTeamId : null,
        createdById: user.id,
        description: validatedData.description,
        date: new Date(validatedData.date),
        time: validatedData.time,
        city: validatedData.city,
        venue: validatedData.venue,
        futsalLocation: validatedData.futsalLocation,
        image: validatedData.image,
        matchType: "FUTSAL",
        skillLevel: validatedData.skillLevel,
        status: "OPEN",
      },
      include: {
        requestingTeam: true,
        targetTeam: true,
        createdBy: true,
      }
    })

    // Notify the target team if it's a specific request
    if (matchRequest.targetTeamId) {
      // This is a placeholder for actual notification logic.
      // In a real application, you would create a notification entry in the database
      // and potentially trigger a real-time notification (e.g., via websockets).
      console.log(
        `Notification: Team ${matchRequest.requestingTeam.name} sent a match request to ${matchRequest.targetTeam?.name}`
      );
    }

    return NextResponse.json(matchRequest, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid request data" }, { status: 400 })
    }
    console.error("Error creating match request:", error)
    return NextResponse.json({ error: "Failed to create match request" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "OPEN"
    const type = searchParams.get("type") // "random" or "specific"
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = parseInt(searchParams.get("skip") || "0")

    // Get user's team
    const userTeam = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      include: { team: true }
    })

    if (!userTeam) {
      return NextResponse.json({ error: "No team found" }, { status: 404 })
    }

    const where: any = {
      status,
      requestingTeamId: { not: userTeam.teamId }, // Don't show own requests
    }

    // Filter by type
    if (type === "random") {
      where.targetTeamId = null
    } else if (type === "specific") {
      where.targetTeamId = { not: null }
    }

    const matchRequests = await prisma.matchRequest.findMany({
      where,
      take: limit,
      skip,
      include: {
        requestingTeam: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        },
        targetTeam: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        },
        createdBy: true,
        applications: {
          where: { applyingTeamId: userTeam.teamId },
          select: { id: true, status: true },
        },
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    const matchRequestsWithFlags = matchRequests.map((mr) => ({
      ...mr,
      hasApplied: mr.applications.length > 0,
      myApplicationStatus: mr.applications[0]?.status ?? null,
    }))

    const total = await prisma.matchRequest.count({ where })

    return NextResponse.json({
      matchRequests: matchRequestsWithFlags,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total
      }
    })
  } catch (error) {
    console.error("Error fetching match requests:", error)
    return NextResponse.json({ error: "Failed to fetch match requests" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { uploadImage } from "@/lib/cloudinary"
import { z } from "zod"

const createTeamSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().optional(),
  city: z.string().min(2),
  capacity: z.number().min(5).max(50).default(20),
  logo: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Received team creation data:", body)

    const validatedData = createTeamSchema.parse(body)
    console.log("Validated data:", validatedData)

    // Check if user already has a team
    const existingMembership = await prisma.teamMember.findFirst({
      where: { userId: user.id }
    })

    if (existingMembership) {
      return NextResponse.json({ error: "You are already a member of a team" }, { status: 400 })
    }

    // Handle logo upload if provided
    let logoUrl = validatedData.logo
    if (body.logoFile) {
      const uploadedLogo = await uploadImage(body.logoFile, "team-logos")
      logoUrl = uploadedLogo.secure_url
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        city: validatedData.city,
        capacity: validatedData.capacity,
        logo: logoUrl,
        members: {
          create: {
            userId: user.id,
            role: "OWNER"
          }
        }
      },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error("Error creating team:", error)
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city")
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = parseInt(searchParams.get("skip") || "0")

    const where: any = {}

    if (city) {
      where.city = city
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    }

    const teams = await prisma.team.findMany({
      where,
      take: limit,
      skip,
      include: {
        members: {
          include: {
            user: true
          }
        },
        _count: {
          select: { members: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    const total = await prisma.team.count({ where })

    return NextResponse.json({
      teams,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total
      }
    })
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
  }
}

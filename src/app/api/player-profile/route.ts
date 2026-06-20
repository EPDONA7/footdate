import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  rank: z.string().max(50).optional(),
  availability: z.array(z.string()).optional(),
  preferredPosition: z.enum(["GOALKEEPER", "DEFENDER", "MIDFIELDER", "FORWARD"]).optional(),
  skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"]).optional(),
  lookingForTeam: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.playerProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePhoto: true,
            skillLevel: true,
            primaryPosition: true,
            city: true
          }
        }
      }
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Error fetching player profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    const profile = await prisma.playerProfile.upsert({
      where: { userId: user.id },
      update: validatedData,
      create: {
        userId: user.id,
        ...validatedData
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePhoto: true
          }
        }
      }
    })

    return NextResponse.json({ profile })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }
    console.error("Error updating player profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
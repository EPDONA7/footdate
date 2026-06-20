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
    const skillLevel = searchParams.get("skillLevel")
    const position = searchParams.get("position")
    const city = searchParams.get("city")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = parseInt(searchParams.get("skip") || "0")

    const where: any = {
      lookingForTeam: true,
      user: {
        id: { not: user.id } // Exclude current user
      }
    }

    if (skillLevel) {
      where.skillLevel = skillLevel
    }

    if (position) {
      where.preferredPosition = position
    }

    if (city) {
      where.user = {
        ...where.user,
        city: city
      }
    }

    const profiles = await prisma.playerProfile.findMany({
      where,
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
      },
      take: limit,
      skip
    })

    const total = await prisma.playerProfile.count({ where })

    return NextResponse.json({
      profiles,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total
      }
    })
  } catch (error) {
    console.error("Error browsing players:", error)
    return NextResponse.json({ error: "Failed to browse players" }, { status: 500 })
  }
}
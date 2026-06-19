import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city")
    const position = searchParams.get("position")
    const skillLevel = searchParams.get("skillLevel")
    const search = searchParams.get("search")

    const where: any = {}

    if (city) {
      where.city = city
    }

    if (position) {
      where.OR = [
        { primaryPosition: position },
        { secondaryPosition: position }
      ]
    }

    if (skillLevel) {
      where.skillLevel = skillLevel
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } }
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        city: true,
        age: true,
        primaryPosition: true,
        secondaryPosition: true,
        skillLevel: true,
        matchesPlayed: true,
        wins: true,
        goals: true,
        assists: true,
        playerRating: true,
        availableDays: true,
        preferredTimes: true,
        profilePhoto: true,
      },
      take: 50,
      orderBy: { playerRating: "desc" }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

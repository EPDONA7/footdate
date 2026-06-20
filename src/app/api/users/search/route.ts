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
    const username = searchParams.get("username")

    if (!username) {
      return NextResponse.json({ error: "Username parameter is required" }, { status: 400 })
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: username,
          mode: "insensitive"
        },
        id: {
          not: user.id // Exclude current user
        }
      },
      select: {
        id: true,
        username: true,
        name: true,
        profilePhoto: true
      },
      take: 10
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error searching users:", error)
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 })
  }
}
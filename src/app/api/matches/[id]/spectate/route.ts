import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const spectateSchema = z.object({
  status: z.enum(["INTERESTED", "GOING"]),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status } = spectateSchema.parse(body)

    const match = await prisma.match.findUnique({ where: { id: params.id } })
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }
    if (!match.openForSpectators) {
      return NextResponse.json({ error: "This match is not open for spectators" }, { status: 400 })
    }

    const spectator = await prisma.matchSpectator.upsert({
      where: {
        matchId_userId: { matchId: params.id, userId: user.id },
      },
      update: { status },
      create: { matchId: params.id, userId: user.id, status },
    })

    return NextResponse.json(spectator)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }
    console.error("Error marking spectator:", error)
    return NextResponse.json({ error: "Failed to update spectator status" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.matchSpectator.deleteMany({
      where: { matchId: params.id, userId: user.id },
    })

    return NextResponse.json({ message: "Removed from spectators" })
  } catch (error) {
    console.error("Error removing spectator:", error)
    return NextResponse.json({ error: "Failed to remove spectator" }, { status: 500 })
  }
}

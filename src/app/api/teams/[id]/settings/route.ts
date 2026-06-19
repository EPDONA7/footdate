import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const settingsSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().optional(),
  city: z.string().min(2),
  capacity: z.number().min(5).max(50),
  logo: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        members: true
      }
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if user is owner
    const member = team.members.find(m => m.userId === user.id)
    if (!member || member.role !== "OWNER") {
      return NextResponse.json({ error: "Only team owners can update settings" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = settingsSchema.parse(body)

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        city: validatedData.city,
        capacity: validatedData.capacity,
        ...(validatedData.logo ? { logo: validatedData.logo } : {}),
      }
    })

    return NextResponse.json(updatedTeam)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid data" }, { status: 400 })
    }
    console.error("Error updating team:", error)
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 })
  }
}

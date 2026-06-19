import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateRoleSchema = z.object({
  role: z.enum(["PLAYER", "CAPTAIN"])
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
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
      return NextResponse.json({ error: "Only team owners can update roles" }, { status: 403 })
    }

    const targetMember = team.members.find(m => m.id === params.memberId)
    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Cannot change owner role
    if (targetMember.role === "OWNER") {
      return NextResponse.json({ error: "Cannot change owner role" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateRoleSchema.parse(body)

    // Update member role
    await prisma.teamMember.update({
      where: { id: params.memberId },
      data: { role: validatedData.role }
    })

    return NextResponse.json({ message: "Role updated successfully" })
  } catch (error) {
    console.error("Error updating member role:", error)
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }
}

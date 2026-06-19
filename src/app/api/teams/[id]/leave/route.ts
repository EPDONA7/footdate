import { NextRequest, NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"

export async function POST(
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

    // Check if user is a member
    const member = team.members.find(m => m.userId === user.id)
    if (!member) {
      return NextResponse.json({ error: "You are not a member of this team" }, { status: 400 })
    }

    // Check if user is the owner
    if (member.role === "OWNER") {
      return NextResponse.json({ error: "Team owners cannot leave. Transfer ownership or delete the team first." }, { status: 400 })
    }

    // Remove user from team
    await prisma.teamMember.delete({
      where: {
        id: member.id
      }
    })

    return NextResponse.json({ message: "Successfully left team" })
  } catch (error) {
    console.error("Error leaving team:", error)
    return NextResponse.json({ error: "Failed to leave team" }, { status: 500 })
  }
}

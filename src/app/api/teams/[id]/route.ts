import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { uploadImage } from "@/lib/cloudinary"
import { z } from "zod"

const updateTeamSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().optional(),
  city: z.string().min(2).optional(),
  capacity: z.number().min(5).max(50).optional(),
  logo: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error("Error fetching team:", error)
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 })
  }
}

export async function PATCH(
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

    // Check if user is owner or manager
    const member = team.members.find(m => m.userId === user.id)
    if (!member || (member.role !== "OWNER" && member.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateTeamSchema.parse(body)

    // Handle logo upload if provided
    let logoUrl = validatedData.logo
    if (body.logoFile) {
      const uploadedLogo = await uploadImage(body.logoFile, "team-logos")
      logoUrl = uploadedLogo.secure_url
    }

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id: params.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.city && { city: validatedData.city }),
        ...(validatedData.capacity && { capacity: validatedData.capacity }),
        ...(logoUrl && { logo: logoUrl })
      },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json(updatedTeam)
  } catch (error) {
    console.error("Error updating team:", error)
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 })
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
      return NextResponse.json({ error: "Only team owners can delete teams" }, { status: 403 })
    }

    // Delete team (cascade will handle members, invitations, etc.)
    await prisma.team.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Team deleted successfully" })
  } catch (error) {
    console.error("Error deleting team:", error)
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { uploadImage } from "@/lib/cloudinary"
import { z } from "zod"

const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
  age: z.number().min(16).max(100).optional().or(z.literal(0)),
  city: z.string().optional().or(z.literal("")),
  profilePhoto: z.string().optional().or(z.literal("")),
  primaryPosition: z.enum(["GOALKEEPER", "DEFENDER", "MIDFIELDER", "FORWARD"]).optional().or(z.literal("")),
  secondaryPosition: z.enum(["GOALKEEPER", "DEFENDER", "MIDFIELDER", "FORWARD"]).optional().or(z.literal("")),
  skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"]).optional().or(z.literal("")),
  availableDays: z.array(z.string()).optional(),
  preferredTimes: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        teamMemberships: {
          include: {
            team: true
          }
        }
      }
    })

    return NextResponse.json(fullUser)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Received update data:", body)

    const validatedData = updateUserSchema.parse(body)
    console.log("Validated data:", validatedData)

    // Convert empty strings to undefined for optional fields
    const updateData: any = {}
    if (validatedData.name && validatedData.name !== "") updateData.name = validatedData.name
    if (validatedData.bio !== undefined && validatedData.bio !== "") updateData.bio = validatedData.bio
    if (validatedData.age && validatedData.age !== 0) updateData.age = validatedData.age
    if (validatedData.city && validatedData.city !== "") updateData.city = validatedData.city
    if (validatedData.profilePhoto && validatedData.profilePhoto !== "") updateData.profilePhoto = validatedData.profilePhoto
    if (validatedData.primaryPosition) updateData.primaryPosition = validatedData.primaryPosition
    if (validatedData.secondaryPosition) updateData.secondaryPosition = validatedData.secondaryPosition
    if (validatedData.skillLevel) updateData.skillLevel = validatedData.skillLevel
    if (validatedData.availableDays) updateData.availableDays = validatedData.availableDays
    if (validatedData.preferredTimes) updateData.preferredTimes = validatedData.preferredTimes

    console.log("Update data:", updateData)

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: {
        teamMemberships: {
          include: {
            team: true
          }
        }
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete user's team memberships
    await prisma.teamMember.deleteMany({
      where: { userId: user.id }
    })

    // Delete user's team invitations (both received and sent)
    await prisma.teamInvitation.deleteMany({
      where: { userId: user.id }
    })

    await prisma.teamInvitation.deleteMany({
      where: { invitedBy: user.id }
    })

    // Delete user's notifications
    await prisma.notification.deleteMany({
      where: { userId: user.id }
    })

    // Delete user's match participants
    await prisma.matchParticipant.deleteMany({
      where: { userId: user.id }
    })

    // Delete user's posts
    await prisma.post.deleteMany({
      where: { userId: user.id }
    })

    // Delete user's comments
    await prisma.comment.deleteMany({
      where: { userId: user.id }
    })

    // Delete user's likes
    await prisma.like.deleteMany({
      where: { userId: user.id }
    })

    // Delete user's messages (both sent and received)
    await prisma.message.deleteMany({
      where: { senderId: user.id }
    })

    await prisma.message.deleteMany({
      where: { receiverId: user.id }
    })

    // Delete user's conversations
    await prisma.conversation.deleteMany({
      where: { user1Id: user.id }
    })

    await prisma.conversation.deleteMany({
      where: { user2Id: user.id }
    })

    // Delete user's follows
    await prisma.follow.deleteMany({
      where: { followerId: user.id }
    })

    await prisma.follow.deleteMany({
      where: { followingId: user.id }
    })

    // Delete user's match disputes
    await prisma.matchDispute.deleteMany({
      where: { reportedById: user.id }
    })

    // Delete user
    await prisma.user.delete({
      where: { id: user.id }
    })

    return NextResponse.json({ message: "Account deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}

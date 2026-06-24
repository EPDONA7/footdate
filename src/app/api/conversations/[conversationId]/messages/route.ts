import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000)
})

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.conversationId }
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    if (conversation.type !== "team") {
      return NextResponse.json({ error: "This is not a team conversation" }, { status: 400 })
    }

    if (!conversation.teamId) {
      return NextResponse.json({ error: "Team conversation must have a team ID" }, { status: 400 })
    }

    // Check if user is a team member
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: conversation.teamId,
        userId: user.id
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: "You must be a team member to access team chat" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = parseInt(searchParams.get("skip") || "0")

    const messages = await prisma.message.findMany({
      where: { conversationId: params.conversationId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePhoto: true
          }
        }
      }
    })

    return NextResponse.json({ messages: messages.reverse() })
  } catch (error) {
    console.error("Error fetching team messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.conversationId }
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    if (conversation.type !== "team") {
      return NextResponse.json({ error: "This is not a team conversation" }, { status: 400 })
    }

    if (!conversation.teamId) {
      return NextResponse.json({ error: "Team conversation must have a team ID" }, { status: 400 })
    }

    // Check if user is a team member
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: conversation.teamId,
        userId: user.id
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: "You must be a team member to send messages" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = sendMessageSchema.parse(body)

    const message = await prisma.message.create({
      data: {
        conversationId: params.conversationId,
        senderId: user.id,
        content: validatedData.content
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePhoto: true
          }
        }
      }
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: params.conversationId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }
    console.error("Error sending team message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const sendMessageSchema = z.object({
  content: z.string().min(1).max(500)
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = parseInt(searchParams.get("skip") || "0")

    const messages = await prisma.globalMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ messages: messages.reverse() })
  } catch (error) {
    console.error("Error fetching global messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = sendMessageSchema.parse(body)

    // Basic moderation - filter common bad words
    const badWords = ['spam', 'scam', 'fake', 'bot', 'hack']
    const containsBadWord = badWords.some(word =>
      validatedData.content.toLowerCase().includes(word)
    )

    if (containsBadWord) {
      return NextResponse.json({ error: "Message contains inappropriate content" }, { status: 400 })
    }

    const message = await prisma.globalMessage.create({
      data: {
        userId: user.id,
        content: validatedData.content
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }
    console.error("Error sending global message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
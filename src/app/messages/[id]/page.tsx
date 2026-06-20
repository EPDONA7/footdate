"use client"

import { useState, useEffect, useRef } from "react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  content: string
  senderId: string
  read: boolean
  createdAt: string
  sender: {
    id: string
    username: string
    name: string | null
    profilePhoto: string | null
  }
}

interface Conversation {
  id: string
  user1Id: string
  user2Id: string
  user1: {
    id: string
    username: string
    name: string | null
    profilePhoto: string | null
  }
  user2: {
    id: string
    username: string
    name: string | null
    profilePhoto: string | null
  }
}

export default function ConversationPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchConversation()
    fetchMessages()
  }, [params.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchConversation = async () => {
    try {
      const res = await fetch("/api/conversations")
      if (res.ok) {
        const data = await res.json()
        const conv = data.conversations.find((c: Conversation) => c.id === params.id)
        if (conv) {
          setConversation(conv)
        } else {
          redirect("/messages")
        }
      }
    } catch (error) {
      console.error("Error fetching conversation:", error)
    }
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/conversations/${params.id}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${params.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage("")
        scrollToBottom()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center py-12">Loading conversation...</div>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center py-12">Conversation not found</div>
        </div>
      </div>
    )
  }

  const otherUser = conversation.user1Id === currentUserId ? conversation.user2 : conversation.user1

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/messages">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Messages
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={otherUser.profilePhoto || undefined} />
              <AvatarFallback>
                {otherUser.name?.charAt(0) || otherUser.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{otherUser.name || otherUser.username}</h1>
              <p className="text-sm text-muted-foreground">@{otherUser.username}</p>
            </div>
          </div>
        </div>

        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardContent className="flex-1 flex flex-col p-4">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === currentUserId ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] ${message.senderId === currentUserId ? "order-2" : ""}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          message.senderId === currentUserId
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
              />
              <Button type="submit" disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send } from "lucide-react"

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  sender: {
    id: string
    username: string
    name: string | null
    profilePhoto: string | null
  }
}

interface TeamChatProps {
  teamId: string
  teamName: string
}

export function TeamChatTab({ teamId, teamName }: TeamChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversation()
    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      if (conversationId) {
        fetchMessages()
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchConversation = async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}/conversation`)
      if (res.ok) {
        const data = await res.json()
        setConversationId(data.conversationId)
        await fetchMessages(data.conversationId)
      } else {
        const error = await res.json()
        setError(error.error || "Failed to load conversation")
      }
    } catch (error) {
      console.error("Error fetching conversation:", error)
      setError("Failed to load conversation")
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (convId?: string) => {
    try {
      const cid = convId || conversationId
      if (!cid) return

      const res = await fetch(`/api/conversations/${cid}/messages?limit=50`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !conversationId) return

    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-[500px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-md">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={message.sender.profilePhoto || undefined} />
                    <AvatarFallback>
                      {message.sender.name?.charAt(0) || message.sender.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{message.sender.name || message.sender.username}</span>
                      <span className="text-xs text-muted-foreground">@{message.sender.username}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm bg-muted p-2 rounded-lg">
                      {message.content}
                    </div>
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
        </div>
      </CardContent>
    </Card>
  )
}

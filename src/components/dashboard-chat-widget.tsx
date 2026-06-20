"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, X, Send } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  content: string
  createdAt: string
}

interface User {
  id: string
  username: string
  name: string | null
  profilePhoto: string | null
}

interface Conversation {
  id: string
  user1Id: string
  user2Id: string
  user1: User
  user2: User
  messages: Message[]
  updatedAt: string
}

export function DashboardChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (isOpen) {
      fetchConversations()
    }
  }, [isOpen])

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations")
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations.slice(0, 5) || [])
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    }
  }

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-h-[500px] bg-background rounded-lg shadow-xl border z-50">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Messages</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[350px] overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                    <Link href="/messages">
                      <Button variant="outline" size="sm" className="mt-3">
                        Start chatting
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations.map((conversation) => {
                      const otherUser = conversation.user1.id === conversation.user1Id ? conversation.user2 : conversation.user1
                      const lastMessage = conversation.messages[0]

                      return (
                        <Link
                          key={conversation.id}
                          href={`/messages/${conversation.id}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="p-4 hover:bg-muted transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={otherUser.profilePhoto || undefined} />
                                <AvatarFallback>
                                  {otherUser.name?.charAt(0) || otherUser.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold text-sm truncate">
                                    {otherUser.name || otherUser.username}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {lastMessage ? new Date(lastMessage.createdAt).toLocaleDateString() : ''}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {lastMessage ? lastMessage.content : 'No messages yet'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="p-3 border-t">
                <Link href="/messages" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    View All Messages
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
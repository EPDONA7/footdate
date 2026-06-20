"use client"

import { useState, useEffect } from "react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, Search, Plus, X } from "lucide-react"
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

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [searchUsername, setSearchUsername] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations")
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async (username: string) => {
    if (!username.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const res = await fetch(`/api/users/search?username=${encodeURIComponent(username)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.users || [])
      }
    } catch (error) {
      console.error("Error searching users:", error)
    } finally {
      setSearching(false)
    }
  }

  const startConversation = async (userId: string) => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      })

      if (res.ok) {
        const data = await res.json()
        redirect(`/messages/${data.conversation.id}`)
      } else {
        const error = await res.json()
        alert(error.error || "Failed to start conversation")
      }
    } catch (error) {
      console.error("Error starting conversation:", error)
      alert("Failed to start conversation")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Messages</h1>
            <p className="text-muted-foreground">{conversations.length} conversations</p>
          </div>
          <Button onClick={() => setShowNewMessage(!showNewMessage)}>
            {showNewMessage ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {showNewMessage ? "Cancel" : "New Message"}
          </Button>
        </div>

        {showNewMessage && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by username..."
                  className="pl-10"
                  value={searchUsername}
                  onChange={(e) => {
                    setSearchUsername(e.target.value)
                    searchUsers(e.target.value)
                  }}
                />
              </div>
              {searching && <p className="text-sm text-muted-foreground">Searching...</p>}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => startConversation(user.id)}
                    >
                      <Avatar>
                        <AvatarImage src={user.profilePhoto || undefined} />
                        <AvatarFallback>
                          {user.name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{user.name || user.username}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search conversations..." className="pl-10" />
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Loading conversations...</p>
                </CardContent>
              </Card>
            ) : conversations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">No conversations yet</p>
                  <Button onClick={() => setShowNewMessage(true)} variant="outline">
                    Start a conversation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              conversations.map((conversation) => {
                const otherUser = conversation.user1Id === conversation.user1.id ? conversation.user2 : conversation.user1
                const lastMessage = conversation.messages[0]

                return (
                  <Link key={conversation.id} href={`/messages/${conversation.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={otherUser.profilePhoto || undefined} />
                            <AvatarFallback>
                              {otherUser.name?.charAt(0) || otherUser.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-semibold truncate">
                                {otherUser.name || otherUser.username}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {lastMessage ? new Date(lastMessage.createdAt).toLocaleDateString() : ''}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {lastMessage ? lastMessage.content : 'No messages yet'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })
            )}
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle>Select a conversation</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p>Choose a conversation from the left to start messaging</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

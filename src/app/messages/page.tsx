import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, Search, Plus } from "lucide-react"
import Link from "next/link"

export default async function MessagesPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/sign-in")
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { user1Id: user.id },
        { user2Id: user.id }
      ]
    },
    include: {
      user1: true,
      user2: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Messages</h1>
            <p className="text-muted-foreground">{conversations.length} conversations</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Button>
        </div>

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

            {conversations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No conversations yet</p>
                  <Button className="mt-4" variant="outline">
                    Start a conversation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              conversations.map((conversation) => {
                const otherUser = conversation.user1Id === user.id ? conversation.user2 : conversation.user1
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

import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Heart, MessageSquare, Share2, Image as ImageIcon, Send } from "lucide-react"

export default async function FeedPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/sign-in")
  }

  const posts = await prisma.post.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      likes: true,
      comments: {
        include: {
          user: true
        },
        take: 3
      },
      _count: {
        select: {
          likes: true,
          comments: true
        }
      }
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Community Feed</h1>
          <p className="text-muted-foreground">Share your football journey with the community</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage src={user.profilePhoto || undefined} />
                    <AvatarFallback>
                      {user.name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input 
                      placeholder="Share your football moments..." 
                      className="mb-3"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Photo
                        </Button>
                      </div>
                      <Button size="sm">
                        <Send className="h-4 w-4 mr-2" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Posts */}
            {posts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                  <p className="text-muted-foreground">
                    Be the first to share something with the community!
                  </p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={post.user?.profilePhoto || undefined} />
                        <AvatarFallback>
                          {post.user?.name?.charAt(0) || post.user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{post.user?.name || post.user?.username}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{post.content}</p>
                    {post.images?.length > 0 && (
                      <div className="rounded-lg overflow-hidden">
                        <img 
                          src={post.images[0]} 
                          alt="Post image" 
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-4 pt-2">
                      <Button size="sm" variant="ghost">
                        <Heart className="h-4 w-4 mr-2" />
                        {post._count.likes}
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {post._count.comments}
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>

                    {/* Comments Preview */}
                    {post.comments.length > 0 && (
                      <div className="pt-4 border-t">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3 mb-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.user.profilePhoto || undefined} />
                              <AvatarFallback className="text-sm">
                                {comment.user.name?.charAt(0) || comment.user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="text-sm">
                                <span className="font-semibold">
                                  {comment.user.name || comment.user.username}
                                </span>
                                <span className="ml-2">{comment.content}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trending Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">#EthiopianFootball</span>
                    <Badge variant="secondary">Trending</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">#MatchDay</span>
                    <Badge variant="secondary">Hot</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">#Futsal</span>
                    <Badge variant="secondary">Popular</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                      FC
                    </div>
                    <span className="text-sm">FC Addis</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                      DD
                    </div>
                    <span className="text-sm">Dire Dawa FC</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                      MC
                    </div>
                    <span className="text-sm">Mekelle City</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bell, CheckCheck } from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" })
      fetchNotifications()
    } catch (error) {
      console.error("Error marking all read:", error)
    }
  }

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (error) {
      console.error("Error marking read:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Bell className="h-7 w-7" />
                Notifications
                {unreadCount > 0 && <Badge>{unreadCount} new</Badge>}
              </h1>
              <p className="text-muted-foreground">Stay updated with your activity</p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllRead}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">You&apos;re all caught up!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const content = (
                <Card className={n.read ? "" : "border-primary bg-primary/5"}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {n.title}
                          {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        <div className="text-sm text-muted-foreground">{n.message}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
              return (
                <div key={n.id} onClick={() => !n.read && markRead(n.id)}>
                  {n.link ? <Link href={n.link}>{content}</Link> : content}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

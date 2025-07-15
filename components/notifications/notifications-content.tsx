"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Spinner } from "@/components/loader/spinner" // Updated import path

interface Notification {
  _id: string
  type: "like" | "repost" | "follow" | "mention"
  fromUser: {
    _id: string
    username: string
    avatarUrl?: string
  }
  post?: {
    _id: string
    content: string
  }
  createdAt: string
}

export function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/notifications")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setNotifications(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-64px)] text-red-500">Error: {error}</div>
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-center text-gray-500">No new notifications.</p>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification._id} className="flex items-start gap-3 p-3 border-b last:border-b-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={notification.fromUser.avatarUrl || "/placeholder-user.jpg"}
                        alt={notification.fromUser.username}
                      />
                      <AvatarFallback>{notification.fromUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{notification.fromUser.username}</span>{" "}
                        {notification.type === "like" && "liked your post."}
                        {notification.type === "repost" && "reposted your post."}
                        {notification.type === "follow" && "started following you."}
                        {notification.type === "mention" && (
                          <>mentioned you in a post: "{notification.post?.content.substring(0, 50)}..."</>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"
import { LogOut, Menu, X, Heart, UserPlus, MessageCircle, Repeat2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { VerificationBadge } from "@/components/badge/verification-badge"

interface Notification {
  _id: string
  type: "like" | "follow" | "mention" | "reply" | "repost"
  createdAt: string
  fromUser: {
    _id: string
    username: string
    displayName: string
    avatarUrl: string | null
    isVerified?: boolean
  }
  post?: {
    _id: string
    content: string
  }
  isRead?: boolean
}

export function NotificationsContent() {
  const { data: session } = useSession()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return

      try {
        // Fetch current user profile
        const userResponse = await fetch("/api/users/current")
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData)
          setProfile(userData)
        }

        // Fetch notifications
        const notificationsResponse = await fetch("/api/notifications")
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json()
          setNotifications(notificationsData)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [session])

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-red-500" />
      case "follow":
        return <UserPlus className="h-5 w-5 text-blue-500" />
      case "mention":
        return <MessageCircle className="h-5 w-5 text-green-500" />
      case "reply":
        return <MessageCircle className="h-5 w-5 text-blue-500" />
      case "repost":
        return <Repeat2 className="h-5 w-5 text-green-500" />
      default:
        return null
    }
  }

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case "like":
        return `${notification.fromUser.displayName} liked your post`
      case "follow":
        return `${notification.fromUser.displayName} started following you`
      case "mention":
        return `${notification.fromUser.displayName} mentioned you in a post`
      case "reply":
        return `${notification.fromUser.displayName} replied to your post`
      case "repost":
        return `${notification.fromUser.displayName} reposted your post`
      default:
        return ""
    }
  }

  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case "follow":
        return `/profile/${notification.fromUser.username}`
      case "reply":
        return `/reply/${notification.post?._id}`
      default:
        return notification.post ? `/post/${notification.post._id}` : `/profile/${notification.fromUser.username}`
    }
  }

  if (!session?.user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold logo-font">Cōdes</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? "block" : "hidden"} lg:block fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white border-r lg:border-r-0`}
        >
          <Sidebar profile={profile} onSignOut={handleSignOut} />
        </div>

        {/* Main content */}
        <div className="flex-1 max-w-2xl mx-auto">
          <div className="border-x bg-white min-h-screen">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b px-4 py-3">
              <h2 className="text-xl font-bold">Notifications</h2>
            </div>

            <div className="divide-y">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <Link key={notification._id} href={getNotificationLink(notification)}>
                    <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={notification.fromUser.avatarUrl || undefined} />
                              <AvatarFallback>
                                {notification.fromUser.displayName?.charAt(0)?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-semibold flex items-center gap-1">
                                  {notification.fromUser.displayName}
                                  {notification.fromUser.isVerified && (
                                    <VerificationBadge verified={true} size={12} className="h-3 w-3" />
                                  )}
                                </span>
                                <span className="text-gray-500"> @{notification.fromUser.username}</span>
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{getNotificationText(notification)}</p>
                          {notification.post && (
                            <Card className="bg-gray-50">
                              <CardContent className="p-3">
                                <p className="text-sm text-gray-600 line-clamp-2">{notification.post.content}</p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}

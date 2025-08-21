"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, UserPlus, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { bn } from "date-fns/locale"

interface NotificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Notification {
  id: string
  type: "like" | "follow" | "mention" | "reply" | "repost"
  created_at: string
  from_user: {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
  } | null
  post?: {
    id: string
    content: string
  }
}

export function NotificationDialog({ open, onOpenChange }: NotificationDialogProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch('/api/users/current')
        if (!userRes.ok) {
          setIsLoading(false)
          return
        }
        const user = await userRes.json()
        setCurrentUser(user)

        const notifRes = await fetch('/api/notifications')
        if (!notifRes.ok) {
          setIsLoading(false)
          return
        }
        const data = await notifRes.json()
        setNotifications(data)
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (open) {
      fetchData()
    }
  }, [open])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />
      case "follow":
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case "mention":
        return <MessageCircle className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case "like":
        return `${notification.from_user?.display_name ?? 'কেউ একজন'} আপনার পোস্ট পছন্দ করেছেন`
      case "follow":
        return `${notification.from_user?.display_name ?? 'কেউ একজন'} আপনাকে অনুসরণ করতে শুরু করেছেন`
      case "mention":
        return `${notification.from_user?.display_name ?? 'কেউ একজন'} আপনাকে একটি পোস্টে উল্লেখ করেছেন`
      case "reply":
        return `${notification.from_user?.display_name ?? 'কেউ একজন'} আপনার পোস্টে উত্তর দিয়েছেন`
      case "repost":
        return `${notification.from_user?.display_name ?? 'কেউ একজন'} আপনার পোস্টটি রিপোস্ট করেছেন`
      default:
        return ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bengali-font max-w-sm lg:max-w-md mx-4 lg:mx-auto max-h-[85vh] lg:max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg lg:text-xl">বিজ্ঞপ্তি</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>কোনো বিজ্ঞপ্তি নেই</p>
            </div>
          ) : (
            <div className="space-y-2 lg:space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-2 lg:p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex gap-2 lg:gap-3">
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="w-6 h-6 lg:w-8 lg:h-8 flex-shrink-0">
                          <AvatarImage src={notification.from_user?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs lg:text-sm">
                            {notification.from_user?.display_name?.charAt(0)?.toUpperCase() || "ব"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs lg:text-sm">
                            <span className="font-semibold">{notification.from_user?.display_name ?? 'Anyone'}</span>
                            {notification.from_user?.username && (
                              <span className="text-gray-500"> @{notification.from_user.username}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: bn })}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs lg:text-sm text-gray-700 mb-2">{getNotificationText(notification)}</p>
                      {notification.post && (
                        <Card className="bg-gray-50">
                          <CardContent className="p-2">
                            <p className="text-xs text-gray-600 line-clamp-2">{notification.post.content}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

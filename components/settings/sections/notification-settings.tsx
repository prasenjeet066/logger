"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mail, Smartphone, Volume2, MessageCircle, Heart, Repeat2, UserPlus, Shield, Newspaper } from "lucide-react"
import { toast } from "sonner"

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [soundVolume, setSoundVolume] = useState([75])

  const [emailNotifications, setEmailNotifications] = useState({
    newFollowers: true,
    mentions: true,
    directMessages: true,
    likes: false,
    reposts: false,
    comments: true,
    newsletter: true,
    securityAlerts: true,
    productUpdates: false,
  })

  const [pushNotifications, setPushNotifications] = useState({
    newFollowers: true,
    mentions: true,
    directMessages: true,
    likes: true,
    reposts: true,
    comments: true,
    liveStreams: false,
  })

  const [soundSettings, setSoundSettings] = useState({
    enabled: true,
    messageSound: "default",
    notificationSound: "subtle",
    volume: 75,
  })

  const handleEmailToggle = (key: string, value: boolean) => {
    setEmailNotifications((prev) => ({ ...prev, [key]: value }))
  }

  const handlePushToggle = (key: string, value: boolean) => {
    setPushNotifications((prev) => ({ ...prev, [key]: value }))
  }

  const handleSoundToggle = (key: string, value: boolean | string | number) => {
    setSoundSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Notification settings updated!")
    } catch (error) {
      toast.error("Failed to update settings")
    } finally {
      setIsLoading(false)
    }
  }

  const notificationTypes = [
    {
      key: "newFollowers",
      icon: UserPlus,
      title: "New Followers",
      description: "When someone follows you",
    },
    {
      key: "mentions",
      icon: MessageCircle,
      title: "Mentions",
      description: "When someone mentions you in a post",
    },
    {
      key: "directMessages",
      icon: Mail,
      title: "Direct Messages",
      description: "When you receive a new message",
    },
    {
      key: "likes",
      icon: Heart,
      title: "Likes",
      description: "When someone likes your post",
    },
    {
      key: "reposts",
      icon: Repeat2,
      title: "Reposts",
      description: "When someone reposts your content",
    },
    {
      key: "comments",
      icon: MessageCircle,
      title: "Comments",
      description: "When someone comments on your post",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>Choose what email notifications you'd like to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type) => {
            const Icon = type.icon
            return (
              <div key={type.key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{type.title}</p>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </div>
                <Switch
                  checked={emailNotifications[type.key as keyof typeof emailNotifications]}
                  onCheckedChange={(value) => handleEmailToggle(type.key, value)}
                />
              </div>
            )
          })}

          <Separator />

          {/* Additional Email Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Newspaper className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Newsletter</p>
                  <p className="text-sm text-gray-600">Weekly updates and tips</p>
                </div>
              </div>
              <Switch
                checked={emailNotifications.newsletter}
                onCheckedChange={(value) => handleEmailToggle("newsletter", value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Security Alerts</p>
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      Required
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">Important security notifications</p>
                </div>
              </div>
              <Switch
                checked={emailNotifications.securityAlerts}
                onCheckedChange={(value) => handleEmailToggle("securityAlerts", value)}
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>Manage notifications on your mobile device and browser</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type) => {
            const Icon = type.icon
            return (
              <div key={type.key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{type.title}</p>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </div>
                <Switch
                  checked={pushNotifications[type.key as keyof typeof pushNotifications]}
                  onCheckedChange={(value) => handlePushToggle(type.key, value)}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Sound Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Sound Settings
          </CardTitle>
          <CardDescription>Customize notification sounds and volume</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Sounds</p>
              <p className="text-sm text-gray-600">Play sounds for notifications</p>
            </div>
            <Switch checked={soundSettings.enabled} onCheckedChange={(value) => handleSoundToggle("enabled", value)} />
          </div>

          {soundSettings.enabled && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message Sound</label>
                  <Select
                    value={soundSettings.messageSound}
                    onValueChange={(value) => handleSoundToggle("messageSound", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="chime">Chime</SelectItem>
                      <SelectItem value="bell">Bell</SelectItem>
                      <SelectItem value="pop">Pop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notification Sound</label>
                  <Select
                    value={soundSettings.notificationSound}
                    onValueChange={(value) => handleSoundToggle("notificationSound", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subtle">Subtle</SelectItem>
                      <SelectItem value="gentle">Gentle</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                      <SelectItem value="ping">Ping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Volume</label>
                    <span className="text-sm text-gray-500">{soundVolume[0]}%</span>
                  </div>
                  <Slider value={soundVolume} onValueChange={setSoundVolume} max={100} step={5} className="w-full" />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Reset to Default</Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}

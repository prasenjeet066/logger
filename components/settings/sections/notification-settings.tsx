"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Bell, Mail, Smartphone, MessageSquare, Heart, Repeat, UserPlus, Volume2, Save } from "lucide-react"

export function NotificationSettings() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  // Email notifications
  const [emailNotifications, setEmailNotifications] = useState({
    newFollowers: true,
    likes: false,
    comments: true,
    reposts: false,
    mentions: true,
    directMessages: true,
    newsletter: true,
    security: true,
  })

  // Push notifications
  const [pushNotifications, setPushNotifications] = useState({
    newFollowers: true,
    likes: true,
    comments: true,
    reposts: true,
    mentions: true,
    directMessages: true,
  })

  // Sound settings
  const [soundSettings, setSoundSettings] = useState({
    enabled: true,
    volume: 50,
    messageSound: true,
    notificationSound: true,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/users/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailNotifications,
          push: pushNotifications,
          sound: soundSettings,
        }),
      })

      if (!response.ok) throw new Error("Failed to update notifications")

      toast({
        title: "Success",
        description: "Notification preferences updated!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const NotificationRow = ({
    icon: Icon,
    title,
    description,
    emailChecked,
    pushChecked,
    onEmailChange,
    onPushChange,
  }: any) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3 flex-1">
        <Icon className="h-5 w-5 text-gray-400" />
        <div>
          <Label className="font-medium">{title}</Label>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <Switch checked={emailChecked} onCheckedChange={onEmailChange} />
        </div>
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-gray-400" />
          <Switch checked={pushChecked} onCheckedChange={onPushChange} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span>Push</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <NotificationRow
            icon={UserPlus}
            title="New Followers"
            description="When someone follows you"
            emailChecked={emailNotifications.newFollowers}
            pushChecked={pushNotifications.newFollowers}
            onEmailChange={(checked: boolean) => setEmailNotifications((prev) => ({ ...prev, newFollowers: checked }))}
            onPushChange={(checked: boolean) => setPushNotifications((prev) => ({ ...prev, newFollowers: checked }))}
          />
          <Separator />

          <NotificationRow
            icon={Heart}
            title="Likes"
            description="When someone likes your post"
            emailChecked={emailNotifications.likes}
            pushChecked={pushNotifications.likes}
            onEmailChange={(checked: boolean) => setEmailNotifications((prev) => ({ ...prev, likes: checked }))}
            onPushChange={(checked: boolean) => setPushNotifications((prev) => ({ ...prev, likes: checked }))}
          />
          <Separator />

          <NotificationRow
            icon={MessageSquare}
            title="Comments"
            description="When someone comments on your post"
            emailChecked={emailNotifications.comments}
            pushChecked={pushNotifications.comments}
            onEmailChange={(checked: boolean) => setEmailNotifications((prev) => ({ ...prev, comments: checked }))}
            onPushChange={(checked: boolean) => setPushNotifications((prev) => ({ ...prev, comments: checked }))}
          />
          <Separator />

          <NotificationRow
            icon={Repeat}
            title="Reposts"
            description="When someone reposts your content"
            emailChecked={emailNotifications.reposts}
            pushChecked={pushNotifications.reposts}
            onEmailChange={(checked: boolean) => setEmailNotifications((prev) => ({ ...prev, reposts: checked }))}
            onPushChange={(checked: boolean) => setPushNotifications((prev) => ({ ...prev, reposts: checked }))}
          />
          <Separator />

          <NotificationRow
            icon={Bell}
            title="Mentions"
            description="When someone mentions you in a post"
            emailChecked={emailNotifications.mentions}
            pushChecked={pushNotifications.mentions}
            onEmailChange={(checked: boolean) => setEmailNotifications((prev) => ({ ...prev, mentions: checked }))}
            onPushChange={(checked: boolean) => setPushNotifications((prev) => ({ ...prev, mentions: checked }))}
          />
          <Separator />

          <NotificationRow
            icon={MessageSquare}
            title="Direct Messages"
            description="When you receive a direct message"
            emailChecked={emailNotifications.directMessages}
            pushChecked={pushNotifications.directMessages}
            onEmailChange={(checked: boolean) =>
              setEmailNotifications((prev) => ({ ...prev, directMessages: checked }))
            }
            onPushChange={(checked: boolean) => setPushNotifications((prev) => ({ ...prev, directMessages: checked }))}
          />
        </CardContent>
      </Card>

      {/* Sound Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Sound Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Sounds</Label>
              <p className="text-sm text-gray-500">Play sounds for notifications</p>
            </div>
            <Switch
              checked={soundSettings.enabled}
              onCheckedChange={(checked) => setSoundSettings((prev) => ({ ...prev, enabled: checked }))}
            />
          </div>

          {soundSettings.enabled && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Message Sounds</Label>
                  <p className="text-sm text-gray-500">Play sound for new messages</p>
                </div>
                <Switch
                  checked={soundSettings.messageSound}
                  onCheckedChange={(checked) => setSoundSettings((prev) => ({ ...prev, messageSound: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notification Sounds</Label>
                  <p className="text-sm text-gray-500">Play sound for other notifications</p>
                </div>
                <Switch
                  checked={soundSettings.notificationSound}
                  onCheckedChange={(checked) => setSoundSettings((prev) => ({ ...prev, notificationSound: checked }))}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Email Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Newsletter</Label>
              <p className="text-sm text-gray-500">Receive our weekly newsletter</p>
            </div>
            <Switch
              checked={emailNotifications.newsletter}
              onCheckedChange={(checked) => setEmailNotifications((prev) => ({ ...prev, newsletter: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Security Alerts</Label>
              <p className="text-sm text-gray-500">Important security notifications (recommended)</p>
            </div>
            <Switch
              checked={emailNotifications.security}
              onCheckedChange={(checked) => setEmailNotifications((prev) => ({ ...prev, security: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-32">
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

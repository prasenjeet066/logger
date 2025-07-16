"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Bell, Save } from "lucide-react"
import { Spinner } from "@/components/loader/spinner"
import type { UpdateSettingsData } from "@/lib/validations/settings"

interface NotificationSettingsProps {
  formData: UpdateSettingsData
  handleChange: (field: keyof UpdateSettingsData, value: any) => void
  saving: boolean
  hasChanges: () => boolean
  saveSettings: () => Promise<void>
}

export function NotificationSettings({
  formData,
  handleChange,
  saving,
  hasChanges,
  saveSettings,
}: NotificationSettingsProps) {
  return (
    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Bell className="h-5 w-5 text-primary" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div>
            <Label htmlFor="email-notifications" className="text-base font-medium text-gray-800 dark:text-gray-200">
              Email Notifications
            </Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
          </div>
          <Switch
            id="email-notifications"
            checked={formData.emailNotifications}
            onCheckedChange={(checked) => handleChange("emailNotifications", checked)}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
          />
        </div>

        <Separator className="bg-gray-200 dark:bg-gray-700" />

        <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div>
            <Label htmlFor="push-notifications" className="text-base font-medium text-gray-800 dark:text-gray-200">
              Push Notifications
            </Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications on your device</p>
          </div>
          <Switch
            id="push-notifications"
            checked={formData.pushNotifications}
            onCheckedChange={(checked) => handleChange("pushNotifications", checked)}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
          />
        </div>

        <Separator className="bg-gray-200 dark:bg-gray-700" />

        <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div>
            <Label htmlFor="sound-enabled" className="text-base font-medium text-gray-800 dark:text-gray-200">
              Notification Sounds
            </Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Play sounds for notifications</p>
          </div>
          <Switch
            id="sound-enabled"
            checked={formData.soundEnabled}
            onCheckedChange={(checked) => handleChange("soundEnabled", checked)}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
          />
        </div>
        <Button
          onClick={saveSettings}
          disabled={saving || !hasChanges()}
          className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white dark:bg-primary dark:hover:bg-primary/80"
        >
          {saving ? (
            <>
              <Spinner className="h-4 w-4 mr-2 text-white" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

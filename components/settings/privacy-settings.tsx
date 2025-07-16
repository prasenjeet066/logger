"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Shield, Save } from "lucide-react"
import { Spinner } from "@/components/loader/spinner"
import type { UpdateSettingsData } from "@/lib/validations/settings"

interface PrivacySettingsProps {
  formData: UpdateSettingsData
  handleChange: (field: keyof UpdateSettingsData, value: any) => void
  saving: boolean
  hasChanges: () => boolean
  saveSettings: () => Promise<void>
}

export function PrivacySettings({ formData, handleChange, saving, hasChanges, saveSettings }: PrivacySettingsProps) {
  return (
    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Shield className="h-5 w-5 text-primary" />
          Privacy Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div>
            <Label htmlFor="private-account" className="text-base font-medium text-gray-800 dark:text-gray-200">
              Private Account
            </Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Only approved followers can see your posts</p>
          </div>
          <Switch
            id="private-account"
            checked={formData.isPrivate}
            onCheckedChange={(checked) => handleChange("isPrivate", checked)}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
          />
        </div>

        <Separator className="bg-gray-200 dark:bg-gray-700" />

        <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div>
            <Label htmlFor="allow-messages" className="text-base font-medium text-gray-800 dark:text-gray-200">
              Allow Direct Messages
            </Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Let others send you direct messages</p>
          </div>
          <Switch
            id="allow-messages"
            checked={formData.allowMessages}
            onCheckedChange={(checked) => handleChange("allowMessages", checked)}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
          />
        </div>

        <Separator className="bg-gray-200 dark:bg-gray-700" />

        <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div>
            <Label htmlFor="show-email" className="text-base font-medium text-gray-800 dark:text-gray-200">
              Show Email in Profile
            </Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Display your email address on your profile</p>
          </div>
          <Switch
            id="show-email"
            checked={formData.showEmail}
            onCheckedChange={(checked) => handleChange("showEmail", checked)}
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

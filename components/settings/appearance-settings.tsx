"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Palette, Save } from "lucide-react"
import { Spinner } from "@/components/loader/spinner"
import type { UpdateSettingsData } from "@/lib/validations/settings"

interface AppearanceSettingsProps {
  formData: UpdateSettingsData
  handleChange: (field: keyof UpdateSettingsData, value: any) => void
  saving: boolean
  hasChanges: () => boolean
  saveSettings: () => Promise<void>
}

export function AppearanceSettings({
  formData,
  handleChange,
  saving,
  hasChanges,
  saveSettings,
}: AppearanceSettingsProps) {
  return (
    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Palette className="h-5 w-5 text-primary" />
          Appearance Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div>
            <Label htmlFor="dark-mode" className="text-base font-medium text-gray-800 dark:text-gray-200">
              Dark Mode
            </Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Use dark theme for the interface</p>
          </div>
          <Switch
            id="dark-mode"
            checked={formData.darkMode}
            onCheckedChange={(checked) => handleChange("darkMode", checked)}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
          />
        </div>

        <Separator className="bg-gray-200 dark:bg-gray-700" />

        <div className="space-y-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Label htmlFor="language" className="text-base font-medium text-gray-800 dark:text-gray-200">
            Language
          </Label>
          <select
            id="language"
            value={formData.language}
            onChange={(e) => handleChange("language", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 dark:text-gray-50 dark:border-gray-700 text-gray-900"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
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

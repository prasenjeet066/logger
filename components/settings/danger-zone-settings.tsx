"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Trash2 } from "lucide-react"

interface DangerZoneSettingsProps {
  handleSignOut: () => Promise<void>
  setIsDeleteAccountDialogOpen: (open: boolean) => void
}

export function DangerZoneSettings({ handleSignOut, setIsDeleteAccountDialogOpen }: DangerZoneSettingsProps) {
  return (
    <Card className="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
      <CardHeader>
        <CardTitle className="text-red-600 dark:text-red-400 text-lg font-semibold">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div>
            <Label className="text-base font-medium text-gray-800 dark:text-gray-200">Sign Out</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sign out of your account</p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700 bg-transparent text-gray-700 hover:bg-gray-50"
          >
            Sign Out
          </Button>
        </div>
        <Separator className="bg-gray-200 dark:bg-gray-700" />
        <div className="flex items-center justify-between p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
          <div>
            <Label className="text-base font-medium text-red-600 dark:text-red-400">Delete Account</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all data</p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteAccountDialogOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Shield, Eye, Lock, Users, MessageSquare, Search, Download, Trash2, Save } from "lucide-react"

export function PrivacySettings() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [privacySettings, setPrivacySettings] = useState({
    privateAccount: false,
    allowMessages: true,
    showEmail: false,
    showLocation: true,
    showOnlineStatus: true,
    allowTagging: true,
    searchable: true,
    showFollowers: true,
    showFollowing: true,
    allowDataDownload: true,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/users/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(privacySettings),
      })

      if (!response.ok) throw new Error("Failed to update privacy settings")

      toast({
        title: "Success",
        description: "Privacy settings updated!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save privacy settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDataDownload = async () => {
    try {
      const response = await fetch("/api/users/data-export", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to request data export")

      toast({
        title: "Success",
        description: "Data export requested. You'll receive an email when ready.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request data export",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Account Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label>Private Account</Label>
                {privacySettings.privateAccount && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">Only approved followers can see your posts and profile</p>
            </div>
            <Switch
              checked={privacySettings.privateAccount}
              onCheckedChange={(checked) => setPrivacySettings((prev) => ({ ...prev, privateAccount: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Discoverable
              </Label>
              <p className="text-sm text-gray-500">Allow others to find you in search results</p>
            </div>
            <Switch
              checked={privacySettings.searchable}
              onCheckedChange={(checked) => setPrivacySettings((prev) => ({ ...prev, searchable: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Email Address</Label>
              <p className="text-sm text-gray-500">Display your email on your profile</p>
            </div>
            <Switch
              checked={privacySettings.showEmail}
              onCheckedChange={(checked) => setPrivacySettings((prev) => ({ ...prev, showEmail: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Show Location</Label>
              <p className="text-sm text-gray-500">Display your location on your profile</p>
            </div>
            <Switch
              checked={privacySettings.showLocation}
              onCheckedChange={(checked) => setPrivacySettings((prev) => ({ ...prev, showLocation: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Show Online Status</Label>
              <p className="text-sm text-gray-500">Let others see when you're online</p>
            </div>
            <Switch
              checked={privacySettings.showOnlineStatus}
              onCheckedChange={(checked) => setPrivacySettings((prev) => ({ ...prev, showOnlineStatus: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Show Followers
              </Label>
              <p className="text-sm text-gray-500">Display your followers list publicly</p>
            </div>
            <Switch
              checked={privacySettings.showFollowers}
              onCheckedChange={(checked) => setPrivacySettings((prev) => ({ ...prev, showFollowers: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show Following</Label>
              <p className="text-sm text-gray-500">Display who you're following publicly</p>
            </div>
            <Switch
              checked={privacySettings.showFollowing}
              onCheckedChange={(checked) => setPrivacySettings((prev) => ({ ...prev, showFollowing: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Interaction Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Interaction Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Allow Direct Messages</Label>
              <p className="text-sm text-gray-500">Let others send you direct messages</p>
            </div>
            <Switch
              checked={privacySettings.allowMessages}
              onCheckedChange={(checked) => setPrivacySettings((prev) => ({ ...prev, allowMessages: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Allow Tagging</Label>
              <p className="text-sm text-gray-500">Let others tag you in posts and comments</p>
            </div>
            <Switch
              checked={privacySettings.allowTagging}
              onCheckedChange={(checked) => setPrivacySettings((prev) => ({ ...prev, allowTagging: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Data Download</Label>
              <p className="text-sm text-gray-500">Download a copy of your data</p>
            </div>
            <Button variant="outline" onClick={handleDataDownload}>
              <Download className="h-4 w-4 mr-2" />
              Request Data
            </Button>
          </div>

          <Separator />

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-red-700">Delete Account</Label>
                <p className="text-sm text-red-600">Permanently delete your account and all associated data</p>
              </div>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
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

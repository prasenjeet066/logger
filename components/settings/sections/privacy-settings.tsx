"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Lock,
  Eye,
  EyeOff,
  Users,
  MessageCircle,
  Tag,
  Download,
  Trash2,
  Shield,
  AlertTriangle,
  Globe,
} from "lucide-react"
import { toast } from "sonner"

export function PrivacySettings() {
  const [isLoading, setIsLoading] = useState(false)

  const [privacySettings, setPrivacySettings] = useState({
    accountPrivacy: "public", // public, private
    profileVisibility: "everyone", // everyone, followers, nobody
    postVisibility: "everyone", // everyone, followers, mentioned
    allowMessages: "everyone", // everyone, followers, nobody
    allowTagging: "everyone", // everyone, followers, nobody
    showOnlineStatus: true,
    showReadReceipts: true,
    allowSearchEngines: true,
    showInSuggestions: true,
  })

  const [blockedUsers] = useState([
    { id: "1", username: "spammer123", displayName: "Spam Account", blockedDate: "2024-01-15" },
    { id: "2", username: "troll456", displayName: "Troll User", blockedDate: "2024-01-10" },
  ])

  const handleSettingChange = (key: string, value: string | boolean) => {
    setPrivacySettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Privacy settings updated!")
    } catch (error) {
      toast.error("Failed to update settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnblockUser = async (userId: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success("User unblocked successfully")
    } catch (error) {
      toast.error("Failed to unblock user")
    }
  }

  const handleExportData = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.success("Data export started. You'll receive an email when ready.")
    } catch (error) {
      toast.error("Failed to start data export")
    }
  }

  const handleDeleteAccount = () => {
    toast.error("Account deletion requires additional verification")
  }

  return (
    <div className="space-y-6">
      {/* Account Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Account Privacy
          </CardTitle>
          <CardDescription>Control who can see your profile and posts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${privacySettings.accountPrivacy === "private" ? "bg-orange-100" : "bg-green-100"}`}
                >
                  {privacySettings.accountPrivacy === "private" ? (
                    <EyeOff className="h-4 w-4 text-orange-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Account Type</p>
                  <p className="text-sm text-gray-600">
                    {privacySettings.accountPrivacy === "private"
                      ? "Only approved followers can see your posts"
                      : "Anyone can see your public posts"}
                  </p>
                </div>
              </div>
              <Select
                value={privacySettings.accountPrivacy}
                onValueChange={(value) => handleSettingChange("accountPrivacy", value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Public
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Private
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Profile Visibility</label>
                <Select
                  value={privacySettings.profileVisibility}
                  onValueChange={(value) => handleSettingChange("profileVisibility", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="followers">Followers Only</SelectItem>
                    <SelectItem value="nobody">Nobody</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Post Visibility</label>
                <Select
                  value={privacySettings.postVisibility}
                  onValueChange={(value) => handleSettingChange("postVisibility", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="followers">Followers Only</SelectItem>
                    <SelectItem value="mentioned">Mentioned Users Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interaction Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Interaction Settings
          </CardTitle>
          <CardDescription>Control how others can interact with you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Direct Messages
              </label>
              <Select
                value={privacySettings.allowMessages}
                onValueChange={(value) => handleSettingChange("allowMessages", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="followers">Followers Only</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tagging
              </label>
              <Select
                value={privacySettings.allowTagging}
                onValueChange={(value) => handleSettingChange("allowTagging", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="followers">Followers Only</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Show Online Status</p>
                <p className="text-sm text-gray-600">Let others see when you're active</p>
              </div>
              <Switch
                checked={privacySettings.showOnlineStatus}
                onCheckedChange={(value) => handleSettingChange("showOnlineStatus", value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Read Receipts</p>
                <p className="text-sm text-gray-600">Show when you've read messages</p>
              </div>
              <Switch
                checked={privacySettings.showReadReceipts}
                onCheckedChange={(value) => handleSettingChange("showReadReceipts", value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Search Engine Indexing</p>
                <p className="text-sm text-gray-600">Allow search engines to index your profile</p>
              </div>
              <Switch
                checked={privacySettings.allowSearchEngines}
                onCheckedChange={(value) => handleSettingChange("allowSearchEngines", value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Show in Suggestions</p>
                <p className="text-sm text-gray-600">Appear in "Who to Follow" suggestions</p>
              </div>
              <Switch
                checked={privacySettings.showInSuggestions}
                onCheckedChange={(value) => handleSettingChange("showInSuggestions", value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocked Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Blocked Users
          </CardTitle>
          <CardDescription>Manage users you've blocked</CardDescription>
        </CardHeader>
        <CardContent>
          {blockedUsers.length > 0 ? (
            <div className="space-y-3">
              {blockedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.displayName}</p>
                    <p className="text-sm text-gray-600">@{user.username}</p>
                    <p className="text-xs text-gray-500">Blocked on {user.blockedDate}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleUnblockUser(user.id)}>
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No blocked users</p>
              <p className="text-sm">Users you block will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data & Account Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data & Account Management
          </CardTitle>
          <CardDescription>Export your data or delete your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Export Your Data</p>
              <p className="text-sm text-gray-600">Download a copy of your posts, profile, and settings</p>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>

          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </AlertDescription>
          </Alert>
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

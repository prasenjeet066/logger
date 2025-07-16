"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Camera, Save } from "lucide-react"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { Spinner } from "@/components/loader/spinner"
import type { UpdateSettingsData } from "@/lib/validations/settings"
import type { Session } from "next-auth"

interface ProfileSettingsProps {
  formData: UpdateSettingsData
  handleChange: (field: keyof UpdateSettingsData, value: any) => void
  errors: Partial<UpdateSettingsData>
  saving: boolean
  hasChanges: () => boolean
  session: Session | null
  setIsEditProfileDialogOpen: (open: boolean) => void
  onProfileUpdateFromDialog: (updatedProfile: any) => void
  saveSettings: () => Promise<void>
}

export function ProfileSettings({
  formData,
  handleChange,
  errors,
  saving,
  hasChanges,
  session,
  setIsEditProfileDialogOpen,
  onProfileUpdateFromDialog,
  saveSettings,
}: ProfileSettingsProps) {
  const user = session?.user

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    )
  }

  return (
    <>
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar
              className="h-20 w-20 cursor-pointer border-2 border-primary/50"
              onClick={() => setIsEditProfileDialogOpen(true)}
            >
              <AvatarImage src={user.avatarUrl || undefined} alt={`${user.displayName || user.username}'s avatar`} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {user.displayName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-transparent dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700 text-gray-700 hover:bg-gray-50"
                onClick={() => setIsEditProfileDialogOpen(true)}
              >
                <Camera className="h-4 w-4" />
                Change Photo
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Click avatar to edit profile, including photos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Display Name
              </Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleChange("displayName", e.target.value)}
                placeholder="Your display name"
                className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-50"
              />
              {errors.displayName && <p className="text-sm text-red-600 dark:text-red-400">{errors.displayName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </Label>
              <Input
                id="username"
                value={user.username || ""}
                disabled
                className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Username cannot be changed</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-50"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">{formData.bio?.length || 0}/160 characters</p>
            {errors.bio && <p className="text-sm text-red-600 dark:text-red-400">{errors.bio}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Your location"
                className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-50"
              />
              {errors.location && <p className="text-sm text-red-600 dark:text-red-400">{errors.location}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Website
              </Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://yourwebsite.com"
                className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-50"
              />
              {errors.website && <p className="text-sm text-red-600 dark:text-red-400">{errors.website}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </Label>
            <Input
              id="email"
              value={user.email || ""}
              disabled
              className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
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

      {user && (
        <EditProfileDialog
          open={false} // Managed by parent
          onOpenChange={setIsEditProfileDialogOpen}
          profile={{
            id: user.id,
            displayName: user.displayName || "",
            username: user.username || "",
            bio: user.bio || "",
            website: user.website || "",
            location: user.location || "",
            avatarUrl: user.avatarUrl || "",
            coverUrl: user.coverUrl || "",
          }}
          onProfileUpdate={onProfileUpdateFromDialog}
        />
      )}
    </>
  )
}

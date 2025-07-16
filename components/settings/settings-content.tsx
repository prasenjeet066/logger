"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { useSession, signOut } from "next-auth/react"
import { Spinner } from "@/components/loader/spinner"
import { User, Bell, Shield, Palette, Camera, Save, ArrowLeft, AlertCircle, Trash2 } from "lucide-react"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { type UpdateSettingsData, updateSettingsSchema } from "@/lib/validations/settings"
import { updateUserSettings, deleteUserAccount } from "@/app/actions/settings"
import { z } from "zod"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SettingsContentProps {
  initialUser: {
    id: string
    email: string
    username: string
    displayName?: string
    avatarUrl?: string
    coverUrl?: string
    bio?: string
    location?: string
    website?: string
    isVerified?: boolean
    createdAt?: string
    isPrivate?: boolean
    allowMessages?: boolean
    showEmail?: boolean
    emailNotifications?: boolean
    pushNotifications?: boolean
    soundEnabled?: boolean
    darkMode?: boolean
    language?: string
  }
}

export function SettingsContent({ initialUser }: SettingsContentProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMobile()
  const { data: session, update: updateSession } = useSession()

  const [formData, setFormData] = useState<UpdateSettingsData>({
    displayName: initialUser.displayName || "",
    bio: initialUser.bio || "",
    location: initialUser.location || "",
    website: initialUser.website || "",
    isPrivate: initialUser.isPrivate || false,
    allowMessages: initialUser.allowMessages || true,
    showEmail: initialUser.showEmail || false,
    emailNotifications: initialUser.emailNotifications || true,
    pushNotifications: initialUser.pushNotifications || true,
    soundEnabled: initialUser.soundEnabled || true,
    darkMode: initialUser.darkMode || false,
    language: initialUser.language || "en",
  })
  const [originalFormData, setOriginalFormData] = useState<UpdateSettingsData>(formData)
  const [errors, setErrors] = useState<Partial<UpdateSettingsData>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false)
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false)

  useEffect(() => {
    if (session?.user) {
      // Update formData if session user data changes (e.g., after profile dialog update)
      setFormData({
        displayName: session.user.displayName || "",
        bio: session.user.bio || "",
        location: session.user.location || "",
        website: session.user.website || "",
        isPrivate: session.user.isPrivate || false,
        allowMessages: session.user.allowMessages || true,
        showEmail: session.user.showEmail || false,
        emailNotifications: session.user.emailNotifications || true,
        pushNotifications: session.user.pushNotifications || true,
        soundEnabled: session.user.soundEnabled || true,
        darkMode: session.user.darkMode || false,
        language: session.user.language || "en",
      })
      setOriginalFormData({
        displayName: session.user.displayName || "",
        bio: session.user.bio || "",
        location: session.user.location || "",
        website: session.user.website || "",
        isPrivate: session.user.isPrivate || false,
        allowMessages: session.user.allowMessages || true,
        showEmail: session.user.showEmail || false,
        emailNotifications: session.user.emailNotifications || true,
        pushNotifications: session.user.pushNotifications || true,
        soundEnabled: session.user.soundEnabled || true,
        darkMode: session.user.darkMode || false,
        language: session.user.language || "en",
      })
      setLoading(false)
    } else {
      // If session is not available, redirect or show error
      setLoading(false)
      toast({
        title: "Error",
        description: "User session not found. Please sign in.",
        variant: "destructive",
      })
      router.push("/auth/sign-in")
    }
  }, [session, router, toast])

  const hasChanges = useCallback(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalFormData)
  }, [formData, originalFormData])

  const handleChange = useCallback(
    (field: keyof UpdateSettingsData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    },
    [errors],
  )

  const handleProfileUpdateFromDialog = useCallback(
    (updatedProfile: any) => {
      // Update session data with new profile info
      updateSession({
        ...session,
        user: {
          ...session?.user,
          displayName: updatedProfile.displayName,
          bio: updatedProfile.bio,
          location: updatedProfile.location,
          website: updatedProfile.website,
          avatarUrl: updatedProfile.avatarUrl,
          coverUrl: updatedProfile.coverUrl,
        },
      })
      // Also update local form data to reflect changes
      setFormData((prev) => ({
        ...prev,
        displayName: updatedProfile.displayName,
        bio: updatedProfile.bio,
        location: updatedProfile.location,
        website: updatedProfile.website,
      }))
      setOriginalFormData((prev) => ({
        ...prev,
        displayName: updatedProfile.displayName,
        bio: updatedProfile.bio,
        location: updatedProfile.location,
        website: updatedProfile.website,
      }))
    },
    [session, updateSession],
  )

  const saveSettings = async () => {
    setSaving(true)
    setErrors({})

    try {
      const validatedData = updateSettingsSchema.parse(formData)
      const result = await updateUserSettings(validatedData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Settings updated successfully!",
        })
        setOriginalFormData(formData) // Update original to current formData
        // Update session with new settings if needed (e.g., darkMode, language)
        updateSession({
          ...session,
          user: {
            ...session?.user,
            isPrivate: validatedData.isPrivate,
            allowMessages: validatedData.allowMessages,
            showEmail: validatedData.showEmail,
            emailNotifications: validatedData.emailNotifications,
            pushNotifications: validatedData.pushNotifications,
            soundEnabled: validatedData.soundEnabled,
            darkMode: validatedData.darkMode,
            language: validatedData.language,
          },
        })

        // Handle dark mode change
        if (validatedData.darkMode) {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }

        // Handle language change (requires a full page reload or middleware logic)
        if (validatedData.language !== initialUser.language) {
          // This is a simplified redirect. For full i18n, you'd use Next.js middleware
          // to handle locale prefixes in the URL.
          router.push(`/${validatedData.language}${router.pathname}`)
        }
      } else {
        if (result.errors) {
          setErrors(result.errors as Partial<UpdateSettingsData>)
        }
        toast({
          title: "Error",
          description: result.error || "Failed to save settings.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<UpdateSettingsData> = {}
        error.errors.forEach((err) => {
          fieldErrors[err.path[0] as keyof UpdateSettingsData] = err.message
        })
        setErrors(fieldErrors)
      } else {
        console.error("Error saving settings:", error)
        toast({
          title: "Error",
          description: `Failed to save settings: ${error.message}`,
          variant: "destructive",
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/auth/sign-in" })
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) return

    try {
      const result = await deleteUserAccount(session.user.id)
      if (result.success) {
        toast({
          title: "Account Deleted",
          description: "Your account has been permanently deleted.",
        })
        await signOut({ callbackUrl: "/auth/sign-in" })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete account.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred during account deletion.",
        variant: "destructive",
      })
    } finally {
      setIsDeleteAccountDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load user settings. Please ensure you are logged in.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account preferences</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger
              value="profile"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
            >
              <User className="h-4 w-4" />
              {!isMobile && "Profile"}
            </TabsTrigger>
            <TabsTrigger
              value="privacy"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
            >
              <Shield className="h-4 w-4" />
              {!isMobile && "Privacy"}
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
            >
              <Bell className="h-4 w-4" />
              {!isMobile && "Notifications"}
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
            >
              <Palette className="h-4 w-4" />
              {!isMobile && "Appearance"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 cursor-pointer" onClick={() => setIsEditProfileDialogOpen(true)}>
                    <AvatarImage src={session.user.avatarUrl || undefined} />
                    <AvatarFallback className="text-lg">
                      {session.user.displayName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-transparent dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700"
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
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => handleChange("displayName", e.target.value)}
                      placeholder="Your display name"
                    />
                    {errors.displayName && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.displayName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={session.user.username || ""}
                      disabled
                      className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Username cannot be changed</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleChange("bio", e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formData.bio?.length || 0}/160 characters</p>
                  {errors.bio && <p className="text-sm text-red-600 dark:text-red-400">{errors.bio}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                      placeholder="Your location"
                    />
                    {errors.location && <p className="text-sm text-red-600 dark:text-red-400">{errors.location}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                    {errors.website && <p className="text-sm text-red-600 dark:text-red-400">{errors.website}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={session.user.email || ""}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
                </div>

                <Button onClick={saveSettings} disabled={saving || !hasChanges()} className="w-full md:w-auto">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="private-account">Private Account</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Only approved followers can see your posts
                    </p>
                  </div>
                  <Switch
                    id="private-account"
                    checked={formData.isPrivate}
                    onCheckedChange={(checked) => handleChange("isPrivate", checked)}
                  />
                </div>

                <Separator className="bg-gray-200 dark:bg-gray-700" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow-messages">Allow Direct Messages</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Let others send you direct messages</p>
                  </div>
                  <Switch
                    id="allow-messages"
                    checked={formData.allowMessages}
                    onCheckedChange={(checked) => handleChange("allowMessages", checked)}
                  />
                </div>

                <Separator className="bg-gray-200 dark:bg-gray-700" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-email">Show Email in Profile</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Display your email address on your profile
                    </p>
                  </div>
                  <Switch
                    id="show-email"
                    checked={formData.showEmail}
                    onCheckedChange={(checked) => handleChange("showEmail", checked)}
                  />
                </div>
                <Button onClick={saveSettings} disabled={saving || !hasChanges()} className="w-full md:w-auto">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={formData.emailNotifications}
                    onCheckedChange={(checked) => handleChange("emailNotifications", checked)}
                  />
                </div>

                <Separator className="bg-gray-200 dark:bg-gray-700" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive push notifications on your device
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={formData.pushNotifications}
                    onCheckedChange={(checked) => handleChange("pushNotifications", checked)}
                  />
                </div>

                <Separator className="bg-gray-200 dark:bg-gray-700" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sound-enabled">Notification Sounds</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Play sounds for notifications</p>
                  </div>
                  <Switch
                    id="sound-enabled"
                    checked={formData.soundEnabled}
                    onCheckedChange={(checked) => handleChange("soundEnabled", checked)}
                  />
                </div>
                <Button onClick={saveSettings} disabled={saving || !hasChanges()} className="w-full md:w-auto">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Use dark theme for the interface</p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={formData.darkMode}
                    onCheckedChange={(checked) => handleChange("darkMode", checked)}
                  />
                </div>

                <Separator className="bg-gray-200 dark:bg-gray-700" />

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={formData.language}
                    onChange={(e) => handleChange("language", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-gray-50 dark:border-gray-700"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
                <Button onClick={saveSettings} disabled={saving || !hasChanges()} className="w-full md:w-auto">
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Account Actions */}
        <Card className="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Sign Out</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sign out of your account</p>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700 bg-transparent"
              >
                Sign Out
              </Button>
            </div>
            <Separator className="bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-red-600 dark:text-red-400">Delete Account</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all data</p>
              </div>
              <Button variant="destructive" onClick={() => setIsDeleteAccountDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {session?.user && (
        <EditProfileDialog
          open={isEditProfileDialogOpen}
          onOpenChange={setIsEditProfileDialogOpen}
          profile={{
            id: session.user.id,
            displayName: session.user.displayName || "",
            username: session.user.username || "",
            bio: session.user.bio || "",
            website: session.user.website || "",
            location: session.user.location || "",
            avatarUrl: session.user.avatarUrl || "",
            coverUrl: session.user.coverUrl || "",
          }}
          onProfileUpdate={handleProfileUpdateFromDialog}
        />
      )}

      <AlertDialog open={isDeleteAccountDialogOpen} onOpenChange={setIsDeleteAccountDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 border border-gray-200 dark:border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 dark:text-red-400">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              This action cannot be undone. This will permanently delete your account and remove your data from our
              servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

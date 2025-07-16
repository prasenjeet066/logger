"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { useSession, signOut } from "next-auth/react"
import { Spinner } from "@/components/loader/spinner"
import { ArrowLeft, AlertCircle } from "lucide-react"
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

// Import the new modular components
import { ProfileSettings } from "./profile-settings"
import { PrivacySettings } from "./privacy-settings"
import { NotificationSettings } from "./notification-settings"
import { AppearanceSettings } from "./appearance-settings"
import { DangerZoneSettings } from "./danger-zone-settings"
import { EditProfileDialog } from "./edit-profile-dialog" // Declare the EditProfileDialog variable

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
      const currentSessionData: UpdateSettingsData = {
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
      }
      setFormData(currentSessionData)
      setOriginalFormData(currentSessionData)
      setLoading(false)

      // Apply dark mode based on session data
      if (currentSessionData.darkMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    } else {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Spinner />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
        <Alert variant="destructive" className="max-w-md">
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
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-4 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account preferences</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 shadow-inner">
            <TabsTrigger
              value="profile"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary dark:data-[state=active]:text-primary-foreground rounded-md shadow-sm transition-all duration-200"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="privacy"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary dark:data-[state=active]:text-primary-foreground rounded-md shadow-sm transition-all duration-200"
            >
              Privacy
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary dark:data-[state=active]:text-primary-foreground rounded-md shadow-sm transition-all duration-200"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary dark:data-[state=active]:text-primary-foreground rounded-md shadow-sm transition-all duration-200"
            >
              Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSettings
              formData={formData}
              handleChange={handleChange}
              errors={errors}
              saving={saving}
              hasChanges={hasChanges}
              session={session}
              setIsEditProfileDialogOpen={setIsEditProfileDialogOpen}
              onProfileUpdateFromDialog={handleProfileUpdateFromDialog}
              saveSettings={saveSettings}
            />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacySettings
              formData={formData}
              handleChange={handleChange}
              saving={saving}
              hasChanges={hasChanges}
              saveSettings={saveSettings}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings
              formData={formData}
              handleChange={handleChange}
              saving={saving}
              hasChanges={hasChanges}
              saveSettings={saveSettings}
            />
          </TabsContent>

          <TabsContent value="appearance">
            <AppearanceSettings
              formData={formData}
              handleChange={handleChange}
              saving={saving}
              hasChanges={hasChanges}
              saveSettings={saveSettings}
            />
          </TabsContent>
        </Tabs>

        <DangerZoneSettings handleSignOut={handleSignOut} setIsDeleteAccountDialogOpen={setIsDeleteAccountDialogOpen} />
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
        <AlertDialogContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 border border-gray-200 dark:border-gray-800 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 dark:text-red-400 text-xl font-bold">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400 text-base">
              This action cannot be undone. This will permanently delete your account and remove your data from our
              servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 hover:bg-gray-100">
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

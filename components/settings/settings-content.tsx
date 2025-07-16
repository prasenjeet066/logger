"use client"

import { useState, useEffect } from "react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { useSession, signOut } from "next-auth/react"
import Loader from "@/components/loader/loader" // Updated import path
import { User, Bell, Shield, Palette, Camera, Save, ArrowLeft, AlertCircle } from "lucide-react"

interface SettingsContentProps {
  userId: string
}

export function SettingsContent({ userId }: SettingsContentProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMobile()
  const { data: session } = useSession()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")

  // Profile settings
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [location, setLocation] = useState("")
  const [website, setWebsite] = useState("")

  // Privacy settings
  const [isPrivate, setIsPrivate] = useState(false)
  const [allowMessages, setAllowMessages] = useState(true)
  const [showEmail, setShowEmail] = useState(false)

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Appearance settings
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState("en")

  useEffect(() => {
    fetchUserData()
  }, [userId, session])

  const fetchUserData = async () => {
    if (!session?.user) return

    try {
      setLoading(true)

      // Get current user profile
      const response = await fetch("/api/users/current")
      if (!response.ok) throw new Error("Failed to fetch user data")

      const userData = await response.json()
      setUser(userData)
      setProfile(userData)
      setDisplayName(userData.displayName || "")
      setBio(userData.bio || "")
      setLocation(userData.location || "")
      setWebsite(userData.website || "")
      // Set other settings from user data if available
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error",
        description: "Failed to load user settings.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          location,
          website,
          isPrivate,
          allowMessages,
          showEmail,
        }),
      })

      if (!response.ok) throw new Error("Failed to update profile")

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to save profile changes.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/auth/sign-in")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load user settings.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-sm text-gray-500">Manage your account preferences</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {!isMobile && "Profile"}
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {!isMobile && "Privacy"}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {!isMobile && "Notifications"}
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {!isMobile && "Appearance"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="text-lg">
                      {user.displayName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                      <Camera className="h-4 w-4" />
                      Change Photo
                    </Button>
                    <p className="text-sm text-gray-500 mt-1">JPG, PNG or GIF. Max size 5MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={user.username || ""} disabled className="bg-gray-50" />
                    <p className="text-xs text-gray-500">Username cannot be changed</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">{bio.length}/160 characters</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Your location"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email || ""} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <Button onClick={saveProfile} disabled={saving} className="w-full md:w-auto">
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
            <Card>
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
                    <p className="text-sm text-gray-500">Only approved followers can see your posts</p>
                  </div>
                  <Switch id="private-account" checked={isPrivate} onCheckedChange={setIsPrivate} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow-messages">Allow Direct Messages</Label>
                    <p className="text-sm text-gray-500">Let others send you direct messages</p>
                  </div>
                  <Switch id="allow-messages" checked={allowMessages} onCheckedChange={setAllowMessages} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-email">Show Email in Profile</Label>
                    <p className="text-sm text-gray-500">Display your email address on your profile</p>
                  </div>
                  <Switch id="show-email" checked={showEmail} onCheckedChange={setShowEmail} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
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
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-gray-500">Receive push notifications on your device</p>
                  </div>
                  <Switch id="push-notifications" checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sound-enabled">Notification Sounds</Label>
                    <p className="text-sm text-gray-500">Play sounds for notifications</p>
                  </div>
                  <Switch id="sound-enabled" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
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
                    <p className="text-sm text-gray-500">Use dark theme for the interface</p>
                  </div>
                  <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Account Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Sign Out</Label>
                <p className="text-sm text-gray-500">Sign out of your account</p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-red-600">Delete Account</Label>
                <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
              </div>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

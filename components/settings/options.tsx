"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Camera, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Globe, 
  Eye, 
  EyeOff, 
  Shield, 
  Smartphone,
  Trash2,
  AlertTriangle,
  Check
} from "lucide-react"
import { useSession } from "next-auth/react"

export const AccountSettings = () => {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    username: "@johndoe",
    email: session?.user?.email || "",
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    website: "https://johndoe.com",
    bio: "Software developer passionate about creating amazing user experiences.",
    birthDate: "1990-01-15"
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    // Handle save logic here
    setIsEditing(false)
    console.log("Saving profile data:", formData)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Account Information</h2>
        <Button 
          variant={isEditing ? "default" : "outline"}
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
        >
          {isEditing ? "Save Changes" : "Edit Profile"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Avatar className="h-16 w-16">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback>{formData.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">{formData.name}</h3>
              <p className="text-sm text-gray-500">{formData.username}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing && (
            <Button variant="outline" className="w-full" disabled>
              <Camera className="h-4 w-4 mr-2" />
              Change Profile Picture
            </Button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              disabled={!isEditing}
              rows={3}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Birth Date
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange("birthDate", e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const PasswordAndSecuritySettings = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
  }

  const handlePasswordUpdate = () => {
    // Handle password update logic
    console.log("Updating password...")
  }

  const connectedDevices = [
    { name: "iPhone 14 Pro", location: "New York, NY", lastActive: "Now", current: true },
    { name: "MacBook Pro", location: "New York, NY", lastActive: "2 hours ago", current: false },
    { name: "Chrome on Windows", location: "New York, NY", lastActive: "1 day ago", current: false }
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Password and Security</h2>

      {/* Password Change Section */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Keep your account secure by using a strong password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
            />
          </div>

          <Button onClick={handlePasswordUpdate} className="w-full">
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable 2FA</p>
              <p className="text-sm text-gray-500">
                {twoFactorEnabled ? "Two-factor authentication is enabled" : "Secure your account with 2FA"}
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
          </div>
          {twoFactorEnabled && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">Two-factor authentication is active</span>
              </div>
              <Button variant="outline" size="sm" className="mt-2">
                View Recovery Codes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected Devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Connected Devices
          </CardTitle>
          <CardDescription>
            Manage devices that have access to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {connectedDevices.map((device, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {device.name}
                      {device.current && <Badge variant="secondary">Current</Badge>}
                    </p>
                    <p className="text-sm text-gray-500">
                      {device.location} • {device.lastActive}
                    </p>
                  </div>
                </div>
                {!device.current && (
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const PrivacyAndPersonalSettings = () => {
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: true,
    showEmail: false,
    showPhone: false,
    allowMessaging: true,
    showOnlineStatus: true,
    dataCollection: false,
    marketingEmails: true,
    pushNotifications: true,
    emailNotifications: true
  })

  const handleSettingChange = (setting: string, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [setting]: value }))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Privacy and Personal</h2>

      {/* Profile Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Privacy</CardTitle>
          <CardDescription>
            Control who can see your profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="profileVisibility">Public Profile</Label>
              <p className="text-sm text-gray-500">Make your profile visible to everyone</p>
            </div>
            <Switch
              id="profileVisibility"
              checked={privacySettings.profileVisibility}
              onCheckedChange={(value) => handleSettingChange("profileVisibility", value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showEmail">Show Email</Label>
              <p className="text-sm text-gray-500">Display your email on your profile</p>
            </div>
            <Switch
              id="showEmail"
              checked={privacySettings.showEmail}
              onCheckedChange={(value) => handleSettingChange("showEmail", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showPhone">Show Phone</Label>
              <p className="text-sm text-gray-500">Display your phone number on your profile</p>
            </div>
            <Switch
              id="showPhone"
              checked={privacySettings.showPhone}
              onCheckedChange={(value) => handleSettingChange("showPhone", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allowMessaging">Allow Direct Messages</Label>
              <p className="text-sm text-gray-500">Let others send you direct messages</p>
            </div>
            <Switch
              id="allowMessaging"
              checked={privacySettings.allowMessaging}
              onCheckedChange={(value) => handleSettingChange("allowMessaging", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showOnlineStatus">Show Online Status</Label>
              <p className="text-sm text-gray-500">Let others see when you're online</p>
            </div>
            <Switch
              id="showOnlineStatus"
              checked={privacySettings.showOnlineStatus}
              onCheckedChange={(value) => handleSettingChange("showOnlineStatus", value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
          <CardDescription>
            Control how your data is used and stored
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dataCollection">Data Collection</Label>
              <p className="text-sm text-gray-500">Allow collection of usage data for improvement</p>
            </div>
            <Switch
              id="dataCollection"
              checked={privacySettings.dataCollection}
              onCheckedChange={(value) => handleSettingChange("dataCollection", value)}
            />
          </div>

          <Button variant="outline" className="w-full">
            Download My Data
          </Button>

          <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Choose how you want to be notified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="marketingEmails">Marketing Emails</Label>
              <p className="text-sm text-gray-500">Receive emails about new features and updates</p>
            </div>
            <Switch
              id="marketingEmails"
              checked={privacySettings.marketingEmails}
              onCheckedChange={(value) => handleSettingChange("marketingEmails", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="pushNotifications">Push Notifications</Label>
              <p className="text-sm text-gray-500">Receive push notifications on your devices</p>
            </div>
            <Switch
              id="pushNotifications"
              checked={privacySettings.pushNotifications}
              onCheckedChange={(value) => handleSettingChange("pushNotifications", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-gray-500">Receive important updates via email</p>
            </div>
            <Switch
              id="emailNotifications"
              checked={privacySettings.emailNotifications}
              onCheckedChange={(value) => handleSettingChange("emailNotifications", value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
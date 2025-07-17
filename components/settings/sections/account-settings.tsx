"use client"

import { useState,useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Camera, Save, Mail, User, MapPin, Globe, Calendar } from "lucide-react"
import { FileUpload } from "@/components/upload/file-upload"
import type { UploadResult } from "@/lib/blob/client"
interface AccountSettingsProps {
  user: any
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const { toast } = useToast()
  const [uploadedFiles, setUploadedFiles] = useState()
  const [saving, setSaving] = useState(false)
  const [showInageUpload, setShowImageUpload] = useState(false)
  const [U]
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    username: user?.username || "",
    avatarUrl: user?.avatarUrl || "",
    email: user?.email || "",
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || "",
    birthDate: user?.birthDate || "",
  })
  
  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
  
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }
  const handleFilesUploaded = useCallback((files: UploadResult[]) => {
    setUploadedFiles(files[0].url)
    handleInputChange('avatarUrl',uploadedFiles)
    setShowImageUpload(false)
  }, [])
  return (
    <div className="space-y-6">
      {/* Profile Picture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.avatarUrl || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">{user?.displayName?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" className="flex items-center gap-2 bg-transparent" onClick={()=>setShowImageUpload(true)}>
                <Camera className="h-4 w-4" />
                Change Photo
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                Remove Photo
              </Button>
              <p className="text-sm text-gray-500">JPG, PNG or GIF. Max size 5MB. Recommended: 400x400px</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {
        showInageUpload && (
           <FileUpload
                onUploadComplete={handleFilesUploaded}
                maxFiles={1}
                pathPrefix={`posts/${session?.user?.id}`}
                className="w-full"
              />
        )
      }

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleInputChange("displayName", e.target.value)}
                placeholder="Your display name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="@username"
              />
              <p className="text-xs text-gray-500">This is your unique identifier. Choose wisely!</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              maxLength={160}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Brief description for your profile</span>
              <span>{formData.bio.length}/160</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="your.email@example.com"
            />
            <p className="text-xs text-gray-500">We'll use this email for important account notifications</p>
          </div>

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
                placeholder="City, Country"
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
                placeholder="https://yourwebsite.com"
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
            />
            <p className="text-xs text-gray-500">This won't be shown publicly. Used for age-appropriate content.</p>
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
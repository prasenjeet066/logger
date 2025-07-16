"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Camera } from "lucide-react"
import { updateProfileSchema, type UpdateProfileData } from "@/lib/validations/post" // Reusing existing profile schema
import { useToast } from "@/hooks/use-toast"
import z from "zod" // Import zod for validation

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: {
    id: string
    displayName: string
    username: string
    bio?: string
    website?: string
    location?: string
    avatarUrl?: string
    coverUrl?: string
  }
  onProfileUpdate: (profile: any) => void
}

export function EditProfileDialog({ open, onOpenChange, profile, onProfileUpdate }: EditProfileDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<UpdateProfileData>({
    displayName: profile?.displayName || "",
    bio: profile?.bio || "",
    website: profile?.website || "",
    location: profile?.location || "",
  })
  const [errors, setErrors] = useState<Partial<UpdateProfileData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "")
  const [coverUrl, setCoverUrl] = useState(profile?.coverUrl || "")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  useEffect(() => {
    if (open) {
      setFormData({
        displayName: profile?.displayName || "",
        bio: profile?.bio || "",
        website: profile?.website || "",
        location: profile?.location || "",
      })
      setAvatarUrl(profile?.avatarUrl || "")
      setCoverUrl(profile?.coverUrl || "")
      setErrors({})
    }
  }, [open, profile])

  const uploadImage = async (file: File, type: "avatar" | "cover") => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)
    formData.append("userId", profile.id) // Pass user ID for unique file naming

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to upload image")
    }

    const data = await response.json()
    return data.publicUrl
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5 MB.",
        variant: "destructive",
      })
      return
    }

    try {
      if (type === "avatar") {
        setUploadingAvatar(true)
      } else {
        setUploadingCover(true)
      }

      const imageUrl = await uploadImage(file, type)

      if (type === "avatar") {
        setAvatarUrl(imageUrl)
      } else {
        setCoverUrl(imageUrl)
      }
      toast({
        title: "Success",
        description: `${type === "avatar" ? "Profile" : "Cover"} image uploaded successfully!`,
      })
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Error",
        description: `Failed to upload image: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      if (type === "avatar") {
        setUploadingAvatar(false)
      } else {
        setUploadingCover(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const validatedData = updateProfileSchema.parse(formData)

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: validatedData.displayName,
          bio: validatedData.bio || null,
          website: validatedData.website || null,
          location: validatedData.location || null,
          avatarUrl: avatarUrl || null,
          coverUrl: coverUrl || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update profile")
      }

      const updatedProfile = await response.json()
      onProfileUpdate(updatedProfile)
      onOpenChange(false)
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      })
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<UpdateProfileData> = {}
        error.errors.forEach((err) => {
          fieldErrors[err.path[0] as keyof UpdateProfileData] = err.message
        })
        setErrors(fieldErrors)
      } else {
        console.error("Error updating profile:", error)
        toast({
          title: "Error",
          description: `Failed to save profile: ${error.message}`,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange =
    (field: keyof UpdateProfileData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label>Cover Photo</Label>
            <div className="relative">
              <div
                className="w-full h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                onClick={() => document.getElementById("cover-upload")?.click()}
              >
                {uploadingCover ? (
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                ) : (
                  <Camera className="h-8 w-8 text-white" />
                )}
              </div>
              <input
                id="cover-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, "cover")}
                disabled={uploadingCover}
              />
            </div>
          </div>

          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar
                  className="w-20 h-20 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                >
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl">
                    {formData.displayName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
                <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1">
                  <Camera className="h-3 w-3 text-white" />
                </div>
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, "avatar")}
                disabled={uploadingAvatar}
              />
              <div className="text-sm text-gray-500">
                <p>Click to upload photo</p>
                <p>Max size: 5 MB</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={handleChange("displayName")}
              placeholder="Your display name"
              disabled={isLoading}
            />
            {errors.displayName && <p className="text-sm text-red-600">{errors.displayName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={handleChange("bio")}
              placeholder="Tell us about yourself..."
              disabled={isLoading}
              rows={3}
            />
            {errors.bio && <p className="text-sm text-red-600">{errors.bio}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={handleChange("location")}
              placeholder="Your location"
              disabled={isLoading}
            />
            {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={handleChange("website")}
              placeholder="https://example.com"
              disabled={isLoading}
            />
            {errors.website && <p className="text-sm text-red-600">{errors.website}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || uploadingAvatar || uploadingCover}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

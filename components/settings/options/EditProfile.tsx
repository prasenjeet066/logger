"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateProfileSchema, type UpdateProfileData } from "@/lib/validations/post"
import { Loader2, Camera } from "lucide-react"

// Redux imports
import { useAppDispatch, useAppSelector } from "@/store/main"
import { updateProfile, uploadImage } from "@/store/slices/profileSlice"

interface EditProfileProps {
  user: any
}

export default function EditProfile({ user }: EditProfileProps) {
  const dispatch = useAppDispatch()
  const { isUpdating, uploadingAvatar, uploadingCover, error } = useAppSelector((state) => state.profile)
  
  const [formData, setFormData] = useState<UpdateProfileData>({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    website: user?.website || "",
    location: user?.location || "",
  })
  const [errors, setErrors] = useState<Partial<UpdateProfileData>>({})
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "")
  const [coverUrl, setCoverUrl] = useState(user?.coverUrl || "")
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB")
      return
    }
    
    try {
      const result = await dispatch(uploadImage({ file, type })).unwrap()
      
      if (type === "avatar") {
        setAvatarUrl(result.url)
      } else {
        setCoverUrl(result.url)
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Failed to upload image")
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    try {
      // Validate form data
      const validatedData = updateProfileSchema.parse(formData)
      
      // Prepare the complete update data including images
      const updateData = {
        ...validatedData,
        avatarUrl: avatarUrl,
        coverUrl: coverUrl,
      }
      
      await dispatch(updateProfile(updateData)).unwrap()
      
      // Show success message or redirect
      alert("Profile updated successfully!")
      
    } catch (error: any) {
      console.error("Profile update error:", error)
      
      if (error.name === 'ZodError') {
        // Handle Zod validation errors
        const fieldErrors: Partial<UpdateProfileData> = {}
        error.errors?.forEach((err: any) => {
          if (err.path && err.path[0]) {
            fieldErrors[err.path[0] as keyof UpdateProfileData] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        // Handle other errors
        alert(error.message || 'Failed to update profile')
      }
    }
  }
  
  const handleChange = (field: keyof UpdateProfileData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <p className="text-gray-600">Update your profile information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Image Upload */}
        <div className="space-y-2">
          <Label>Cover Photo</Label>
          <div className="relative">
            <div
              className="w-full h-48 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
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
                <div className="text-center text-white">
                  <Camera className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Click to upload cover photo</p>
                </div>
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
          <Label>Profile Picture</Label>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar
                className="w-24 h-24 cursor-pointer hover:opacity-80 transition-opacity"
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
              <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2">
                <Camera className="h-4 w-4 text-white" />
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
              <p>Click to upload profile picture</p>
              <p>Maximum size: 5MB</p>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={handleChange("displayName")}
              placeholder="Your display name"
              disabled={isUpdating}
            />
            {errors.displayName && <p className="text-sm text-red-600">{errors.displayName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={handleChange("bio")}
              placeholder="Tell us about yourself"
              disabled={isUpdating}
              rows={4}
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
              disabled={isUpdating}
            />
            {errors.location && (<p className="text-sm text-red-600">{errors.location}</p>)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={handleChange("website")}
              placeholder="https://example.com"
              disabled={isUpdating}
            />
            {errors.website && <p className="text-sm text-red-600">{errors.website}</p>}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t">
          <Button 
            type="submit" 
            disabled={isUpdating || uploadingAvatar || uploadingCover}
            className="min-w-[120px]"
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
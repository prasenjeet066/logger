"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateProfileSchema, type UpdateProfileData } from "@/lib/validations/post"
import { Loader2, Camera } from "lucide-react"

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: any
  onProfileUpdate: (profile: any) => void
}

export function EditProfileDialog({ open, onOpenChange, profile, onProfileUpdate }: EditProfileDialogProps) {
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
  
  const uploadImage = async (file: File, type: "avatar" | "cover"): Promise<string> => {
    const formData = new FormData()
    formData.append("files", file)
  
    try {
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (uploadResponse.ok) {
        const responseData = await uploadResponse.json()
        return responseData.files[0].url
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file
    if (!file.type.startsWith("image/")) {
      alert("অনুগ্রহ করে একটি ছবি নির্বাচন করুন")
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert("ছবির সাইজ ৫ MB এর কম হতে হবে")
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
    } catch (error) {
      console.error("Upload error:", error)
      alert("ছবি আপলোড করতে সমস্যা হয়েছে")
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
      // Validate form data
      const validatedData = updateProfileSchema.parse(formData)
      
      // Prepare the complete update data including images
      const updateData = {
        ...validatedData,
        avatarUrl: avatarUrl,
        // Add coverUrl if your backend supports it
        // coverUrl: coverUrl,
      }
      
      const response = await fetch('/api/users/profile', {
        method: 'PUT', // Changed from POST to PUT as per your API route
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }
      
      const updatedProfile = await response.json()
      
      // Update the parent component with the new profile data
      onProfileUpdate({
        ...updatedProfile,
        avatarUrl: avatarUrl,
        coverUrl: coverUrl,
      })
      
      // Close the dialog
      onOpenChange(false)
      
    } catch (error) {
      console.error("Profile update error:", error)
      
      if (error instanceof Error) {
        // Handle Zod validation errors
        try {
          const zodError = JSON.parse(error.message)
          if (Array.isArray(zodError)) {
            const fieldErrors: Partial<UpdateProfileData> = {}
            zodError.forEach((err: any) => {
              fieldErrors[err.path[0] as keyof UpdateProfileData] = err.message
            })
            setErrors(fieldErrors)
          } else {
            // Handle other errors
            alert(error.message || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে')
          }
        } catch {
          // Not a JSON error, show the error message
          alert(error.message || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে')
        }
      } else {
        alert('প্রোফাইল আপডেট করতে সমস্যা হয়েছে')
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleChange = (field: keyof UpdateProfileData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bengali-font max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Your Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label>Cover</Label>
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
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar
                  className="w-20 h-20 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                >
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl">
                    {formData.displayName?.charAt(0)?.toUpperCase() || "ব"}
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
                <p>ছবি আপলোড করতে ক্লিক করুন</p>
                <p>সর্বোচ্চ সাইজ: ৫ MB</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">প্রদর্শনী নাম</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={handleChange("displayName")}
              placeholder="আপনার প্রদর্শনী নাম"
              disabled={isLoading}
            />
            {errors.displayName && <p className="text-sm text-red-600">{errors.displayName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">বায়ো</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={handleChange("bio")}
              placeholder="নিজের সম্পর্কে লিখুন"
              disabled={isLoading}
              rows={3}
            />
            {errors.bio && <p className="text-sm text-red-600">{errors.bio}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">অবস্থান</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={handleChange("location")}
              placeholder="আপনার অবস্থান"
              disabled={isLoading}
            />
            {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">ওয়েবসাইট</Label>
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
              বাতিল
            </Button>
            <Button type="submit" disabled={isLoading || uploadingAvatar || uploadingCover}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}